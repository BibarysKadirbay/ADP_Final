package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Claims struct {
	UserID    primitive.ObjectID `json:"user_id"`
	Email     string             `json:"email"`
	Role      string             `json:"role"`
	IsPremium bool               `json:"is_premium"`
	jwt.RegisteredClaims
}

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}
		tokenString := parts[1]
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		claims, ok := token.Claims.(*Claims)
		if !ok || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("is_premium", claims.IsPremium)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return roleMiddleware("Admin")
}

func ModeratorOrAdminMiddleware() gin.HandlerFunc {
	return roleMiddleware("Admin", "Moderator")
}

func roleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}
		roleStr := role.(string)
		for _, r := range allowedRoles {
			if roleStr == r {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

func GetUserIDFromContext(c *gin.Context) (primitive.ObjectID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return primitive.ObjectID{}, fmt.Errorf("user_id not found in context")
	}

	id, ok := userID.(primitive.ObjectID)
	if !ok {
		return primitive.ObjectID{}, fmt.Errorf("invalid user_id type")
	}

	return id, nil
}

func GetRoleFromContext(c *gin.Context) string {
	role, exists := c.Get("role")
	if !exists {
		return ""
	}
	return role.(string)
}
