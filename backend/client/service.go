package client

import (
	"factureapp/backend/database"
	"fmt"
	"strings"
)

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// Service handles client business logic
type Service struct{}

// NewService creates a new client service
func NewService() *Service {
	return &Service{}
}

// Migrate runs database migrations for client models
func (s *Service) Migrate() error {
	db := database.GetDB()
	// We use a regular index instead of uniqueIndex to allow 000000000000000 placeholders
	return db.AutoMigrate(&Client{})
}

// CreateClient creates a new client
func (s *Service) CreateClient(client Client) error {
	// Pre-validation
	if len(client.Name) == 0 {
		return fmt.Errorf("le nom du client est obligatoire")
	}
	if len(client.ICE) == 0 {
		return fmt.Errorf("l'ICE est obligatoire")
	}
	if len(client.ICE) != 15 {
		return fmt.Errorf("l'ICE doit contenir exactement 15 chiffres, vous avez fourni %d", len(client.ICE))
	}
	if len(client.City) == 0 {
		return fmt.Errorf("la ville est obligatoire")
	}

	db := database.GetDB()
	
	// Check for unique constraint violation manually, EXCEPT for the placeholder "000000000000000"
	if client.ICE != "000000000000000" {
		var count int64
		db.Model(&Client{}).Where("ice = ? AND deleted_at IS NULL", client.ICE).Count(&count)
		if count > 0 {
			return fmt.Errorf("un client avec l'ICE '%s' existe déjà", client.ICE)
		}
	}

	if err := db.Create(&client).Error; err != nil {
		return fmt.Errorf("échec de la création du client: %w", err)
	}
	return nil
}

// UpdateClient updates an existing client
func (s *Service) UpdateClient(client Client) error {
	// Pre-validation
	if len(client.Name) == 0 {
		return fmt.Errorf("le nom du client est obligatoire")
	}
	if len(client.ICE) != 15 {
		return fmt.Errorf("l'ICE doit contenir exactement 15 chiffres")
	}
	if len(client.City) == 0 {
		return fmt.Errorf("la ville est obligatoire")
	}

	db := database.GetDB()

	// Check for unique constraint violation manually, EXCEPT for the placeholder "000000000000000"
	if client.ICE != "000000000000000" {
		var count int64
		db.Model(&Client{}).Where("ice = ? AND id != ? AND deleted_at IS NULL", client.ICE, client.ID).Count(&count)
		if count > 0 {
			return fmt.Errorf("un client avec l'ICE '%s' existe déjà", client.ICE)
		}
	}

	if err := db.Save(&client).Error; err != nil {
		return fmt.Errorf("échec de la mise à jour du client: %w", err)
	}
	return nil
}

// DeleteClient soft-deletes a client
func (s *Service) DeleteClient(id uint) error {
	db := database.GetDB()

	// Check if client has any invoices
	var count int64
	if err := db.Table("invoices").Where("client_ice = (SELECT ice FROM clients WHERE id = ? AND deleted_at IS NULL)", id).Count(&count).Error; err != nil {
		return fmt.Errorf("échec de la vérification d'utilisation: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("impossible de supprimer ce client car il a %d facture(s) associée(s)", count)
	}

	if err := db.Delete(&Client{}, id).Error; err != nil {
		return fmt.Errorf("échec de la suppression du client: %w", err)
	}
	return nil
}

// GetAllClients returns all clients
func (s *Service) GetAllClients() ([]Client, error) {
	db := database.GetDB()
	var clients []Client
	if err := db.Order("name ASC").Find(&clients).Error; err != nil {
		return nil, err
	}
	return clients, nil
}

// SearchClients searches clients by name or ICE
func (s *Service) SearchClients(query string) ([]Client, error) {
	db := database.GetDB()
	var clients []Client
	likeQuery := "%" + query + "%"
	if err := db.Where("name LIKE ? OR ice LIKE ?", likeQuery, likeQuery).Order("name ASC").Find(&clients).Error; err != nil {
		return nil, err
	}
	return clients, nil
}
