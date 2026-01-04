package client

import (
	"gorm.io/gorm"
)

// Client represents a customer
type Client struct {
	gorm.Model
	Name    string `json:"name"`
	ICE     string `json:"ice"`
	City    string `json:"city"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
}
