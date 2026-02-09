package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Database struct {
	Client *mongo.Client
	DB     *mongo.Database
}

func Connect(mongoURI, dbName string) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(mongoURI)

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
		return nil, err
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
		return nil, err
	}

	log.Println("Successfully connected to MongoDB Atlas")

	db := client.Database(dbName)
	if err := createIndexes(ctx, db); err != nil {
		log.Printf("Failed to create indexes: %v", err)
	}

	return &Database{
		Client: client,
		DB:     db,
	}, nil
}

func createIndexes(ctx context.Context, db *mongo.Database) error {
	usersCollection := db.Collection("users")
	usersIndexModel := []mongo.IndexModel{
		{Keys: bson.D{{Key: "username", Value: 1}}},
		{Keys: bson.D{{Key: "email", Value: 1}}},
	}
	_, err := usersCollection.Indexes().CreateMany(ctx, usersIndexModel)
	if err != nil {
		return err
	}

	formatsCollection := db.Collection("book_formats")
	formatsIndexModel := []mongo.IndexModel{
		{Keys: bson.D{{Key: "book_id", Value: 1}}},
	}
	_, err = formatsCollection.Indexes().CreateMany(ctx, formatsIndexModel)
	if err != nil {
		return err
	}

	ordersCollection := db.Collection("orders")
	ordersIndexModel := []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	}
	_, err = ordersCollection.Indexes().CreateMany(ctx, ordersIndexModel)
	if err != nil {
		return err
	}

	itemsCollection := db.Collection("order_items")
	itemsIndexModel := []mongo.IndexModel{
		{Keys: bson.D{{Key: "order_id", Value: 1}}},
	}
	_, err = itemsCollection.Indexes().CreateMany(ctx, itemsIndexModel)
	if err != nil {
		return err
	}

	digitalCollection := db.Collection("digital_access")
	digitalIndexModel := []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
		{Keys: bson.D{{Key: "format_id", Value: 1}}},
	}
	_, err = digitalCollection.Indexes().CreateMany(ctx, digitalIndexModel)
	if err != nil {
		return err
	}

	log.Println("Database indexes created successfully")
	return nil
}

func (db *Database) Disconnect() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.Client.Disconnect(ctx); err != nil {
		log.Fatalf("Failed to disconnect from MongoDB: %v", err)
		return err
	}

	log.Println("Disconnected from MongoDB")
	return nil
}
