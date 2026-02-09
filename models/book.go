package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Book represents a book in the bookstore
type Book struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title"`
	Author      string             `bson:"author" json:"author"`
	Description string             `bson:"description" json:"description"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// BookFormat represents different formats of a book (Physical, Digital, Audio)
type BookFormat struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	BookID        primitive.ObjectID `bson:"book_id" json:"book_id"`
	Type          string             `bson:"type" json:"type"` // "Physical", "Digital", or "Audio"
	Price         float64            `bson:"price" json:"price"`
	StockQuantity int                `bson:"stock_quantity" json:"stock_quantity"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

// CreateBookRequest represents the request body for creating a book
type CreateBookRequest struct {
	Title       string        `json:"title" binding:"required"`
	Author      string        `json:"author" binding:"required"`
	Description string        `json:"description"`
	Formats     []FormatInput `json:"formats" binding:"required"`
}

// FormatInput represents format input in book creation
type FormatInput struct {
	Type          string  `json:"type" binding:"required,oneof=Physical Digital Audio"`
	Price         float64 `json:"price" binding:"required,gt=0"`
	StockQuantity int     `json:"stock_quantity" binding:"required,gte=0"`
}

// BookWithFormats includes book details and its available formats
type BookWithFormats struct {
	ID          primitive.ObjectID `json:"id"`
	Title       string             `json:"title"`
	Author      string             `json:"author"`
	Description string             `json:"description"`
	Formats     []BookFormat       `json:"formats"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

// UpdateBookRequest represents the request body for updating a book
type UpdateBookRequest struct {
	Title       string `json:"title"`
	Author      string `json:"author"`
	Description string `json:"description"`
}
