package sheets

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"factureapp/backend/invoice"

	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

type Settings struct {
	GoogleSpreadsheetID string `json:"google_spreadsheet_id"`
}

type Service struct {
	configDir     string
	isEnabled     bool
	sheetID       string
	srv           *sheets.Service
	headersPushed bool
}

func NewService() *Service {
	s := &Service{}
	configDir, err := os.UserConfigDir()
	if err != nil {
		log.Printf("Cannot get user config dir for Sheets: %v", err)
		return s
	}

	appConfigDir := filepath.Join(configDir, "FactureApp")
	_ = os.MkdirAll(appConfigDir, 0755)
	s.configDir = appConfigDir

	// Check credentials.json
	credsPath := filepath.Join(appConfigDir, "credentials.json")
	if _, err := os.Stat(credsPath); os.IsNotExist(err) {
		log.Printf("Google Sheets sync disabled: credentials.json not found in %s", appConfigDir)
		return s
	}

	// Read settings.json
	settingsPath := filepath.Join(appConfigDir, "settings.json")
	var settings Settings
	settingsData, err := os.ReadFile(settingsPath)
	if err != nil {
		// Create default settings file
		defaultSettings := Settings{GoogleSpreadsheetID: ""}
		data, _ := json.MarshalIndent(defaultSettings, "", "  ")
		_ = os.WriteFile(settingsPath, data, 0644)
		log.Printf("Google Sheets sync disabled: Please fill google_spreadsheet_id in %s", settingsPath)
		return s
	}

	if err := json.Unmarshal(settingsData, &settings); err != nil {
		log.Printf("Google Sheets sync disabled: invalid settings.json %v", err)
		return s
	}

	if settings.GoogleSpreadsheetID == "" {
		log.Printf("Google Sheets sync disabled: google_spreadsheet_id is empty")
		return s
	}
	s.sheetID = settings.GoogleSpreadsheetID

	ctx := context.Background()
	b, err := os.ReadFile(credsPath)
	if err != nil {
		log.Printf("Unable to read client secret file: %v", err)
		return s
	}

	config, err := google.JWTConfigFromJSON(b, sheets.SpreadsheetsScope)
	if err != nil {
		log.Printf("Unable to parse client secret file to config: %v", err)
		return s
	}
	client := config.Client(ctx)

	srv, err := sheets.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		log.Printf("Unable to retrieve Sheets client: %v", err)
		return s
	}

	s.srv = srv
	s.isEnabled = true
	log.Printf("Google Sheets sync initialized successfully for spreadsheet: %s", s.sheetID)
	return s
}

func (s *Service) AppendInvoice(inv *invoice.InvoiceResponse) error {
	if !s.isEnabled {
		return nil // silently ignore if not configured
	}

	// Check and push headers if sheet is empty
	if !s.headersPushed {
		s.ensureHeaders()
	}

	// Prepare data
	// Columns: Invoice ID, Date, Client Name, ICE, Total HT, Total TVA, Total TTC, Payment Method
	vr := &sheets.ValueRange{
		Values: [][]interface{}{
			{
				inv.FormattedID,
				inv.Date,
				inv.ClientName,
				inv.ClientICE,
				fmt.Sprintf("%.2f", inv.TotalHT),
				fmt.Sprintf("%.2f", inv.TotalTVA),
				fmt.Sprintf("%.2f", inv.TotalTTC),
				inv.PaymentMethod,
			},
		},
	}

	spreadsheetId := s.sheetID
	writeRange := "A:H" // General range, API will find the next empty row

	_, err := s.srv.Spreadsheets.Values.Append(spreadsheetId, writeRange, vr).
		ValueInputOption("USER_ENTERED").
		InsertDataOption("INSERT_ROWS").
		Do()

	if err != nil {
		return fmt.Errorf("failed to append row to sheets: %w", err)
	}

	log.Printf("Successfully appended invoice %s to Google Sheets", inv.FormattedID)
	return nil
}

func (s *Service) ensureHeaders() {
	readRange := "A1:H1"
	resp, err := s.srv.Spreadsheets.Values.Get(s.sheetID, readRange).Do()
	if err != nil {
		log.Printf("Failed to read headers: %v", err)
		return
	}

	if len(resp.Values) == 0 {
		// Sheet is empty, push headers
		headerVr := &sheets.ValueRange{
			Values: [][]interface{}{
				{"ID Facture", "Date", "Client", "ICE", "Total HT", "TVA", "Total TTC", "Paiement"},
			},
		}
		_, err = s.srv.Spreadsheets.Values.Update(s.sheetID, readRange, headerVr).
			ValueInputOption("USER_ENTERED").
			Do()
		if err != nil {
			log.Printf("Failed to push headers: %v", err)
		} else {
			log.Printf("Successfully pushed table headers to Google Sheets")
		}
	}
	
	s.headersPushed = true
}
