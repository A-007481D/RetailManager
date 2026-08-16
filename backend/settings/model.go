package settings

import "gorm.io/gorm"

// Settings represents global application configuration
type Settings struct {
	gorm.Model
	CompanyName     string `json:"companyName"`
	CompanyICE      string `json:"companyIce"`
	CompanyAddress  string `json:"companyAddress"`
	TVARate         float64 `json:"tvaRate"`
	GoogleSheetsID  string `json:"googleSheetsId"`
}
