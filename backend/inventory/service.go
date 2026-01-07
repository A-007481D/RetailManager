package inventory

import (
	"factureapp/backend/database"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

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
		return fmt.Errorf("produit introuvable: %w", err)
	}

	if product.CurrentStock < quantity {
		return fmt.Errorf("stock insuffisant pour '%s' (demandé: %d, disponible: %d)", product.Name, quantity, product.CurrentStock)
	}

	product.CurrentStock -= quantity
	if err := tx.Save(&product).Error; err != nil {
		return fmt.Errorf("échec de la mise à jour du stock: %w", err)
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
	// Pre-validation
	if len(product.Reference) == 0 {
		return nil, fmt.Errorf("la référence est obligatoire")
	}
	if len(product.Name) == 0 {
		return nil, fmt.Errorf("le nom du produit est obligatoire")
	}
	if product.SellingPriceTTC < 0 {
		return nil, fmt.Errorf("le prix de vente ne peut pas être négatif")
	}

	db := database.GetDB()
	if err := db.Create(&product).Error; err != nil {
		// Check for unique constraint violation (SQLite)
		errMsg := err.Error()
		if contains(errMsg, "UNIQUE constraint failed") || contains(errMsg, "duplicate key") {
			return nil, fmt.Errorf("un produit avec la référence '%s' existe déjà", product.Reference)
		}
		return nil, fmt.Errorf("échec de la création du produit: %w", err)
	}
	return &product, nil
}

// UpdateProduct updates an existing product
func (s *Service) UpdateProduct(product Product) error {
	// Pre-validation
	if len(product.Name) == 0 {
		return fmt.Errorf("le nom du produit est obligatoire")
	}
	if product.SellingPriceTTC < 0 {
		return fmt.Errorf("le prix de vente ne peut pas être négatif")
	}

	db := database.GetDB()
	if err := db.Save(&product).Error; err != nil {
		return fmt.Errorf("échec de la mise à jour du produit: %w", err)
	}
	return nil
}

// DeleteProduct soft deletes a product
func (s *Service) DeleteProduct(id uint) error {
	db := database.GetDB()

	// Check if product is used in any invoices
	var count int64
	if err := db.Table("invoice_items").Where("product_id = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("échec de la vérification d'utilisation: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("impossible de supprimer ce produit car il est utilisé dans %d facture(s)", count)
	}

	// GORM performs a soft delete automatically because Product embeds gorm.Model
	if err := db.Delete(&Product{}, id).Error; err != nil {
		return fmt.Errorf("échec de la suppression du produit: %w", err)
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
