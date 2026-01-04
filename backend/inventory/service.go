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
