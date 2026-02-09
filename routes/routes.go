package routes

import (
	"bookstore/handlers"
	"bookstore/middleware"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/gin-gonic/gin"
)

// SetupRoutes sets up all API routes
func SetupRoutes(
	router *gin.Engine,
	db *mongo.Database,
	jwtSecret string,
) {
	// Get collections
	usersCollection := db.Collection("users")
	booksCollection := db.Collection("books")
	bookFormatsCollection := db.Collection("book_formats")
	ordersCollection := db.Collection("orders")
	orderItemsCollection := db.Collection("order_items")
	digitalAccessCollection := db.Collection("digital_access")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(usersCollection, jwtSecret)
	bookHandler := handlers.NewBookHandler(booksCollection, bookFormatsCollection)
	orderHandler := handlers.NewOrderHandler(ordersCollection, orderItemsCollection, bookFormatsCollection, digitalAccessCollection)
	digitalAccessHandler := handlers.NewDigitalAccessHandler(digitalAccessCollection, bookFormatsCollection, booksCollection)
	userHandler := handlers.NewUserHandler(usersCollection)

	// Public routes
	public := router.Group("")
	{
		// Authentication
		auth := public.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Books - Search and View (no authentication required)
		books := public.Group("/books")
		{
			books.GET("", bookHandler.GetBooks)
			books.GET("/:id", bookHandler.GetBookByID)
		}

		// Digital Books - List available
		public.GET("/digital-books", digitalAccessHandler.ListAvailableDigitalBooks)
	}

	// Protected routes - Customer & Admin
	protected := router.Group("")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Authentication
		auth := protected.Group("/auth")
		{
			auth.GET("/profile", authHandler.GetProfile)
		}

		// Orders
		orders := protected.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.GetUserOrders)
			orders.DELETE("/:id", orderHandler.CancelOrder)
		}

		// Digital Library
		library := protected.Group("/library")
		{
			library.GET("", digitalAccessHandler.GetPersonalLibrary)
			library.GET("/:format_id", digitalAccessHandler.GetDigitalBookAccess)
		}
	}

	// Admin routes
	admin := router.Group("/admin")
	admin.Use(middleware.AuthMiddleware(jwtSecret), middleware.AdminMiddleware())
	{
		// Book Management
		books := admin.Group("/books")
		{
			books.POST("", bookHandler.CreateBook)
			books.PUT("/:id", bookHandler.UpdateBook)
			books.DELETE("/:id", bookHandler.DeleteBook)
		}

		// Order Management
		orders := admin.Group("/orders")
		{
			orders.GET("", orderHandler.GetAllOrders)
			orders.PUT("/:id", orderHandler.UpdateOrderStatus)
		}

		// User Management
		users := admin.Group("/users")
		{
			users.GET("", userHandler.GetAllUsers)
			users.GET("/:id", userHandler.GetUserByID)
			users.PUT("/:id/role", userHandler.UpdateUserRole)
			users.DELETE("/:id", userHandler.DeleteUser)
		}

		// Statistics
		admin.GET("/stats", userHandler.GetUserStats)
	}
}