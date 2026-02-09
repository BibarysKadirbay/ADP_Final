package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AdminHandler struct {
	usersCollection  *mongo.Collection
	booksCollection  *mongo.Collection
	ordersCollection *mongo.Collection
}

func NewAdminHandler(usersCol, booksCol, ordersCol *mongo.Collection) *AdminHandler {
	return &AdminHandler{
		usersCollection:  usersCol,
		booksCollection:  booksCol,
		ordersCollection: ordersCol,
	}
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	totalUsers, _ := h.usersCollection.CountDocuments(ctx, bson.M{})
	totalBooks, _ := h.booksCollection.CountDocuments(ctx, bson.M{})
	totalOrders, _ := h.ordersCollection.CountDocuments(ctx, bson.M{})
	premiumUsers, _ := h.usersCollection.CountDocuments(ctx, bson.M{"is_premium": true})
	admins, _ := h.usersCollection.CountDocuments(ctx, bson.M{"role": "Admin"})
	moderators, _ := h.usersCollection.CountDocuments(ctx, bson.M{"role": "Moderator"})
	pendingOrders, _ := h.ordersCollection.CountDocuments(ctx, bson.M{"status": "Pending"})
	completedOrders, _ := h.ordersCollection.CountDocuments(ctx, bson.M{"status": "Completed"})
	cancelledOrders, _ := h.ordersCollection.CountDocuments(ctx, bson.M{"status": "Cancelled"})

	var revenueResult struct {
		Total float64 `bson:"total"`
	}
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.M{"status": "Completed"}}},
		bson.D{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: nil},
			{Key: "total", Value: bson.D{{Key: "$sum", Value: "$total_amount"}}},
		}}},
	}
	cursor, _ := h.ordersCollection.Aggregate(ctx, pipeline)
	if cursor.Next(ctx) {
		cursor.Decode(&revenueResult)
		cursor.Close(ctx)
	}

	c.JSON(http.StatusOK, gin.H{
		"total_users":       totalUsers,
		"total_books":       totalBooks,
		"total_orders":      totalOrders,
		"premium_users":     premiumUsers,
		"total_revenue":     revenueResult.Total,
		"admins":            admins,
		"moderators":        moderators,
		"pending_orders":    pendingOrders,
		"completed_orders":  completedOrders,
		"cancelled_orders":  cancelledOrders,
	})
}

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := h.usersCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var users []bson.M
	if err = cursor.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, user := range users {
		delete(user, "password")
	}

	c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) DeactivateUser(c *gin.Context) {
	userID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(userID)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.usersCollection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"is_active": false},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated"})
}

func (h *AdminHandler) UpgradeToPremium(c *gin.Context) {
	userID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(userID)

	var req struct {
		Days int `json:"days" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	premiumUntil := time.Now().AddDate(0, 0, req.Days)
	_, err := h.usersCollection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{
			"is_premium":    true,
			"premium_until": premiumUntil,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User upgraded to premium", "premium_until": premiumUntil})
}

func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(userID)
	var req struct {
		Role string `json:"role" binding:"required,oneof=customer Moderator Admin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := h.usersCollection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"role": req.Role},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User role updated"})
}

func (h *AdminHandler) GetAllOrders(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := h.ordersCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var orders []bson.M
	if err = cursor.All(ctx, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func (h *AdminHandler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(orderID)

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.ordersCollection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{"status": req.Status},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated"})
}
