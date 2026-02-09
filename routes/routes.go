package routes

import (
	"bookstore/handlers"
	"bookstore/middleware"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	db *mongo.Database,
	jwtSecret string,
) {
	usersCollection := db.Collection("users")
	booksCollection := db.Collection("books")
	ordersCollection := db.Collection("orders")
	orderItemsCollection := db.Collection("order_items")
	digitalAccessCollection := db.Collection("digital_access")

	authHandler := handlers.NewAuthHandler(usersCollection, jwtSecret)
	bookHandler := handlers.NewBookHandler(booksCollection, ordersCollection)
	orderHandler := handlers.NewOrderHandler(ordersCollection, orderItemsCollection, booksCollection, digitalAccessCollection)
	digitalAccessHandler := handlers.NewDigitalAccessHandler(digitalAccessCollection, booksCollection, booksCollection)
	adminHandler := handlers.NewAdminHandler(usersCollection, booksCollection, ordersCollection)

	api := router.Group("/api")
	public := api.Group("")
	{
		auth := public.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		books := public.Group("/books")
		{
			books.GET("", bookHandler.GetBooks)
			books.GET("/:id", bookHandler.GetBookByID)
		}

		public.GET("/digital-books", digitalAccessHandler.ListAvailableDigitalBooks)
	}

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		auth := protected.Group("/auth")
		{
			auth.GET("/profile", authHandler.GetProfile)
		}

		orders := protected.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.GetUserOrders)
			orders.DELETE("/:id", orderHandler.CancelOrder)
		}

		library := protected.Group("/library")
		{
			library.GET("", digitalAccessHandler.GetPersonalLibrary)
			library.GET("/:format_id", digitalAccessHandler.GetDigitalBookAccess)
		}
	}

	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(jwtSecret))
	{
		admin.GET("/stats", middleware.AdminMiddleware(), adminHandler.GetStats)
		admin.GET("/users", middleware.AdminMiddleware(), adminHandler.GetAllUsers)
		admin.PUT("/users/:id/deactivate", middleware.AdminMiddleware(), adminHandler.DeactivateUser)
		admin.PUT("/users/:id/premium", middleware.AdminMiddleware(), adminHandler.UpgradeToPremium)
		admin.PUT("/users/:id/role", middleware.AdminMiddleware(), adminHandler.UpdateUserRole)
		admin.GET("/orders", middleware.AdminMiddleware(), adminHandler.GetAllOrders)
		admin.PUT("/orders/:id", middleware.AdminMiddleware(), adminHandler.UpdateOrderStatus)

		books := admin.Group("/books")
		books.Use(middleware.ModeratorOrAdminMiddleware())
		{
			books.POST("", bookHandler.CreateBook)
			books.PUT("/:id", bookHandler.UpdateBook)
			books.DELETE("/:id", bookHandler.DeleteBook)
		}
	}
}
