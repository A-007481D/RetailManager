package settings

import (
	"factureapp/backend/database"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

// Migrate auto-migrates the database schema
func (s *Service) Migrate() error {
	db := database.GetDB()
	return db.AutoMigrate(&Settings{})
}

// GetSettings retrieves the global settings, creating default if it doesn't exist
func (s *Service) GetSettings() (*Settings, error) {
	db := database.GetDB()
	var settings Settings

	result := db.First(&settings)
	if result.Error != nil {
		// If not found, create default settings
		settings = Settings{
			CompanyName:    "Ma Société",
			CompanyICE:     "000000000000000",
			CompanyAddress: "Adresse",
			TVARate:        20.0,
			GoogleSheetsID: "",
		}
		if err := db.Create(&settings).Error; err != nil {
			return nil, err
		}
	}

	return &settings, nil
}

// UpdateSettings updates the global settings
func (s *Service) UpdateSettings(req *Settings) (*Settings, error) {
	db := database.GetDB()
	
	current, err := s.GetSettings()
	if err != nil {
		return nil, err
	}

	current.CompanyName = req.CompanyName
	current.CompanyICE = req.CompanyICE
	current.CompanyAddress = req.CompanyAddress
	current.TVARate = req.TVARate
	current.GoogleSheetsID = req.GoogleSheetsID

	if err := db.Save(current).Error; err != nil {
		return nil, err
	}

	return current, nil
}
