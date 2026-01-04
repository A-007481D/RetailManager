package inventory

import (
	"factureapp/backend/database"
	"fmt"

	"gorm.io/gorm"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) Migrate() error {
	db := database.GetDB()
	return db.AutoMigrate(&Product{})
}

// DecreaseStock decrements the stock of a product within a transaction
func (s *Service) DecreaseStock(tx *gorm.DB, productID uint, quantity int) error {
	var product Product
	if err := tx.First(&product, productID).Error; err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	if product.CurrentStock < quantity {
		return fmt.Errorf("insufficient stock for product %s (requested: %d, available: %d)", product.Name, quantity, product.CurrentStock)
	}

	product.CurrentStock -= quantity
	if err := tx.Save(&product).Error; err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}

	return nil
}

// IncreaseStock increments the stock of a product within a transaction (used for cancellations/edits)
func (s *Service) IncreaseStock(tx *gorm.DB, productID uint, quantity int) error {
	var product Product
	if err := tx.First(&product, productID).Error; err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	product.CurrentStock += quantity
	if err := tx.Save(&product).Error; err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}

	return nil
}

// GetAllProducts returns all products
func (s *Service) GetAllProducts() ([]Product, error) {
	db := database.GetDB()
	var products []Product
	if err := db.Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

// CreateProduct creates a new product
func (s *Service) CreateProduct(product Product) (*Product, error) {
	db := database.GetDB()
	if err := db.Create(&product).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

// UpdateProduct updates an existing product
func (s *Service) UpdateProduct(product Product) error {
	db := database.GetDB()
	if err := db.Save(&product).Error; err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}
	return nil
}

// DeleteProduct soft deletes a product
func (s *Service) DeleteProduct(id uint) error {
	db := database.GetDB()
	// GORM performs a soft delete automatically because Product embeds gorm.Model
	if err := db.Delete(&Product{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}
	return nil
}

type InventoryStats struct {
	TotalProducts int64
	LowStockCount int64
}

func (s *Service) GetStats() (*InventoryStats, error) {
	db := database.GetDB()
	var stats InventoryStats

	if err := db.Model(&Product{}).Count(&stats.TotalProducts).Error; err != nil {
		return nil, err
	}

	if err := db.Model(&Product{}).Where("current_stock <= min_stock_level").Count(&stats.LowStockCount).Error; err != nil {
		return nil, err
	}

	return &stats, nil
}
