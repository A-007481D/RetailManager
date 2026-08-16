package sheets

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"factureapp/backend/invoice"
	appsettings "factureapp/backend/settings"

	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

type Service struct {
	configDir     string
	srv           *sheets.Service
	headersPushed map[string]bool
}

func NewService() *Service {
	s := &Service{
		headersPushed: make(map[string]bool),
	}
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
	log.Printf("Google Sheets API initialized successfully")
	return s
}

func (s *Service) AppendInvoice(inv *invoice.InvoiceResponse) error {
	if s.srv == nil {
		return fmt.Errorf("Sheets API is not configured (missing credentials.json)")
	}

	settingsSvc := appsettings.NewService()
	appSettings, err := settingsSvc.GetSettings()
	if err != nil {
		return fmt.Errorf("failed to get settings: %w", err)
	}

	spreadsheetId := appSettings.GoogleSheetsID
	if spreadsheetId == "" {
		return fmt.Errorf("Google Sheets ID is not configured in Settings")
	}

	yearStr := "General"
	if len(inv.Date) >= 10 {
		yearStr = inv.Date[6:]
	}

	if !s.headersPushed[yearStr] {
		if err := s.ensureSheetExistsAndHasHeaders(spreadsheetId, yearStr); err != nil {
			return err
		}
	}

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

	writeRange := fmt.Sprintf("%s!A:H", yearStr)

	_, err = s.srv.Spreadsheets.Values.Append(spreadsheetId, writeRange, vr).
		ValueInputOption("USER_ENTERED").
		InsertDataOption("INSERT_ROWS").
		Do()

	if err != nil {
		return fmt.Errorf("failed to append row to sheets: %w", err)
	}

	log.Printf("Successfully appended invoice %s to Google Sheets tab %s", inv.FormattedID, yearStr)
	return nil
}

func (s *Service) ensureSheetExistsAndHasHeaders(spreadsheetId string, sheetName string) error {
	spreadsheet, err := s.srv.Spreadsheets.Get(spreadsheetId).Do()
	if err != nil {
		return fmt.Errorf("failed to get spreadsheet info: %w", err)
	}

	sheetExists := false
	for _, sheet := range spreadsheet.Sheets {
		if sheet.Properties.Title == sheetName {
			sheetExists = true
			break
		}
	}

	if !sheetExists {
		addSheetRequest := &sheets.Request{
			AddSheet: &sheets.AddSheetRequest{
				Properties: &sheets.SheetProperties{
					Title: sheetName,
				},
			},
		}
		batchUpdateRequest := &sheets.BatchUpdateSpreadsheetRequest{
			Requests: []*sheets.Request{addSheetRequest},
		}
		_, err := s.srv.Spreadsheets.BatchUpdate(spreadsheetId, batchUpdateRequest).Do()
		if err != nil {
			return fmt.Errorf("failed to create sheet tab %s: %w", sheetName, err)
		}
		log.Printf("Successfully created new tab: %s", sheetName)
	}

	readRange := fmt.Sprintf("%s!A1:H1", sheetName)
	resp, err := s.srv.Spreadsheets.Values.Get(spreadsheetId, readRange).Do()
	if err != nil {
		return fmt.Errorf("failed to read headers for sheet %s: %w", sheetName, err)
	}

	if len(resp.Values) == 0 {
		headerVr := &sheets.ValueRange{
			Values: [][]interface{}{
				{"ID Facture", "Date", "Client", "ICE", "Total HT", "TVA", "Total TTC", "Paiement"},
			},
		}
		_, err = s.srv.Spreadsheets.Values.Update(spreadsheetId, readRange, headerVr).
			ValueInputOption("USER_ENTERED").
			Do()
		if err != nil {
			log.Printf("Failed to push headers to %s: %v", sheetName, err)
		} else {
			log.Printf("Successfully pushed table headers to %s", sheetName)
		}
	}

	s.headersPushed[sheetName] = true
	return nil
}

func (s *Service) BatchAppendInvoices(invoices []invoice.InvoiceResponse) error {
	if s.srv == nil {
		return fmt.Errorf("Sheets API is not configured (missing credentials.json)")
	}

	settingsSvc := appsettings.NewService()
	appSettings, err := settingsSvc.GetSettings()
	if err != nil {
		return fmt.Errorf("failed to get settings: %w", err)
	}

	spreadsheetId := appSettings.GoogleSheetsID
	if spreadsheetId == "" {
		return fmt.Errorf("Google Sheets ID is not configured in Settings")
	}

	if len(invoices) == 0 {
		return nil
	}

	// Group invoices by year
	invoicesByYear := make(map[string][][]interface{})
	for _, inv := range invoices {
		yearStr := "General"
		if len(inv.Date) >= 10 {
			yearStr = inv.Date[6:]
		}
		row := []interface{}{
			inv.FormattedID,
			inv.Date,
			inv.ClientName,
			inv.ClientICE,
			fmt.Sprintf("%.2f", inv.TotalHT),
			fmt.Sprintf("%.2f", inv.TotalTVA),
			fmt.Sprintf("%.2f", inv.TotalTTC),
			inv.PaymentMethod,
		}
		invoicesByYear[yearStr] = append(invoicesByYear[yearStr], row)
	}

	// Append per year
	for yearStr, rows := range invoicesByYear {
		if !s.headersPushed[yearStr] {
			if err := s.ensureSheetExistsAndHasHeaders(spreadsheetId, yearStr); err != nil {
				return err
			}
		}

		vr := &sheets.ValueRange{
			Values: rows,
		}

		writeRange := fmt.Sprintf("%s!A:H", yearStr)

		_, err = s.srv.Spreadsheets.Values.Append(spreadsheetId, writeRange, vr).
			ValueInputOption("USER_ENTERED").
			InsertDataOption("INSERT_ROWS").
			Do()

		if err != nil {
			return fmt.Errorf("failed to batch append rows to tab %s: %w", yearStr, err)
		}
		log.Printf("Successfully batch appended %d invoices to tab %s", len(rows), yearStr)
	}

	return nil
}
