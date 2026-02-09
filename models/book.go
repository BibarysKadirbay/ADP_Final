package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BookFormat struct {
	Type          string  `bson:"type" json:"type"`
	Price         float64 `bson:"price" json:"price"`
	StockQuantity int     `bson:"stock_quantity" json:"stock_quantity"`
}

type Book struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title         string             `bson:"title" json:"title"`
	Author        string             `bson:"author" json:"author"`
	Description   string             `bson:"description" json:"description"`
	ImageURL      string             `bson:"image_url" json:"image_url"`
	PublishedYear int                `bson:"published_year" json:"published_year"`
	ISBN          string             `bson:"isbn" json:"isbn"`
	Category      string             `bson:"category" json:"category"`
	Rating        float64            `bson:"rating" json:"rating"`
	TotalRatings  int                `bson:"total_ratings" json:"total_ratings"`
	Formats       []BookFormat       `bson:"formats" json:"formats"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateBookRequest struct {
	Title         string            `json:"title" binding:"required"`
	Author        string            `json:"author" binding:"required"`
	Description   string            `json:"description"`
	ImageURL      string            `json:"image_url"`
	PublishedYear int               `json:"published_year"`
	ISBN          string            `json:"isbn"`
	Category      string            `json:"category"`
	Formats       []BookFormatInput `json:"formats" binding:"required"`
}

type BookFormatInput struct {
	Type          string  `json:"type" binding:"required,oneof=physical digital both"`
	Price         float64 `json:"price" binding:"required,gt=0"`
	StockQuantity int     `json:"stock_quantity" binding:"required,gte=0"`
}

type BookWithFormats struct {
	ID          primitive.ObjectID `json:"id"`
	Title       string             `json:"title"`
	Author      string             `json:"author"`
	Description string             `json:"description"`
	Formats     []BookFormat       `json:"formats"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

type UpdateBookRequest struct {
	Title         string            `json:"title"`
	Author        string            `json:"author"`
	Description   string            `json:"description"`
	ImageURL      string            `json:"image_url"`
	PublishedYear int               `json:"published_year"`
	ISBN          string            `json:"isbn"`
	Category      string            `json:"category"`
	Formats       []BookFormatInput `json:"formats"`
}
