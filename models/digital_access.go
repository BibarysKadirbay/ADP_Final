package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DigitalAccess struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID            primitive.ObjectID `bson:"user_id" json:"user_id"`
	BookID            primitive.ObjectID `bson:"book_id" json:"book_id"`
	FormatType        string             `bson:"format_type" json:"format_type"`
	AccessGrantedDate time.Time          `bson:"access_granted_date" json:"access_granted_date"`
	ExpiryDate        *time.Time         `bson:"expiry_date,omitempty" json:"expiry_date,omitempty"`
	AccessURL         string             `bson:"access_url" json:"access_url"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
}

type PersonalLibraryItem struct {
	ID           primitive.ObjectID `json:"id"`
	BookID       primitive.ObjectID `json:"book_id"`
	BookTitle    string             `json:"book_title"`
	BookAuthor   string             `json:"book_author"`
	Format       string             `json:"format"`
	AccessURL    string             `json:"access_url"`
	AccessedDate time.Time          `json:"accessed_date"`
}

type PersonalLibraryResponse struct {
	UserID primitive.ObjectID    `json:"user_id"`
	Books  []PersonalLibraryItem `json:"books"`
}
