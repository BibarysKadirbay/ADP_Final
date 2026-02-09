package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Order represents a customer order
type Order struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID `bson:"user_id" json:"user_id"`
	OrderDate   time.Time          `bson:"order_date" json:"order_date"`
	Status      string             `bson:"status" json:"status"` // "Pending", "Completed", "Cancelled"
	TotalAmount float64            `bson:"total_amount" json:"total_amount"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderID         primitive.ObjectID `bson:"order_id" json:"order_id"`
	FormatID        primitive.ObjectID `bson:"format_id" json:"format_id"`
	Quantity        int                `bson:"quantity" json:"quantity"`
	PriceAtPurchase float64            `bson:"price_at_purchase" json:"price_at_purchase"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
}

// CreateOrderRequest represents the request body for creating an order
type CreateOrderRequest struct {
	Items []OrderItemInput `json:"items" binding:"required"`
}

// OrderItemInput represents an item input for order creation
type OrderItemInput struct {
	FormatID primitive.ObjectID `json:"format_id" binding:"required"`
	Quantity int                `json:"quantity" binding:"required,gt=0"`
}

// OrderResponse represents the response for an order with items
type OrderResponse struct {
	ID          primitive.ObjectID  `json:"id"`
	UserID      primitive.ObjectID  `json:"user_id"`
	OrderDate   time.Time           `json:"order_date"`
	Status      string              `json:"status"`
	TotalAmount float64             `json:"total_amount"`
	Items       []OrderItemResponse `json:"items"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
}

// OrderItemResponse represents an item in order response
type OrderItemResponse struct {
	ID              primitive.ObjectID `json:"id"`
	FormatID        primitive.ObjectID `json:"format_id"`
	Quantity        int                `json:"quantity"`
	PriceAtPurchase float64            `json:"price_at_purchase"`
	CreatedAt       time.Time          `json:"created_at"`
}

// UpdateOrderStatusRequest represents the request to update order status
type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=Pending Completed Cancelled"`
}
