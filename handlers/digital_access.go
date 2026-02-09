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

type DigitalAccessHandler struct {
	digitalAccessCollection *mongo.Collection
	booksCollection         *mongo.Collection
}

func NewDigitalAccessHandler(
	digitalAccessCollection,
	booksCollection,
	booksCollection2 *mongo.Collection,
) *DigitalAccessHandler {
	return &DigitalAccessHandler{
		digitalAccessCollection: digitalAccessCollection,
		booksCollection:         booksCollection,
	}
}

func (h *DigitalAccessHandler) GetPersonalLibrary(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user context"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

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

		if access.ExpiryDate != nil && access.ExpiryDate.Before(time.Now()) {
			continue
		}

		var book models.Book
		err := h.booksCollection.FindOne(ctx, bson.M{"_id": access.BookID}).Decode(&book)
		if err != nil {
			continue
		}

		libraryItem := models.PersonalLibraryItem{
			ID:           access.ID,
			BookID:       book.ID,
			BookTitle:    book.Title,
			BookAuthor:   book.Author,
			Format:       access.FormatType,
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

func (h *DigitalAccessHandler) ListAvailableDigitalBooks(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := h.booksCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch digital books"})
		return
	}
	defer cursor.Close(ctx)

	var results []gin.H

	for cursor.Next(ctx) {
		var book models.Book
		if err := cursor.Decode(&book); err != nil {
			continue
		}

		for _, format := range book.Formats {
			if (format.Type == "digital" || format.Type == "both") && format.StockQuantity > 0 {
				results = append(results, gin.H{
					"book_id":        book.ID,
					"title":          book.Title,
					"author":         book.Author,
					"image_url":      book.ImageURL,
					"type":           format.Type,
					"price":          format.Price,
					"stock_quantity": format.StockQuantity,
				})
			}
		}
	}

	if results == nil {
		results = []gin.H{}
	}

	c.JSON(http.StatusOK, results)
}
