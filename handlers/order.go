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

type OrderHandler struct {
	ordersCollection        *mongo.Collection
	orderItemsCollection    *mongo.Collection
	booksCollection         *mongo.Collection
	digitalAccessCollection *mongo.Collection
	usersCollection         *mongo.Collection
}

func NewOrderHandler(
	ordersCollection,
	orderItemsCollection,
	booksCollection,
	digitalAccessCollection *mongo.Collection,
	usersCollection *mongo.Collection,
) *OrderHandler {
	return &OrderHandler{
		ordersCollection:        ordersCollection,
		orderItemsCollection:    orderItemsCollection,
		booksCollection:         booksCollection,
		digitalAccessCollection: digitalAccessCollection,
		usersCollection:         usersCollection, // will be set separately
	}
}

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

	var totalAmount float64
	var orderItems []models.OrderItem
	var digitalFormats []models.OrderItem

	for _, item := range req.Items {
		bookID, err := primitive.ObjectIDFromHex(item.BookID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
			return
		}

		var book models.Book
		err = h.booksCollection.FindOne(ctx, bson.M{"_id": bookID}).Decode(&book)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Book not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			}
			return
		}

		var format models.BookFormat
		found := false
		for _, f := range book.Formats {
			if f.Type == item.FormatType {
				format = f
				found = true
				break
			}
		}

		if !found {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format not available for this book"})
			return
		}

		if format.StockQuantity < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock for format: " + format.Type})
			return
		}

		itemTotal := format.Price * float64(item.Quantity)
		totalAmount += itemTotal

		orderItem := models.OrderItem{
			BookID:     bookID,
			FormatType: item.FormatType,
			Quantity:   item.Quantity,
			Price:      format.Price,
			CreatedAt:  time.Now(),
		}
		orderItems = append(orderItems, orderItem)

		if item.FormatType == "digital" || item.FormatType == "both" {
			digitalFormats = append(digitalFormats, orderItem)
		}
	}

	// apply premium discount if user has premium
	discount := 0.0
	if v, exists := c.Get("is_premium"); exists {
		if isPremium, ok := v.(bool); ok && isPremium {
			discount = 0.10 // 10% discount for premium users
		}
	}
	if h.usersCollection != nil {
		var user models.User
		err := h.usersCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
		if err == nil {
			_, loyaltyDiscount, _ := middleware.GetLoyaltyLevel(user.LoyaltyPoints)
			// stack discounts: first premium, then loyalty
			discount = discount + (loyaltyDiscount * (1 - discount))
		}
	}

	discountedTotal := totalAmount * (1 - discount)

	order := models.Order{
		UserID:          userID,
		Status:          "Pending",
		TotalAmount:     discountedTotal,
		ItemCount:       len(orderItems),
		DeliveryAddress: req.DeliveryAddress,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	orderResult, err := h.ordersCollection.InsertOne(ctx, order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	orderID := orderResult.InsertedID.(primitive.ObjectID)

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

	// Award loyalty points (1 point per $1 spent, before discount)
	if h.usersCollection != nil {
		pointsEarned := int(totalAmount)
		_, _ = h.usersCollection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
			"$inc": bson.M{"loyalty_points": pointsEarned},
		})
	}

	for _, digitalItem := range digitalFormats {
		accessURL := "https://library.bookstore.com/access/" + orderID.Hex()

		digitalAccess := models.DigitalAccess{
			UserID:            userID,
			BookID:            digitalItem.BookID,
			FormatType:        digitalItem.FormatType,
			AccessGrantedDate: time.Now(),
			ExpiryDate:        &[]time.Time{time.Now().AddDate(1, 0, 0)}[0],
			AccessURL:         accessURL,
			CreatedAt:         time.Now(),
		}

		_, err := h.digitalAccessCollection.InsertOne(ctx, digitalAccess)
		if err != nil {
			continue
		}
	}

	// Create library entries for physical formats so library shows purchased physical books
	for _, item := range orderItems {
		if item.FormatType == "physical" {
			digitalAccess := models.DigitalAccess{
				UserID:            userID,
				BookID:            item.BookID,
				FormatType:        "physical",
				AccessGrantedDate: time.Now(),
				AccessURL:         "",
				CreatedAt:         time.Now(),
			}

			_, _ = h.digitalAccessCollection.InsertOne(ctx, digitalAccess)
		}
	}

	// Decrease stock for purchased items
	for _, item := range orderItems {
		// decrement the matching format stock quantity
		_, _ = h.booksCollection.UpdateOne(ctx, bson.M{"_id": item.BookID, "formats.type": item.FormatType}, bson.M{
			"$inc": bson.M{"formats.$.stock_quantity": -item.Quantity},
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Order created successfully",
		"order_id":     orderID,
		"total_amount": totalAmount,
	})
}

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
			ID:              order.ID,
			UserID:          order.UserID,
			Status:          order.Status,
			TotalAmount:     order.TotalAmount,
			Items:           items,
			DeliveryStatus:  order.DeliveryStatus,
			DeliveryAddress: order.DeliveryAddress,
			CreatedAt:       order.CreatedAt,
			UpdatedAt:       order.UpdatedAt,
		})
	}

	if orders == nil {
		orders = []models.OrderResponse{}
	}

	c.JSON(http.StatusOK, orders)
}

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
			ID:              order.ID,
			UserID:          order.UserID,
			Status:          order.Status,
			TotalAmount:     order.TotalAmount,
			Items:           items,
			DeliveryStatus:  order.DeliveryStatus,
			DeliveryAddress: order.DeliveryAddress,
			CreatedAt:       order.CreatedAt,
			UpdatedAt:       order.UpdatedAt,
		})
	}

	if orders == nil {
		orders = []models.OrderResponse{}
	}

	c.JSON(http.StatusOK, orders)
}

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

func (h *OrderHandler) GetOrderByID(c *gin.Context) {
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

	// Users can only see their own orders; admins can see all
	isAdmin := false
	if v, exists := c.Get("role"); exists {
		if role, ok := v.(string); ok && role == "Admin" {
			isAdmin = true
		}
	}

	if !isAdmin && order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot view other user's order"})
		return
	}

	itemCursor, err := h.orderItemsCollection.Find(ctx, bson.M{"order_id": orderID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order items"})
		return
	}

	var items []models.OrderItemResponse
	if err = itemCursor.All(ctx, &items); err != nil {
		itemCursor.Close(ctx)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode order items"})
		return
	}
	itemCursor.Close(ctx)

	if items == nil {
		items = []models.OrderItemResponse{}
	}

	response := models.OrderResponse{
		ID:              order.ID,
		UserID:          order.UserID,
		Status:          order.Status,
		TotalAmount:     order.TotalAmount,
		Items:           items,
		DeliveryStatus:  order.DeliveryStatus,
		DeliveryAddress: order.DeliveryAddress,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

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
