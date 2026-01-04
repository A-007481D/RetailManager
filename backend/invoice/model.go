package invoice

import (
	"time"

	"factureapp/backend/inventory"

	"gorm.io/gorm"
)

// ChequeInfo represents cheque payment details (embedded struct)
type ChequeInfo struct {
	Number    string `json:"number"`
	Bank      string `json:"bank"`
	City      string `json:"city"`
	Reference string `json:"reference"`
}

// EffetInfo represents effet payment details (embedded struct)
type EffetInfo struct {
	City         string `json:"city"`
	DateEcheance string `json:"dateEcheance"` // Format: DD-MM-YYYY
	Bank         string `json:"bank"`
	Reference    string `json:"reference"`
}

// InvoiceItem represents a single line item on an invoice
type InvoiceItem struct {
	ID          uint              `gorm:"primaryKey" json:"id"`
	InvoiceID   uint              `gorm:"index" json:"invoiceId"`
	ProductID   uint              `json:"productId"` // Foreign Key to Inventory
	Product     inventory.Product `json:"product"`
	Description string            `json:"description"`
	Quantity    float64           `json:"quantity"`
	BuyingPrice float64           `json:"buyingPrice"` // Snapshot of product buying price at time of sale
	PrixUnitTTC float64           `json:"prixUnitTTC"`
	TotalTTC    float64           `json:"totalTTC"`
}

// Invoice represents the main invoice entity
type Invoice struct {
	gorm.Model
	FormattedID       string    `gorm:"uniqueIndex;size:15" json:"formattedId"` // Format: "0001 - 2025"
	CustomFormattedID string    `json:"customFormattedId"`                      // Optional custom override
	SequenceNumber    int       `json:"sequenceNumber"`
	Year              int       `json:"year"`
	Date              time.Time `json:"date"`

	// Client information
	ClientName string `json:"clientName"`
	ClientCity string `json:"clientCity"`
	ClientICE  string `gorm:"size:15" json:"clientIce"` // 15 characters validation

	// Calculated totals
	TotalHT      float64 `json:"totalHT"`
	TotalTVA     float64 `json:"totalTVA"`
	TotalTTC     float64 `json:"totalTTC"`
	TotalInWords string  `json:"totalInWords"`

	// Payment information
	PaymentMethod string `json:"paymentMethod"` // CHEQUE, EFFET, ESPECE

	// Embedded structs for payment details (stored as JSON)
	ChequeNumber    string `json:"chequeNumber,omitempty"`
	ChequeBank      string `json:"chequeBank,omitempty"`
	ChequeCity      string `json:"chequeCity,omitempty"`
	ChequeReference string `json:"chequeReference,omitempty"`

	EffetCity         string `json:"effetCity,omitempty"`
	EffetDateEcheance string `json:"effetDateEcheance,omitempty"`
	EffetBank         string `json:"effetBank,omitempty"`
	EffetReference    string `json:"effetReference,omitempty"`

	// Related items
	Items []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"items"`
}

// InvoiceCreateRequest is the DTO for creating invoices from frontend
type InvoiceCreateRequest struct {
	Date              string `json:"date"`              // DD-MM-YYYY format
	CustomFormattedID string `json:"customFormattedId"` // Optional custom override
	ClientName        string `json:"clientName"`
	ClientCity        string `json:"clientCity"`
	ClientICE         string `json:"clientIce"`
	PaymentMethod     string `json:"paymentMethod"`

	// Payment details
	ChequeInfo *ChequeInfo `json:"chequeInfo,omitempty"`
	EffetInfo  *EffetInfo  `json:"effetInfo,omitempty"`

	// Items
	Items []InvoiceItemRequest `json:"items"`
}

// InvoiceItemRequest is the DTO for invoice items
type InvoiceItemRequest struct {
	ProductID   uint    `json:"productId"`
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	PrixUnitTTC float64 `json:"prixUnitTTC"`
}

// InvoiceResponse is the response DTO
type InvoiceResponse struct {
	ID                uint          `json:"id"`
	FormattedID       string        `json:"formattedId"`
	CustomFormattedID string        `json:"customFormattedId"`
	Date              string        `json:"date"`
	ClientName        string        `json:"clientName"`
	ClientCity        string        `json:"clientCity"`
	ClientICE         string        `json:"clientIce"`
	TotalHT           float64       `json:"totalHT"`
	TotalTVA          float64       `json:"totalTVA"`
	TotalTTC          float64       `json:"totalTTC"`
	TotalInWords      string        `json:"totalInWords"`
	PaymentMethod     string        `json:"paymentMethod"`
	ChequeInfo        *ChequeInfo   `json:"chequeInfo,omitempty"`
	EffetInfo         *EffetInfo    `json:"effetInfo,omitempty"`
	Items             []InvoiceItem `json:"items"`
}
