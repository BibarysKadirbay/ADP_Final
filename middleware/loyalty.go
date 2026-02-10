package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

type LoyaltyLevel struct {
	Level      string
	MinPoints  int
	MaxPoints  int
	Discount   float64 // additional discount %
	BonusColor string
}

var LoyaltyLevels = []LoyaltyLevel{
	{Level: "Bronze", MinPoints: 0, MaxPoints: 499, Discount: 0, BonusColor: "#A0826D"},
	{Level: "Silver", MinPoints: 500, MaxPoints: 1499, Discount: 0.02, BonusColor: "#C0C0C0"},
	{Level: "Gold", MinPoints: 1500, MaxPoints: 4999, Discount: 0.05, BonusColor: "#FFD700"},
	{Level: "Platinum", MinPoints: 5000, MaxPoints: 999999, Discount: 0.10, BonusColor: "#E5E4E2"},
}

// GetLoyaltyLevel returns the level and discount for given points
func GetLoyaltyLevel(points int) (string, float64, string) {
	for _, level := range LoyaltyLevels {
		if points >= level.MinPoints && points <= level.MaxPoints {
			return level.Level, level.Discount, level.BonusColor
		}
	}
	return "Bronze", 0, "#A0826D"
}

// LoyaltyMiddleware extracts loyalty points from context
func GetLoyaltyFromContext(c *gin.Context) int {
	loyalty, exists := c.Get("loyalty_points")
	if !exists {
		return 0
	}
	points, ok := loyalty.(int)
	if !ok {
		return 0
	}
	return points
}

func LoyaltyCheckMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
func SetLoyaltyInContext(c *gin.Context, points int) {
	c.Set("loyalty_points", points)
}

func FormatLoyaltyBadge(level string, points int) string {
	return fmt.Sprintf("%s (%d points)", level, points)
}
