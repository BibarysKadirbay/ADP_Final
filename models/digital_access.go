package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// DigitalAccess represents access to digital or audio books
type DigitalAccess struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID            primitive.ObjectID `bson:"user_id" json:"user_id"`
	FormatID          primitive.ObjectID `bson:"format_id" json:"format_id"`
	AccessGrantedDate time.Time          `bson:"access_granted_date" json:"access_granted_date"`
	ExpiryDate        *time.Time         `bson:"expiry_date,omitempty" json:"expiry_date,omitempty"`
	AccessURL         string             `bson:"access_url" json:"access_url"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
}

// PersonalLibraryItem represents an item in user's personal library
type PersonalLibraryItem struct {
	ID           primitive.ObjectID `json:"id"`
	BookID       primitive.ObjectID `json:"book_id"`
	BookTitle    string             `json:"book_title"`
	BookAuthor   string             `json:"book_author"`
	Format       string             `json:"format"`
	AccessURL    string             `json:"access_url"`
	AccessedDate time.Time          `json:"accessed_date"`
}

// PersonalLibraryResponse represents the user's personal library
type PersonalLibraryResponse struct {
	UserID primitive.ObjectID    `json:"user_id"`
	Books  []PersonalLibraryItem `json:"books"`
}
