package client

import (
	"factureapp/backend/database"
	"fmt"
)

// Service handles client business logic
type Service struct{}

// NewService creates a new client service
func NewService() *Service {
	return &Service{}
}

// Migrate runs database migrations for client models
func (s *Service) Migrate() error {
	db := database.GetDB()
	return db.AutoMigrate(&Client{})
}

// CreateClient creates a new client
func (s *Service) CreateClient(client Client) error {
	db := database.GetDB()
	if err := db.Create(&client).Error; err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	return nil
}

// UpdateClient updates an existing client
func (s *Service) UpdateClient(client Client) error {
	db := database.GetDB()
	if err := db.Save(&client).Error; err != nil {
		return fmt.Errorf("failed to update client: %w", err)
	}
	return nil
}

// DeleteClient soft-deletes a client
func (s *Service) DeleteClient(id uint) error {
	db := database.GetDB()
	if err := db.Delete(&Client{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete client: %w", err)
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
