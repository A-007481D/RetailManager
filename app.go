package main

import (
	"context"
	"fmt"

	"factureapp/backend/client"
	"factureapp/backend/database"
	"factureapp/backend/inventory"
	"factureapp/backend/invoice"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx              context.Context
	invoiceService   *invoice.Service
	inventoryService *inventory.Service
	clientService    *client.Service
}

// NewApp creates a new App application struct
func NewApp() *App {
	inventoryService := inventory.NewService()
	invoiceService := invoice.NewService(inventoryService)
	clientService := client.NewService()

	return &App{
		invoiceService:   invoiceService,
		inventoryService: inventoryService,
		clientService:    clientService,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	if err := database.InitDatabase(); err != nil {
		panic(fmt.Sprintf("Failed to initialize database: %v", err))
	}

	// Run migrations
	if err := a.inventoryService.Migrate(); err != nil {
		panic(fmt.Sprintf("Failed to run inventory migrations: %v", err))
	}
	if err := a.invoiceService.Migrate(); err != nil {
		panic(fmt.Sprintf("Failed to run invoice migrations: %v", err))
	}
	if err := a.clientService.Migrate(); err != nil {
		panic(fmt.Sprintf("Failed to run client migrations: %v", err))
	}

	fmt.Println("FactureApp started successfully")
}

// CreateInvoice creates a new invoice and returns the response
func (a *App) CreateInvoice(req invoice.InvoiceCreateRequest) (*invoice.InvoiceResponse, error) {
	return a.invoiceService.CreateInvoice(req)
}

// UpdateInvoice updates an existing invoice
func (a *App) UpdateInvoice(id uint, req invoice.InvoiceCreateRequest) (*invoice.InvoiceResponse, error) {
	return a.invoiceService.UpdateInvoice(id, req)
}

// GetAllInvoices returns all invoices
func (a *App) GetAllInvoices() ([]invoice.InvoiceResponse, error) {
	return a.invoiceService.GetAllInvoices()
}

// GetInvoiceByID returns a single invoice by ID
func (a *App) GetInvoiceByID(id uint) (*invoice.InvoiceResponse, error) {
	return a.invoiceService.GetInvoiceByID(id)
}

// GeneratePDF generates a PDF for the invoice and returns the file path
func (a *App) GeneratePDF(invoiceID uint) (string, error) {
	pdfPath, err := a.invoiceService.GeneratePDF(invoiceID)
	if err != nil {
		return "", err
	}
	return pdfPath, nil
}

// OpenPDF opens the generated PDF in the default system viewer
func (a *App) OpenPDF(pdfPath string) {
	runtime.BrowserOpenURL(a.ctx, "file://"+pdfPath)
}

// CalculateTotals calculates totals from TTC for live preview
func (a *App) CalculateTotals(totalTTC float64) map[string]interface{} {
	return a.invoiceService.CalculateTotals(totalTTC)
}

// GetTotalInWords converts amount to French words
func (a *App) GetTotalInWords(amount float64) string {
	return a.invoiceService.ConvertToWords(amount)
}

// CreateProduct creates a new product
func (a *App) CreateProduct(product inventory.Product) (*inventory.Product, error) {
	return a.inventoryService.CreateProduct(product)
}

// GetAllProducts returns all products
func (a *App) GetAllProducts() ([]inventory.Product, error) {
	return a.inventoryService.GetAllProducts()
}

// UpdateProduct updates an existing product
func (a *App) UpdateProduct(product inventory.Product) error {
	return a.inventoryService.UpdateProduct(product)
}

func (a *App) DeleteProduct(id uint) error {
	return a.inventoryService.DeleteProduct(id)
}

type DashboardStats struct {
	InvoiceStats   *invoice.InvoiceStats
	InventoryStats *inventory.InventoryStats
}

func (a *App) GetDashboardStats() (*DashboardStats, error) {
	invStats, err := a.invoiceService.GetStats()
	if err != nil {
		return nil, err
	}

	stockStats, err := a.inventoryService.GetStats()
	if err != nil {
		return nil, err
	}

	return &DashboardStats{
		InvoiceStats:   invStats,
		InventoryStats: stockStats,
	}, nil
}

// CreateClient creates a new client
func (a *App) CreateClient(c client.Client) error {
	return a.clientService.CreateClient(c)
}

// UpdateClient updates an existing client
func (a *App) UpdateClient(c client.Client) error {
	return a.clientService.UpdateClient(c)
}

// DeleteClient deletes a client
func (a *App) DeleteClient(id uint) error {
	return a.clientService.DeleteClient(id)
}

// GetAllClients returns all clients
func (a *App) GetAllClients() ([]client.Client, error) {
	return a.clientService.GetAllClients()
}

// SearchClients searches clients
func (a *App) SearchClients(query string) ([]client.Client, error) {
	return a.clientService.SearchClients(query)
}
