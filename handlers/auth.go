package handlers

import (
	"bookstore/middleware"
	"bookstore/models"
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	usersCollection *mongo.Collection
	jwtSecret       string
}

func NewAuthHandler(usersCollection *mongo.Collection, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		usersCollection: usersCollection,
		jwtSecret:       jwtSecret,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	existingUser := h.usersCollection.FindOne(ctx, bson.M{"$or": []bson.M{
		{"email": req.Email},
		{"username": req.Username},
	}})

	if existingUser.Err() == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email or username already exists"})
		return
	}

	// server-side extra validation: no whitespace in password
	if strings.ContainsAny(req.Password, " \t\n") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must not contain whitespace"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	newUser := models.User{
		Username:     req.Username,
		Email:        req.Email,
		Password:     string(hashedPassword),
		Role:         "Customer",
		IsPremium:    false,
		PremiumUntil: time.Now(),
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	result, err := h.usersCollection.InsertOne(ctx, newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user_id": result.InsertedID,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := h.usersCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	loyaltyLevel, _, _ := middleware.GetLoyaltyLevel(user.LoyaltyPoints)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, middleware.Claims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		IsPremium: user.IsPremium,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := models.LoginResponse{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		Role:          user.Role,
		Token:         tokenString,
		IsPremium:     user.IsPremium,
		PremiumUntil:  user.PremiumUntil,
		LoyaltyLevel:  loyaltyLevel,
		LoyaltyPoints: user.LoyaltyPoints,
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err = h.usersCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// compute loyalty level from points
	loyaltyLevel, loyaltyDiscount, _ := middleware.GetLoyaltyLevel(user.LoyaltyPoints)

	c.JSON(http.StatusOK, gin.H{
		"id":               user.ID,
		"username":         user.Username,
		"email":            user.Email,
		"role":             user.Role,
		"is_premium":       user.IsPremium,
		"premium_until":    user.PremiumUntil,
		"loyalty_points":   user.LoyaltyPoints,
		"loyalty_level":    loyaltyLevel,
		"loyalty_discount": loyaltyDiscount,
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// check if new username/email already exist in another user
	if req.Username != "" {
		count, _ := h.usersCollection.CountDocuments(ctx, bson.M{
			"username": req.Username,
			"_id":      bson.M{"$ne": userID},
		})
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
	}

	if req.Email != "" {
		count, _ := h.usersCollection.CountDocuments(ctx, bson.M{
			"email": req.Email,
			"_id":   bson.M{"$ne": userID},
		})
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already taken"})
			return
		}
	}

	update := bson.M{}
	if req.Username != "" {
		update["username"] = req.Username
	}
	if req.Email != "" {
		update["email"] = req.Email
	}
	update["updated_at"] = time.Now()

	if len(update) == 1 { // only updated_at
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	_, err = h.usersCollection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}
