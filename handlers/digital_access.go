package handlers

import (
	"bookstore/middleware"
	"bookstore/models"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// DigitalAccessHandler handles digital and audio book access
type DigitalAccessHandler struct {
	digitalAccessCollection *mongo.Collection
	bookFormatsCollection   *mongo.Collection
	booksCollection         *mongo.Collection
}

// NewDigitalAccessHandler creates a new digital access handler
func NewDigitalAccessHandler(
	digitalAccessCollection,
	bookFormatsCollection,
	booksCollection *mongo.Collection,
) *DigitalAccessHandler {
	return &DigitalAccessHandler{
		digitalAccessCollection: digitalAccessCollection,
		bookFormatsCollection:   bookFormatsCollection,
		booksCollection:         booksCollection,
	}
}

// GetPersonalLibrary returns user's personal library (digital and audio books)
// GET /library
func (h *DigitalAccessHandler) GetPersonalLibrary(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get all digital access records for user
	cursor, err := h.digitalAccessCollection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch library"})
		return
	}
	defer cursor.Close(ctx)

	var libraryItems []models.PersonalLibraryItem

	for cursor.Next(ctx) {
		var access models.DigitalAccess
		if err := cursor.Decode(&access); err != nil {
			continue
		}

		// Check if access expired
		if access.ExpiryDate != nil && access.ExpiryDate.Before(time.Now()) {
			continue
		}

		// Get format details
		var format models.BookFormat
		err := h.bookFormatsCollection.FindOne(ctx, bson.M{"_id": access.FormatID}).Decode(&format)
		if err != nil {
			continue
		}

		// Get book details
		var book models.Book
		err = h.booksCollection.FindOne(ctx, bson.M{"_id": format.BookID}).Decode(&book)
		if err != nil {
			continue
		}

		libraryItem := models.PersonalLibraryItem{
			ID:           access.ID,
			BookID:       book.ID,
			BookTitle:    book.Title,
			BookAuthor:   book.Author,
			Format:       format.Type,
			AccessURL:    access.AccessURL,
			AccessedDate: access.AccessGrantedDate,
		}

		libraryItems = append(libraryItems, libraryItem)
	}

	if libraryItems == nil {
		libraryItems = []models.PersonalLibraryItem{}
	}

	response := models.PersonalLibraryResponse{
		UserID: userID,
		Books:  libraryItems,
	}

	c.JSON(http.StatusOK, response)
}

// GetDigitalBookAccess returns digital/audio book access for a specific format
// GET /library/:format_id
func (h *DigitalAccessHandler) GetDigitalBookAccess(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	formatID := c.Param("format_id")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var access models.DigitalAccess
	err = h.digitalAccessCollection.FindOne(
		ctx,
		bson.M{
			"user_id":   userID,
			"format_id": formatID,
		},
	).Decode(&access)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Access not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Check if not expired
	if access.ExpiryDate != nil && access.ExpiryDate.Before(time.Now()) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access has expired"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          access.ID,
		"access_url":  access.AccessURL,
		"access_date": access.AccessGrantedDate,
		"expiry_date": access.ExpiryDate,
	})
}

// ListAvailableDigitalBooks returns all available digital and audio books
// GET /digital-books
func (h *DigitalAccessHandler) ListAvailableDigitalBooks(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find digital and audio formats with stock
	cursor, err := h.bookFormatsCollection.Find(
		ctx,
		bson.M{
			"type":           bson.M{"$in": []string{"Digital", "Audio"}},
			"stock_quantity": bson.M{"$gt": 0},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch digital books"})
		return
	}
	defer cursor.Close(ctx)

	var results []gin.H

	for cursor.Next(ctx) {
		var format models.BookFormat
		if err := cursor.Decode(&format); err != nil {
			continue
		}

		// Get book details
		var book models.Book
		err := h.booksCollection.FindOne(ctx, bson.M{"_id": format.BookID}).Decode(&book)
		if err != nil {
			continue
		}

		results = append(results, gin.H{
			"format_id":      format.ID,
			"book_id":        book.ID,
			"title":          book.Title,
			"author":         book.Author,
			"type":           format.Type,
			"price":          format.Price,
			"stock_quantity": format.StockQuantity,
		})
	}

	if results == nil {
		results = []gin.H{}
	}

	c.JSON(http.StatusOK, results)
}
