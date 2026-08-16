package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"factureapp/backend/client"
	"factureapp/backend/database"
	"factureapp/backend/inventory"
	"factureapp/backend/invoice"
	"factureapp/backend/settings"
	"factureapp/backend/sheets"
)

const AppVersion = "1.1.9"

// App struct
type App struct {
	ctx              context.Context
	invoiceService   *invoice.Service
	inventoryService *inventory.Service
	clientService    *client.Service
	settingsService  *settings.Service
	sheetsService    *sheets.Service
}

// NewApp creates a new App application struct
func NewApp() *App {
	inventoryService := inventory.NewService()
	invoiceService := invoice.NewService(inventoryService)
	clientService := client.NewService()
	settingsService := settings.NewService()
	sheetsService := sheets.NewService()

	return &App{
		invoiceService:   invoiceService,
		inventoryService: inventoryService,
		clientService:    clientService,
		settingsService:  settingsService,
		sheetsService:    sheetsService,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	fmt.Println("Wails Context Initialized.")

	// Initialize database
	fmt.Println("Initializing Database...")
	if err := database.InitDatabase(); err != nil {
		errorMessage := fmt.Sprintf("ERREUR CRITIQUE: Échec de l'initialisation de la base de données: %v\n\nL'application est peut-être déjà ouverte ?", err)
		fmt.Println(errorMessage)
		
		// Fallback to native message box for visibility in production
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Erreur de Démarrage",
			Message: errorMessage,
		})
		os.Exit(1)
	}
	fmt.Println("Database Initialized Successfully.")

	// Run migrations
	fmt.Println("Running Inventory Migrations...")
	if err := a.inventoryService.Migrate(); err != nil {
		errorMessage := fmt.Sprintf("Erreur lors de la mise à jour (Inventaire): %v", err)
		fmt.Println(errorMessage)
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Erreur de Migration",
			Message: errorMessage,
		})
		os.Exit(1)
	}

	fmt.Println("Running Settings Migrations...")
	if err := a.settingsService.Migrate(); err != nil {
		errorMessage := fmt.Sprintf("Erreur lors de la mise à jour (Paramètres): %v", err)
		fmt.Println(errorMessage)
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Erreur de Migration",
			Message: errorMessage,
		})
		os.Exit(1)
	}

	fmt.Println("Running Invoice Migrations...")
	if err := a.invoiceService.Migrate(); err != nil {
		errorMessage := fmt.Sprintf("Erreur lors de la mise à jour (Factures): %v", err)
		fmt.Println(errorMessage)
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Erreur de Migration",
			Message: errorMessage,
		})
		os.Exit(1)
	}

	fmt.Println("Running Client Migrations...")
	if err := a.clientService.Migrate(); err != nil {
		errorMessage := fmt.Sprintf("Erreur lors de la mise à jour (Clients): %v", err)
		fmt.Println(errorMessage)
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:    runtime.ErrorDialog,
			Title:   "Erreur de Migration",
			Message: errorMessage,
		})
		os.Exit(1)
	}

	fmt.Println("App Initialization Complete.")
	fmt.Println("RetailManager started successfully")
}

// CreateInvoice creates a new invoice and returns the response
func (a *App) CreateInvoice(req invoice.InvoiceCreateRequest) (*invoice.InvoiceResponse, error) {
	return a.invoiceService.CreateInvoice(req)
}

// UpdateInvoice updates an existing invoice
func (a *App) UpdateInvoice(id uint, req invoice.InvoiceCreateRequest) (*invoice.InvoiceResponse, error) {
	return a.invoiceService.UpdateInvoice(id, req)
}

// GetAllInvoices returns all invoices for a specific year
func (a *App) GetAllInvoices(year int) ([]invoice.InvoiceResponse, error) {
	return a.invoiceService.GetAllInvoices(year)
}

// GetInvoiceByID returns a single invoice by ID
func (a *App) GetInvoiceByID(id uint) (*invoice.InvoiceResponse, error) {
	return a.invoiceService.GetInvoiceByID(id)
}

// GetAvailableYears returns available years
func (a *App) GetAvailableYears() ([]int, error) {
	return a.invoiceService.GetAvailableYears()
}

// GeneratePDF generates a PDF for the invoice and returns the file path
func (a *App) GeneratePDF(invoiceID uint) (string, error) {
	pdfPath, err := a.invoiceService.GeneratePDF(invoiceID)
	if err != nil {
		return "", err
	}

	// Auto-export to Google Sheets
	inv, fetchErr := a.invoiceService.GetInvoiceByID(invoiceID)
	if fetchErr == nil {
		err := a.sheetsService.AppendInvoice(inv)
		if err == nil {
			_ = a.invoiceService.MarkAsSynced(invoiceID)
		}
	}

	return pdfPath, nil
}

// SyncOldInvoices syncs all unsynced invoices to Google Sheets
func (a *App) SyncOldInvoices() (int, error) {
	unsynced, err := a.invoiceService.GetUnsyncedInvoices()
	if err != nil {
		return 0, err
	}

	if len(unsynced) == 0 {
		return 0, nil
	}

	// Batch append to Sheets
	if err := a.sheetsService.BatchAppendInvoices(unsynced); err != nil {
		return 0, err
	}

	// Mark all as synced in DB
	syncedCount := 0
	for _, inv := range unsynced {
		if err := a.invoiceService.MarkAsSynced(inv.ID); err == nil {
			syncedCount++
		}
	}

	return syncedCount, nil
}

// GetVersion returns the application version
func (a *App) GetVersion() string {
	return AppVersion
}

// OpenPDF opens the generated PDF in the default system viewer
func (a *App) OpenPDF(pdfPath string) error {
	// Check if file exists
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		return fmt.Errorf("le fichier PDF n'existe pas: %s", pdfPath)
	}

	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "windows":
		// Windows: use cmd /c start
		cmd = exec.Command("cmd", "/c", "start", "", pdfPath)
	case "darwin":
		// macOS: use open
		cmd = exec.Command("open", pdfPath)
	default:
		// Linux: use xdg-open
		cmd = exec.Command("xdg-open", pdfPath)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("impossible d'ouvrir le PDF: %w", err)
	}

	return nil
}

// PrintPDF sends the PDF directly to the default printer
func (a *App) PrintPDF(pdfPath string) error {
	// Check if file exists
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		return fmt.Errorf("le fichier PDF n'existe pas: %s", pdfPath)
	}

	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "windows":
		// Windows: use PowerShell Start-Process with -Verb Print
		cmd = exec.Command("powershell", "-Command", fmt.Sprintf(`Start-Process -FilePath "%s" -Verb Print`, pdfPath))
	case "darwin":
		// macOS: use lpr command
		cmd = exec.Command("lpr", pdfPath)
	default:
		// Linux: use lpr command (requires CUPS)
		cmd = exec.Command("lpr", pdfPath)
	}

	if err := cmd.Run(); err != nil {
		// Provide helpful error message for Linux without printer
		if goruntime.GOOS == "linux" {
			return fmt.Errorf("impossible d'imprimer: vérifiez qu'une imprimante est configurée (CUPS). Sinon, utilisez 'Voir PDF' puis imprimez depuis le lecteur PDF")
		}
		return fmt.Errorf("impossible d'imprimer le PDF: %w", err)
	}

	return nil
}

// PrintMultiplePDFs sends multiple PDFs directly to the default printer
func (a *App) PrintMultiplePDFs(pdfPaths []string) error {
	var errs []string
	for _, pdfPath := range pdfPaths {
		if err := a.PrintPDF(pdfPath); err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", filepath.Base(pdfPath), err))
		}
		// Small delay to avoid overwhelming the print spooler on some systems
		time.Sleep(200 * time.Millisecond)
	}

	if len(errs) > 0 {
		return fmt.Errorf("erreurs lors de l'impression: %s", strings.Join(errs, "; "))
	}
	return nil
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

// GetSettings returns the global application settings
func (a *App) GetSettings() (*settings.Settings, error) {
	return a.settingsService.GetSettings()
}

// UpdateSettings updates the global application settings
func (a *App) UpdateSettings(req *settings.Settings) (*settings.Settings, error) {
	return a.settingsService.UpdateSettings(req)
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

func (a *App) GetDashboardStats(year int) (*DashboardStats, error) {
	invStats, err := a.invoiceService.GetStats(year)
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

// BackupDatabase allows the user to save a backup of the database
func (a *App) BackupDatabase() (string, error) {
	// 1. Get database path
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("impossible de localiser le dossier de configuration: %w", err)
	}
	dbPath := filepath.Join(configDir, "FactureApp", "invoices.db")

	// Verify database exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		return "", fmt.Errorf("aucune base de données trouvée à sauvegarder (%s)", dbPath)
	}

	// 2. Open Save Dialog
	defaultName := fmt.Sprintf("Sauvegarde_FactureApp_%s.db", time.Now().Format("2006-01-02_15-04"))

	// Create default backup directory in Documents
	homeDir, err := os.UserHomeDir()
	defaultDir := ""
	if err == nil {
		defaultDir = filepath.Join(homeDir, "Documents", "LogicielFacture_Backups")
		_ = os.MkdirAll(defaultDir, 0755) // Create if not exists, ignore error
	}

	destinationPath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:            "Sauvegarder la base de données",
		DefaultFilename:  defaultName,
		DefaultDirectory: defaultDir,
		Filters: []runtime.FileFilter{
			{DisplayName: "Database Files (*.db)", Pattern: "*.db"},
		},
	})

	if err != nil {
		return "", fmt.Errorf("erreur lors de la sélection du fichier: %w", err)
	}

	if destinationPath == "" {
		return "", nil // User cancelled
	}

	// 3. Copy File safely (Database might be locked if heavily used, but SQLite handles read locks well usually)
	// For absolute safety, we could use SQLite's backup API, but simple copy is usually fine for single-user desktop app
	// when not in heavy write transaction.
	input, err := os.Open(dbPath)
	if err != nil {
		return "", fmt.Errorf("impossible d'ouvrir la base de données source: %w", err)
	}
	defer input.Close()

	output, err := os.Create(destinationPath)
	if err != nil {
		return "", fmt.Errorf("impossible de créer le fichier de sauvegarde: %w", err)
	}
	defer output.Close()

	_, err = io.Copy(output, input)
	if err != nil {
		return "", fmt.Errorf("erreur lors de la copie des données: %w", err)
	}

	return fmt.Sprintf("Sauvegarde réussie dans: %s", destinationPath), nil
}

// RestoreDatabase allows the user to restore the database from a backup file
func (a *App) RestoreDatabase() (string, error) {
	// 1. Open File Dialog to select backup file
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Sélectionnez le fichier de sauvegarde",
		Filters: []runtime.FileFilter{
			{DisplayName: "Database Files (*.db)", Pattern: "*.db"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("erreur lors de la sélection du fichier: %w", err)
	}

	if selection == "" {
		return "", nil // User cancelled
	}

	// 2. Locate current database
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("impossible de localiser le dossier de configuration: %w", err)
	}
	dbPath := filepath.Join(configDir, "FactureApp", "invoices.db")
	backupPath := filepath.Join(configDir, "FactureApp", fmt.Sprintf("invoices_backup_%s.db", time.Now().Format("20060102_150405")))

	// 3. Close current database connection
	if err := database.CloseDB(); err != nil {
		return "", fmt.Errorf("impossible de fermer la base de données actuelle: %w", err)
	}

	// 4. Backup current database (safety precaution)
	// Only if it exists
	if _, err := os.Stat(dbPath); err == nil {
		input, err := os.Open(dbPath)
		if err != nil {
			return "", fmt.Errorf("impossible d'ouvrir la base de données actuelle pour la sauvegarde de sécurité: %w", err)
		}
		defer input.Close()

		output, err := os.Create(backupPath)
		if err != nil {
			return "", fmt.Errorf("impossible de créer la sauvegarde de sécurité: %w", err)
		}
		defer output.Close()

		if _, err = io.Copy(output, input); err != nil {
			return "", fmt.Errorf("erreur lors de la copie de sécurité: %w", err)
		}
	}

	// 5. Replace database with selected file
	// We need to read the source (selection) and overwrite the target (dbPath)
	sourceFile, err := os.Open(selection)
	if err != nil {
		return "", fmt.Errorf("impossible d'ouvrir le fichier de sauvegarde sélectionné: %w", err)
	}
	defer sourceFile.Close()

	// Ensure target file is closed and removed/truncated
	// Open with O_TRUNC to overwrite
	destFile, err := os.OpenFile(dbPath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0666)
	if err != nil {
		return "", fmt.Errorf("impossible d'ouvrir le fichier de destination: %w", err)
	}
	defer destFile.Close()

	if _, err = io.Copy(destFile, sourceFile); err != nil {
		// Attempt to restore from safety backup?
		return "", fmt.Errorf("erreur critique lors de la restauration: %w", err)
	}

	// 6. Re-initialize database connection
	if err := database.InitDatabase(); err != nil {
		return "", fmt.Errorf("impossible de réinitialiser la connexion à la base de données: %w", err)
	}

	// Re-run migrations to ensure schema is correct if restoring older version
	a.startup(a.ctx)

	return "Restauration réussie. L'application va redémarrer.", nil
}
