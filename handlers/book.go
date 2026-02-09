package handlers

import (
	"bookstore/models"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type BookHandler struct {
	booksCollection  *mongo.Collection
	ordersCollection *mongo.Collection
}

func NewBookHandler(booksCollection, ordersCollection *mongo.Collection) *BookHandler {
	return &BookHandler{
		booksCollection:  booksCollection,
		ordersCollection: ordersCollection,
	}
}

func (h *BookHandler) CreateBook(c *gin.Context) {
	var req models.CreateBookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	formats := make([]models.BookFormat, len(req.Formats))
	for i, f := range req.Formats {
		formats[i] = models.BookFormat{
			Type:          f.Type,
			Price:         f.Price,
			StockQuantity: f.StockQuantity,
		}
	}

	book := models.Book{
		Title:         req.Title,
		Author:        req.Author,
		Description:   req.Description,
		ImageURL:      req.ImageURL,
		PublishedYear: req.PublishedYear,
		ISBN:          req.ISBN,
		Category:      req.Category,
		Formats:       formats,
		Rating:        0,
		TotalRatings:  0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	bookResult, err := h.booksCollection.InsertOne(ctx, book)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Book created successfully",
		"id":      bookResult.InsertedID,
	})
}

func (h *BookHandler) GetBooks(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := c.Query("search")

	filter := bson.M{}
	if query != "" {
		filter = bson.M{
			"$or": []bson.M{
				{"title": bson.M{"$regex": query, "$options": "i"}},
				{"author": bson.M{"$regex": query, "$options": "i"}},
			},
		}
	}

	cursor, err := h.booksCollection.Find(ctx, filter, options.Find().SetLimit(100))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}
	defer cursor.Close(ctx)

	var books []models.Book
	if err = cursor.All(ctx, &books); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode books"})
		return
	}

	if books == nil {
		books = []models.Book{}
	}

	c.JSON(http.StatusOK, books)
}

func (h *BookHandler) GetBookByID(c *gin.Context) {
	bookID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var book models.Book
	err = h.booksCollection.FindOne(ctx, bson.M{"_id": bookID}).Decode(&book)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	c.JSON(http.StatusOK, book)
}

func (h *BookHandler) UpdateBook(c *gin.Context) {
	bookID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var req models.UpdateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	set := bson.M{"updated_at": time.Now()}
	if req.Title != "" {
		set["title"] = req.Title
	}
	if req.Author != "" {
		set["author"] = req.Author
	}
	if req.Description != "" {
		set["description"] = req.Description
	}
	if req.ImageURL != "" {
		set["image_url"] = req.ImageURL
	}
	if req.PublishedYear > 0 {
		set["published_year"] = req.PublishedYear
	}
	if req.ISBN != "" {
		set["isbn"] = req.ISBN
	}
	if req.Category != "" {
		set["category"] = req.Category
	}
	if len(req.Formats) > 0 {
		formats := make([]models.BookFormat, len(req.Formats))
		for i, f := range req.Formats {
			formats[i] = models.BookFormat{Type: f.Type, Price: f.Price, StockQuantity: f.StockQuantity}
		}
		set["formats"] = formats
	}
	result, err := h.booksCollection.UpdateOne(ctx, bson.M{"_id": bookID}, bson.M{"$set": set})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book updated successfully"})
}

func (h *BookHandler) DeleteBook(c *gin.Context) {
	bookID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.booksCollection.DeleteOne(ctx, bson.M{"_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}
