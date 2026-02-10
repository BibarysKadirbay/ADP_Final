package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Order struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"user_id" json:"user_id"`
	TotalAmount     float64            `bson:"total_amount" json:"total_amount"`
	Status          string             `bson:"status" json:"status"`
	ItemCount       int                `bson:"item_count" json:"item_count"`
	DeliveryStatus  string             `bson:"delivery_status,omitempty" json:"delivery_status,omitempty"`
	DeliveryAddress string             `bson:"delivery_address,omitempty" json:"delivery_address,omitempty"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

type OrderItem struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderID    primitive.ObjectID `bson:"order_id" json:"order_id"`
	BookID     primitive.ObjectID `bson:"book_id" json:"book_id"`
	FormatType string             `bson:"format_type" json:"format_type"`
	Quantity   int                `bson:"quantity" json:"quantity"`
	Price      float64            `bson:"price" json:"price"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
}

type CreateOrderRequest struct {
	Items []struct {
		BookID     string `json:"book_id" binding:"required"`
		FormatType string `json:"format_type" binding:"required,oneof=physical digital both"`
		Quantity   int    `json:"quantity" binding:"required,gt=0"`
	} `json:"items" binding:"required"`
	DeliveryAddress string `json:"delivery_address"`
}

type OrderItemInput struct {
	FormatID primitive.ObjectID `json:"format_id" binding:"required"`
	Quantity int                `json:"quantity" binding:"required,gt=0"`
}

type OrderResponse struct {
	ID              primitive.ObjectID  `json:"id"`
	UserID          primitive.ObjectID  `json:"user_id"`
	Status          string              `json:"status"`
	TotalAmount     float64             `json:"total_amount"`
	Items           []OrderItemResponse `json:"items"`
	DeliveryStatus  string              `json:"delivery_status,omitempty"`
	DeliveryAddress string              `json:"delivery_address,omitempty"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

type OrderItemResponse struct {
	ID         primitive.ObjectID `json:"id"`
	BookID     primitive.ObjectID `json:"book_id"`
	FormatType string             `json:"format_type"`
	Quantity   int                `json:"quantity"`
	Price      float64            `json:"price"`
	CreatedAt  time.Time          `json:"created_at"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=Pending Completed Cancelled"`
}
