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
		// Fetch product for details
		var product inventory.Product
		if err := tx.First(&product, item.ProductID).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("product not found: %w", err)
		}

		items[i] = InvoiceItem{
			ProductID:   item.ProductID,
			Product:     product,
			Description: item.Description,
			Quantity:    item.Quantity,
			BuyingPrice: product.BuyingPrice, // Snapshot buying price
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

	// Set	// Payment Info
	invoice.PaymentMethod = req.PaymentMethod
	if req.PaymentMethod == "CHEQUE" && req.ChequeInfo != nil {
		invoice.ChequeNumber = req.ChequeInfo.Number
		invoice.ChequeBank = req.ChequeInfo.Bank
		invoice.ChequeCity = req.ChequeInfo.City
		// Reference removed for Cheque
	} else if req.PaymentMethod == "EFFET" && req.EffetInfo != nil {
		invoice.EffetCity = req.EffetInfo.City
		invoice.EffetDateEcheance = req.EffetInfo.DateEcheance
		invoice.EffetBank = req.EffetInfo.Bank
		invoice.EffetReference = req.EffetInfo.Reference
	}

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

	// 3. Update Invoice Fields
	invoice.Date, _ = time.Parse("02-01-2006", req.Date)
	invoice.CustomFormattedID = req.CustomFormattedID
	invoice.ClientName = req.ClientName
	invoice.ClientCity = req.ClientCity
	invoice.ClientICE = req.ClientICE
	invoice.PaymentMethod = req.PaymentMethod

	// Clear old payment info
	invoice.ChequeNumber = ""
	invoice.ChequeBank = ""
	invoice.ChequeCity = ""
	invoice.ChequeReference = ""
	invoice.EffetCity = ""
	invoice.EffetDateEcheance = ""
	invoice.EffetBank = ""
	invoice.EffetReference = ""

	if req.PaymentMethod == "CHEQUE" && req.ChequeInfo != nil {
		invoice.ChequeNumber = req.ChequeInfo.Number
		invoice.ChequeBank = req.ChequeInfo.Bank
		invoice.ChequeCity = req.ChequeInfo.City
	} else if req.PaymentMethod == "EFFET" && req.EffetInfo != nil {
		invoice.EffetCity = req.EffetInfo.City
		invoice.EffetDateEcheance = req.EffetInfo.DateEcheance
		invoice.EffetBank = req.EffetInfo.Bank
		invoice.EffetReference = req.EffetInfo.Reference
	}

	// 4. Process NEW items
	var newItems []InvoiceItem
	var totalTTC float64

	for _, itemReq := range req.Items {
		// Decrement stock for NEW item
		if err := s.inventoryService.DecreaseStock(tx, itemReq.ProductID, int(itemReq.Quantity)); err != nil {
			tx.Rollback()
			return nil, err
		}

		totalItem := itemReq.Quantity * itemReq.PrixUnitTTC
		totalTTC += totalItem

		// Fetch product for details
		var product inventory.Product
		if err := tx.First(&product, itemReq.ProductID).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("product not found: %w", err)
		}

		newItems = append(newItems, InvoiceItem{
			ProductID:   itemReq.ProductID,
			Product:     product,
			Description: itemReq.Description,
			Quantity:    itemReq.Quantity,
			BuyingPrice: product.BuyingPrice, // Snapshot buying price
			PrixUnitTTC: itemReq.PrixUnitTTC,
			TotalTTC:    totalItem,
		})
	}

	// Calculate totals
	totals := s.CalculateTotals(totalTTC)
	invoice.TotalHT = totals["totalHT"].(float64)
	invoice.TotalTVA = totals["totalTVA"].(float64)
	invoice.TotalTTC = totals["totalTTC"].(float64)
	invoice.TotalInWords = totals["totalInWords"].(string)
	invoice.Items = newItems

	// Save updated invoice
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

// GetAllInvoices returns all invoices for a specific year
func (s *Service) GetAllInvoices(year int) ([]InvoiceResponse, error) {
	db := database.GetDB()

	// Default to current year if 0
	if year == 0 {
		year = time.Now().Year()
	}

	var invoices []Invoice
	if err := db.Preload("Items").Where("year = ?", year).Order("created_at DESC").Find(&invoices).Error; err != nil {
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

// GetAvailableYears returns a list of years available in the database
func (s *Service) GetAvailableYears() ([]int, error) {
	db := database.GetDB()
	var years []int
	if err := db.Model(&Invoice{}).Distinct("year").Order("year desc").Pluck("year", &years).Error; err != nil {
		return nil, err
	}

	// Ensure current year is always included
	currentYear := time.Now().Year()
	found := false
	for _, y := range years {
		if y == currentYear {
			found = true
			break
		}
	}
	if !found {
		years = append([]int{currentYear}, years...)
	}

	return years, nil
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
			Bank:         inv.EffetBank,
			Reference:    inv.EffetReference,
		}
	}

	return resp
}

type MonthlyRevenue struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

type ClientStat struct {
	Name         string  `json:"name"`
	TotalSpend   float64 `json:"totalSpend"`
	InvoiceCount int64   `json:"invoiceCount"`
}

type ProductStat struct {
	Name         string  `json:"name"`
	QuantitySold int     `json:"quantitySold"`
	Revenue      float64 `json:"revenue"`
}

type InvoiceStats struct {
	TotalRevenue   float64
	TotalNetProfit float64
	TotalInvoices  int64
	RecentInvoices []InvoiceResponse
	MonthlyRevenue []MonthlyRevenue
	TopClients     []ClientStat
	TopProducts    []ProductStat
}

func (s *Service) GetStats(year int) (*InvoiceStats, error) {
	db := database.GetDB()
	var stats InvoiceStats

	// Default to current year if 0
	if year == 0 {
		year = time.Now().Year()
	}

	// Total Invoices
	if err := db.Model(&Invoice{}).Where("year = ?", year).Count(&stats.TotalInvoices).Error; err != nil {
		return nil, err
	}

	// Total Revenue
	var result struct {
		Total float64
	}
	if err := db.Model(&Invoice{}).Where("year = ?", year).Select("sum(total_ttc) as total").Scan(&result).Error; err != nil {
		return nil, err
	}
	stats.TotalRevenue = result.Total

	// Total Net Profit
	// Profit = Sum( (Item.TotalTTC) - (Item.BuyingPrice * Item.Quantity) )
	// We use the stored BuyingPrice from invoice_items for historical accuracy
	var profitResult struct {
		Total float64
	}
	err := db.Table("invoice_items").
		Select("SUM(invoice_items.total_ttc - (invoice_items.buying_price * invoice_items.quantity)) as total").
		Joins("JOIN invoices ON invoice_items.invoice_id = invoices.id").
		Where("invoices.deleted_at IS NULL AND invoices.year = ?", year).
		Scan(&profitResult).Error

	if err != nil {
		return nil, err
	}
	stats.TotalNetProfit = profitResult.Total

	// Recent Invoices (Filtered by year)
	var recent []Invoice
	if err := db.Preload("Items").Where("year = ?", year).Order("created_at desc").Limit(5).Find(&recent).Error; err != nil {
		return nil, err
	}

	for _, inv := range recent {
		stats.RecentInvoices = append(stats.RecentInvoices, *s.toResponse(&inv))
	}

	// Monthly Revenue (Selected Year)
	rows, err := db.Model(&Invoice{}).
		Select("strftime('%m', date) as month, sum(total_ttc) as revenue").
		Where("year = ?", year).
		Group("month").
		Order("month").
		Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Initialize all months with 0
	revenueMap := make(map[string]float64)
	months := []string{"01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"}
	for _, m := range months {
		revenueMap[m] = 0
	}

	for rows.Next() {
		var month string
		var revenue float64
		if err := rows.Scan(&month, &revenue); err == nil {
			revenueMap[month] = revenue
		}
	}

	// Convert to slice
	monthNames := []string{"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"}
	for i, m := range months {
		stats.MonthlyRevenue = append(stats.MonthlyRevenue, MonthlyRevenue{
			Month:   monthNames[i],
			Revenue: revenueMap[m],
		})
	}

	// Top Clients (Selected Year)
	clientRows, err := db.Model(&Invoice{}).
		Select("client_name, sum(total_ttc) as total_spend, count(id) as invoice_count").
		Where("year = ?", year).
		Group("client_name").
		Order("total_spend desc").
		Limit(5).
		Rows()
	if err != nil {
		return nil, err
	}
	defer clientRows.Close()

	for clientRows.Next() {
		var cs ClientStat
		if err := clientRows.Scan(&cs.Name, &cs.TotalSpend, &cs.InvoiceCount); err == nil {
			stats.TopClients = append(stats.TopClients, cs)
		}
	}

	// Top Products (Selected Year)
	// Need to join with invoices to filter by year
	productRows, err := db.Table("invoice_items").
		Select("invoice_items.description, sum(invoice_items.quantity) as quantity_sold, sum(invoice_items.total_ttc) as revenue").
		Joins("JOIN invoices ON invoice_items.invoice_id = invoices.id").
		Where("invoices.year = ? AND invoices.deleted_at IS NULL", year).
		Group("invoice_items.description").
		Order("quantity_sold desc").
		Limit(5).
		Rows()
	if err != nil {
		return nil, err
	}
	defer productRows.Close()

	for productRows.Next() {
		var ps ProductStat
		if err := productRows.Scan(&ps.Name, &ps.QuantitySold, &ps.Revenue); err == nil {
			stats.TopProducts = append(stats.TopProducts, ps)
		}
	}

	return &stats, nil
}
