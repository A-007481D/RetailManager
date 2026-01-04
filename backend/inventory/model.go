package inventory

import (
	"gorm.io/gorm"
)

type Product struct {
	gorm.Model
	Reference       string `gorm:"uniqueIndex"` // e.g., "REF-001"
	Name            string
	Category        string
	BuyingPrice     float64
	SellingPriceTTC float64 // Default price for invoices
	CurrentStock    int
	MinStockLevel   int // Threshold for alert (e.g., 5)
	// When stock <= MinStockLevel, this product is flagged
}
