package invoice

import (
	"fmt"
	"math"
	"strings"
	"time"

	"factureapp/backend/database"
	"factureapp/backend/inventory"
)

// Service handles invoice business logic
type Service struct {
	inventoryService *inventory.Service
}

// NewService creates a new invoice service
func NewService(inventoryService *inventory.Service) *Service {
	return &Service{
		inventoryService: inventoryService,
	}
}

// Migrate runs database migrations for invoice models
func (s *Service) Migrate() error {
	db := database.GetDB()
	return db.AutoMigrate(&Invoice{}, &InvoiceItem{})
}

// CreateInvoice creates a new invoice with auto-numbering and calculations
func (s *Service) CreateInvoice(req InvoiceCreateRequest) (*InvoiceResponse, error) {
	db := database.GetDB()

	// Start transaction
	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Parse date
	date, err := time.Parse("02-01-2006", req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, expected DD-MM-YYYY: %w", err)
	}

	// Validate ICE (15 characters)
	if len(req.ClientICE) != 15 {
		return nil, fmt.Errorf("ICE must be exactly 15 characters, got %d", len(req.ClientICE))
	}

	// Get current year
	currentYear := time.Now().Year()

	// Calculate TTC from items
	var totalTTC float64
	items := make([]InvoiceItem, len(req.Items))
	for i, item := range req.Items {
		itemTotal := item.Quantity * item.PrixUnitTTC
		items[i] = InvoiceItem{
			ProductID:   item.ProductID,
			Description: item.Description,
			Quantity:    item.Quantity,
			PrixUnitTTC: item.PrixUnitTTC,
			TotalTTC:    itemTotal,
		}
		totalTTC += itemTotal

		// Decrement stock
		if err := s.inventoryService.DecreaseStock(tx, item.ProductID, int(item.Quantity)); err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("stock error for item %s: %w", item.Description, err)
		}

	}

	// Reverse tax calculation: HT = TTC / 1.20
	totalHT := totalTTC / 1.20
	totalTVA := totalTTC - totalHT

	// Round to 2 decimal places
	totalHT = math.Round(totalHT*100) / 100
	totalTVA = math.Round(totalTVA*100) / 100
	totalTTC = math.Round(totalTTC*100) / 100

	// Convert total to words (French)
	totalInWords := s.ConvertToWords(totalTTC)

	// Auto-numbering: get last sequence number for current year
	var lastInvoice Invoice
	tx.Where("year = ?", currentYear).Order("sequence_number DESC").First(&lastInvoice)

	nextSequence := 1
	if lastInvoice.ID != 0 {
		nextSequence = lastInvoice.SequenceNumber + 1
	}

	// Format: "0001 - 2025"
	formattedID := fmt.Sprintf("%04d - %d", nextSequence, currentYear)

	// Create invoice
	invoice := Invoice{
		FormattedID:       formattedID,
		CustomFormattedID: req.CustomFormattedID,
		SequenceNumber:    nextSequence,
		Year:              currentYear,
		Date:              date,
		ClientName:        req.ClientName,
		ClientCity:        req.ClientCity,
		ClientICE:         req.ClientICE,
		TotalHT:           totalHT,
		TotalTVA:          totalTVA,
		TotalTTC:          totalTTC,
		TotalInWords:      totalInWords,
		PaymentMethod:     req.PaymentMethod,
		Items:             items,
	}

	// Set payment details based on method
	if req.ChequeInfo != nil && req.PaymentMethod == "CHEQUE" {
		invoice.ChequeNumber = req.ChequeInfo.Number
		invoice.ChequeBank = req.ChequeInfo.Bank
		invoice.ChequeCity = req.ChequeInfo.City
		invoice.ChequeReference = req.ChequeInfo.Reference
	}

	if req.EffetInfo != nil && req.PaymentMethod == "EFFET" {
		invoice.EffetCity = req.EffetInfo.City
		invoice.EffetDateEcheance = req.EffetInfo.DateEcheance
	}

	// Save to database
	// Save to database
	if err := tx.Create(&invoice).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return s.toResponse(&invoice), nil
}

// UpdateInvoice updates an existing invoice and handles stock adjustments
func (s *Service) UpdateInvoice(id uint, req InvoiceCreateRequest) (*InvoiceResponse, error) {
	db := database.GetDB()

	// Start transaction
	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Get existing invoice with items
	var invoice Invoice
	if err := tx.Preload("Items").First(&invoice, id).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	// 2. Revert stock for OLD items
	for _, item := range invoice.Items {
		if err := s.inventoryService.IncreaseStock(tx, item.ProductID, int(item.Quantity)); err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to revert stock for item %s: %w", item.Description, err)
		}
	}

	// 3. Delete OLD items
	if err := tx.Where("invoice_id = ?", id).Delete(&InvoiceItem{}).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to delete old items: %w", err)
	}

	// 4. Process NEW items (Calculate totals and Decrease Stock)
	var totalTTC float64
	newItems := make([]InvoiceItem, len(req.Items))
	for i, item := range req.Items {
		itemTotal := item.Quantity * item.PrixUnitTTC
		newItems[i] = InvoiceItem{
			InvoiceID:   id, // Link to existing invoice
			ProductID:   item.ProductID,
			Description: item.Description,
			Quantity:    item.Quantity,
			PrixUnitTTC: item.PrixUnitTTC,
			TotalTTC:    itemTotal,
		}
		totalTTC += itemTotal

		// Decrease stock for NEW quantity
		if err := s.inventoryService.DecreaseStock(tx, item.ProductID, int(item.Quantity)); err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("insufficient stock for new item %s: %w", item.Description, err)
		}
	}

	// 5. Recalculate Invoice Totals
	totalHT := totalTTC / 1.20
	totalTVA := totalTTC - totalHT

	totalHT = math.Round(totalHT*100) / 100
	totalTVA = math.Round(totalTVA*100) / 100
	totalTTC = math.Round(totalTTC*100) / 100
	totalInWords := s.ConvertToWords(totalTTC)

	// 6. Update Invoice Fields
	invoice.ClientName = req.ClientName
	invoice.ClientCity = req.ClientCity
	invoice.ClientICE = req.ClientICE
	invoice.Date, _ = time.Parse("02-01-2006", req.Date) // Assuming validated in frontend/handler
	invoice.TotalHT = totalHT
	invoice.TotalTVA = totalTVA
	invoice.TotalTTC = totalTTC
	invoice.TotalInWords = totalInWords
	invoice.PaymentMethod = req.PaymentMethod
	invoice.Items = newItems // GORM will create these

	if req.CustomFormattedID != "" {
		invoice.CustomFormattedID = req.CustomFormattedID
	}

	// Update payment details
	if req.ChequeInfo != nil && req.PaymentMethod == "CHEQUE" {
		invoice.ChequeNumber = req.ChequeInfo.Number
		invoice.ChequeBank = req.ChequeInfo.Bank
		invoice.ChequeCity = req.ChequeInfo.City
		invoice.ChequeReference = req.ChequeInfo.Reference
	} else {
		// Clear if changed
		invoice.ChequeNumber = ""
		invoice.ChequeBank = ""
		invoice.ChequeCity = ""
		invoice.ChequeReference = ""
	}

	if req.EffetInfo != nil && req.PaymentMethod == "EFFET" {
		invoice.EffetCity = req.EffetInfo.City
		invoice.EffetDateEcheance = req.EffetInfo.DateEcheance
	} else {
		invoice.EffetCity = ""
		invoice.EffetDateEcheance = ""
	}

	// 7. Save Invoice
	if err := tx.Save(&invoice).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	// Commit
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("transaction commit failed: %w", err)
	}

	return s.toResponse(&invoice), nil
}

// GetAllInvoices returns all invoices
func (s *Service) GetAllInvoices() ([]InvoiceResponse, error) {
	db := database.GetDB()
	var invoices []Invoice
	if err := db.Preload("Items").Order("created_at DESC").Find(&invoices).Error; err != nil {
		return nil, err
	}

	responses := make([]InvoiceResponse, len(invoices))
	for i, inv := range invoices {
		responses[i] = *s.toResponse(&inv)
	}
	return responses, nil
}

// GetInvoiceByID returns a single invoice by ID
func (s *Service) GetInvoiceByID(id uint) (*InvoiceResponse, error) {
	db := database.GetDB()
	var invoice Invoice
	if err := db.Preload("Items").First(&invoice, id).Error; err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}
	return s.toResponse(&invoice), nil
}

// ConvertToWords converts a number to French words
func (s *Service) ConvertToWords(amount float64) string {
	// Split into whole and decimal parts
	wholePart := int(amount)
	decimalPart := int(math.Round((amount - float64(wholePart)) * 100))

	// Convert to French words
	wholeWords := IntToFrench(wholePart)

	// Capitalize first letter
	if len(wholeWords) > 0 {
		wholeWords = strings.ToUpper(string(wholeWords[0])) + wholeWords[1:]
	}

	result := fmt.Sprintf("Arrêté la présente facture à la somme de : %s dirhams", wholeWords)

	if decimalPart > 0 {
		decimalWords := IntToFrench(decimalPart)
		result += fmt.Sprintf(" et %s centimes", decimalWords)
	}

	return result
}

// CalculateTotals calculates HT, TVA from TTC (for preview)
func (s *Service) CalculateTotals(totalTTC float64) map[string]interface{} {
	totalHT := totalTTC / 1.20
	totalTVA := totalTTC - totalHT

	return map[string]interface{}{
		"totalHT":      math.Round(totalHT*100) / 100,
		"totalTVA":     math.Round(totalTVA*100) / 100,
		"totalTTC":     math.Round(totalTTC*100) / 100,
		"totalInWords": s.ConvertToWords(totalTTC),
	}
}

// toResponse converts Invoice model to response DTO
func (s *Service) toResponse(inv *Invoice) *InvoiceResponse {
	resp := &InvoiceResponse{
		ID:                inv.ID,
		FormattedID:       inv.FormattedID,
		CustomFormattedID: inv.CustomFormattedID,
		Date:              inv.Date.Format("02-01-2006"),
		ClientName:        inv.ClientName,
		ClientCity:        inv.ClientCity,
		ClientICE:         inv.ClientICE,
		TotalHT:           inv.TotalHT,
		TotalTVA:          inv.TotalTVA,
		TotalTTC:          inv.TotalTTC,
		TotalInWords:      inv.TotalInWords,
		PaymentMethod:     inv.PaymentMethod,
		Items:             inv.Items,
	}

	if inv.PaymentMethod == "CHEQUE" && inv.ChequeNumber != "" {
		resp.ChequeInfo = &ChequeInfo{
			Number:    inv.ChequeNumber,
			Bank:      inv.ChequeBank,
			City:      inv.ChequeCity,
			Reference: inv.ChequeReference,
		}
	}

	if inv.PaymentMethod == "EFFET" && inv.EffetCity != "" {
		resp.EffetInfo = &EffetInfo{
			City:         inv.EffetCity,
			DateEcheance: inv.EffetDateEcheance,
		}
	}

	return resp
}

type InvoiceStats struct {
	TotalRevenue   float64
	TotalInvoices  int64
	RecentInvoices []InvoiceResponse
}

func (s *Service) GetStats() (*InvoiceStats, error) {
	db := database.GetDB()
	var stats InvoiceStats

	// Total Invoices
	if err := db.Model(&Invoice{}).Count(&stats.TotalInvoices).Error; err != nil {
		return nil, err
	}

	// Total Revenue
	var result struct {
		Total float64
	}
	if err := db.Model(&Invoice{}).Select("sum(total_ttc) as total").Scan(&result).Error; err != nil {
		return nil, err
	}
	stats.TotalRevenue = result.Total

	// Recent Invoices
	var recent []Invoice
	if err := db.Preload("Items").Order("created_at desc").Limit(5).Find(&recent).Error; err != nil {
		return nil, err
	}

	for _, inv := range recent {
		stats.RecentInvoices = append(stats.RecentInvoices, *s.toResponse(&inv))
	}

	return &stats, nil
}
