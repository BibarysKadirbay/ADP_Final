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

// BookHandler handles book operations
type BookHandler struct {
	booksCollection       *mongo.Collection
	bookFormatsCollection *mongo.Collection
}

// NewBookHandler creates a new book handler
func NewBookHandler(booksCollection, bookFormatsCollection *mongo.Collection) *BookHandler {
	return &BookHandler{
		booksCollection:       booksCollection,
		bookFormatsCollection: bookFormatsCollection,
	}
}

// CreateBook creates a new book with formats
// POST /admin/books
func (h *BookHandler) CreateBook(c *gin.Context) {
	var req models.CreateBookRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create book
	book := models.Book{
		Title:       req.Title,
		Author:      req.Author,
		Description: req.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	bookResult, err := h.booksCollection.InsertOne(ctx, book)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	bookID := bookResult.InsertedID.(primitive.ObjectID)

	// Create book formats
	var formatDocs []interface{}
	for _, f := range req.Formats {
		format := models.BookFormat{
			BookID:        bookID,
			Type:          f.Type,
			Price:         f.Price,
			StockQuantity: f.StockQuantity,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		formatDocs = append(formatDocs, format)
	}

	_, err = h.bookFormatsCollection.InsertMany(ctx, formatDocs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book formats"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Book created successfully",
		"book_id": bookID,
	})
}

// GetBooks returns all books with their formats
// GET /books
func (h *BookHandler) GetBooks(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get search query parameter
	query := c.Query("search")

	// Build filter
	filter := bson.M{}
	if query != "" {
		filter = bson.M{
			"$or": []bson.M{
				{"title": bson.M{"$regex": query, "$options": "i"}},
				{"author": bson.M{"$regex": query, "$options": "i"}},
			},
		}
	}

	// Find books
	cursor, err := h.booksCollection.Find(ctx, filter, options.Find().SetLimit(100))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}
	defer cursor.Close(ctx)

	var books []models.BookWithFormats

	for cursor.Next(ctx) {
		var book models.Book
		if err := cursor.Decode(&book); err != nil {
			continue
		}

		// Get formats for this book
		formatCursor, err := h.bookFormatsCollection.Find(ctx, bson.M{"book_id": book.ID})
		if err != nil {
			continue
		}

		var formats []models.BookFormat
		if err = formatCursor.All(ctx, &formats); err != nil {
			formatCursor.Close(ctx)
			continue
		}
		formatCursor.Close(ctx)

		books = append(books, models.BookWithFormats{
			ID:          book.ID,
			Title:       book.Title,
			Author:      book.Author,
			Description: book.Description,
			Formats:     formats,
			CreatedAt:   book.CreatedAt,
			UpdatedAt:   book.UpdatedAt,
		})
	}

	if books == nil {
		books = []models.BookWithFormats{}
	}

	c.JSON(http.StatusOK, books)
}

// GetBookByID returns a specific book with its formats
// GET /books/:id
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

	// Get formats
	cursor, err := h.bookFormatsCollection.Find(ctx, bson.M{"book_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch formats"})
		return
	}
	defer cursor.Close(ctx)

	var formats []models.BookFormat
	if err = cursor.All(ctx, &formats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode formats"})
		return
	}

	if formats == nil {
		formats = []models.BookFormat{}
	}

	response := models.BookWithFormats{
		ID:          book.ID,
		Title:       book.Title,
		Author:      book.Author,
		Description: book.Description,
		Formats:     formats,
		CreatedAt:   book.CreatedAt,
		UpdatedAt:   book.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateBook updates book details
// PUT /admin/books/:id
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

	update := bson.M{"$set": bson.M{
		"updated_at": time.Now(),
	}}

	if req.Title != "" {
		update["$set"].(bson.M)["title"] = req.Title
	}
	if req.Author != "" {
		update["$set"].(bson.M)["author"] = req.Author
	}
	if req.Description != "" {
		update["$set"].(bson.M)["description"] = req.Description
	}

	result, err := h.booksCollection.UpdateOne(ctx, bson.M{"_id": bookID}, update)
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

// DeleteBook deletes a book and its formats
// DELETE /admin/books/:id
func (h *BookHandler) DeleteBook(c *gin.Context) {
	bookID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Delete book formats first
	_, err = h.bookFormatsCollection.DeleteMany(ctx, bson.M{"book_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book formats"})
		return
	}

	// Delete book
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
