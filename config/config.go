package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI    string
	MongoDBName string
	JWTSecret   string
	Port        string
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	config := &Config{
		MongoURI:    getEnv("MONGO_URI", "mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"),
		MongoDBName: getEnv("MONGO_DB_NAME", "bookstore"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Port:        getEnv("PORT", ":8080"),
	}

	return config
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Printf("Environment variable %s not set, using default value", key)
		return defaultValue
	}
	return value
}
