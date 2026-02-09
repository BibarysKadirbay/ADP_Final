package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username     string             `bson:"username" json:"username"`
	Email        string             `bson:"email" json:"email"`
	Password     string             `bson:"password" json:"-"`
	Role         string             `bson:"role" json:"role"`
	IsPremium    bool               `bson:"is_premium" json:"is_premium"`
	PremiumUntil time.Time          `bson:"premium_until" json:"premium_until,omitempty"`
	IsActive     bool               `bson:"is_active" json:"is_active"`
	ProfileImage string             `bson:"profile_image" json:"profile_image"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	ID           primitive.ObjectID `json:"id"`
	Username     string               `json:"username"`
	Email        string               `json:"email"`
	Role         string               `json:"role"`
	Token        string               `json:"token"`
	IsPremium    bool                 `json:"is_premium"`
	PremiumUntil time.Time            `json:"premium_until,omitempty"`
}
