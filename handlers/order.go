package handlers

import (
	"bookstore/middleware"
	"bookstore/models"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// OrderHandler handles order operations
type OrderHandler struct {
	ordersCollection        *mongo.Collection
	orderItemsCollection    *mongo.Collection
	bookFormatsCollection   *mongo.Collection
	digitalAccessCollection *mongo.Collection
}

// NewOrderHandler creates a new order handler
func NewOrderHandler(
	ordersCollection,
	orderItemsCollection,
	bookFormatsCollection,
	digitalAccessCollection *mongo.Collection,
) *OrderHandler {
	return &OrderHandler{
		ordersCollection:        ordersCollection,
		orderItemsCollection:    orderItemsCollection,
		bookFormatsCollection:   bookFormatsCollection,
		digitalAccessCollection: digitalAccessCollection,
	}
}

// CreateOrder creates a new order
// POST /orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Calculate total and prepare order items
	var totalAmount float64
	var orderItems []models.OrderItem
	var digitalFormats []models.OrderItem // Separate handling for digital/audio books

	for _, item := range req.Items {
		// Get format details
		var format models.BookFormat
		err := h.bookFormatsCollection.FindOne(ctx, bson.M{"_id": item.FormatID}).Decode(&format)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Format not found: " + item.FormatID.Hex()})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			}
			return
		}

		// Check stock
		if format.StockQuantity < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock for format: " + format.Type})
			return
		}

		itemTotal := format.Price * float64(item.Quantity)
		totalAmount += itemTotal

		orderItem := models.OrderItem{
			FormatID:        item.FormatID,
			Quantity:        item.Quantity,
			PriceAtPurchase: format.Price,
			CreatedAt:       time.Now(),
		}
		orderItems = append(orderItems, orderItem)

		if format.Type == "Digital" || format.Type == "Audio" {
			digitalFormats = append(digitalFormats, orderItem)
		}
	}

	// Create order
	order := models.Order{
		UserID:      userID,
		OrderDate:   time.Now(),
		Status:      "Pending",
		TotalAmount: totalAmount,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	orderResult, err := h.ordersCollection.InsertOne(ctx, order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	orderID := orderResult.InsertedID.(primitive.ObjectID)

	// Insert order items
	for i := range orderItems {
		orderItems[i].OrderID = orderID
	}

	var itemDocs []interface{}
	for _, item := range orderItems {
		itemDocs = append(itemDocs, item)
	}

	_, err = h.orderItemsCollection.InsertMany(ctx, itemDocs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
		return
	}

	// Create digital access records for digital/audio books
	for _, digitalItem := range digitalFormats {
		accessURL := "https://library.bookstore.com/access/" + orderID.Hex() + "/" + digitalItem.FormatID.Hex()

		digitalAccess := models.DigitalAccess{
			UserID:            userID,
			FormatID:          digitalItem.FormatID,
			AccessGrantedDate: time.Now(),
			// Set expiry date to 1 year from now for digital books
			ExpiryDate: &[]time.Time{time.Now().AddDate(1, 0, 0)}[0],
			AccessURL:  accessURL,
			CreatedAt:  time.Now(),
		}

		_, err := h.digitalAccessCollection.InsertOne(ctx, digitalAccess)
		if err != nil {
			// Log error but don't fail the order
			continue
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Order created successfully",
		"order_id":     orderID,
		"total_amount": totalAmount,
	})
}

// GetUserOrders returns all orders for the current user
// GET /orders
func (h *OrderHandler) GetUserOrders(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := h.ordersCollection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	defer cursor.Close(ctx)

	var orders []models.OrderResponse

	for cursor.Next(ctx) {
		var order models.Order
		if err := cursor.Decode(&order); err != nil {
			continue
		}

		// Get order items
		itemCursor, err := h.orderItemsCollection.Find(ctx, bson.M{"order_id": order.ID})
		if err != nil {
			continue
		}

		var items []models.OrderItemResponse
		if err = itemCursor.All(ctx, &items); err != nil {
			itemCursor.Close(ctx)
			continue
		}
		itemCursor.Close(ctx)

		if items == nil {
			items = []models.OrderItemResponse{}
		}

		orders = append(orders, models.OrderResponse{
			ID:          order.ID,
			UserID:      order.UserID,
			OrderDate:   order.OrderDate,
			Status:      order.Status,
			TotalAmount: order.TotalAmount,
			Items:       items,
			CreatedAt:   order.CreatedAt,
			UpdatedAt:   order.UpdatedAt,
		})
	}

	if orders == nil {
		orders = []models.OrderResponse{}
	}

	c.JSON(http.StatusOK, orders)
}

// GetAllOrders returns all orders (Admin only)
// GET /admin/orders
func (h *OrderHandler) GetAllOrders(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := h.ordersCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	defer cursor.Close(ctx)

	var orders []models.OrderResponse

	for cursor.Next(ctx) {
		var order models.Order
		if err := cursor.Decode(&order); err != nil {
			continue
		}

		// Get order items
		itemCursor, err := h.orderItemsCollection.Find(ctx, bson.M{"order_id": order.ID})
		if err != nil {
			continue
		}

		var items []models.OrderItemResponse
		if err = itemCursor.All(ctx, &items); err != nil {
			itemCursor.Close(ctx)
			continue
		}
		itemCursor.Close(ctx)

		if items == nil {
			items = []models.OrderItemResponse{}
		}

		orders = append(orders, models.OrderResponse{
			ID:          order.ID,
			UserID:      order.UserID,
			OrderDate:   order.OrderDate,
			Status:      order.Status,
			TotalAmount: order.TotalAmount,
			Items:       items,
			CreatedAt:   order.CreatedAt,
			UpdatedAt:   order.UpdatedAt,
		})
	}

	if orders == nil {
		orders = []models.OrderResponse{}
	}

	c.JSON(http.StatusOK, orders)
}

// UpdateOrderStatus updates order status (Admin only)
// PUT /admin/orders/:id
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.ordersCollection.UpdateOne(
		ctx,
		bson.M{"_id": orderID},
		bson.M{"$set": bson.M{
			"status":     req.Status,
			"updated_at": time.Now(),
		}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
}

// CancelOrder cancels an order (Customer can cancel their own)
// DELETE /orders/:id
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	orderID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check order belongs to user
	var order models.Order
	err = h.ordersCollection.FindOne(ctx, bson.M{"_id": orderID}).Decode(&order)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot cancel other user's order"})
		return
	}

	if order.Status == "Cancelled" || order.Status == "Completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel order with status: " + order.Status})
		return
	}

	// Cancel order
	result, err := h.ordersCollection.UpdateOne(
		ctx,
		bson.M{"_id": orderID},
		bson.M{"$set": bson.M{
			"status":     "Cancelled",
			"updated_at": time.Now(),
		}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order cancelled successfully"})
}
