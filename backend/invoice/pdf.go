package invoice

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

const (
	// CompanyICE is the placeholder for company ICE number
	CompanyICE = "000000000000000" // Replace with actual company ICE

	// TopMarginMM is the blank margin at top for pre-printed stationery
	TopMarginMM = 40.0
)

// GeneratePDF creates a PDF invoice and returns the file path
func (s *Service) GeneratePDF(invoiceID uint) (string, error) {
	// Get invoice data
	invoice, err := s.GetInvoiceByID(invoiceID)
	if err != nil {
		return "", err
	}

	// Configure Maroto
	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithRightMargin(15).
		WithTopMargin(TopMarginMM). // 40mm top margin for pre-printed stationery
		Build()

	m := maroto.New(cfg)

	// Header section
	s.addHeader(m, invoice)

	// Add spacing
	m.AddRow(10)

	// Items table
	s.addItemsTable(m, invoice)

	// Add spacing
	m.AddRow(10)

	// Totals section
	s.addTotals(m, invoice)

	// Add spacing
	m.AddRow(8)

	// Legal text (Total in words)
	s.addLegalText(m, invoice)

	// Add spacing
	m.AddRow(8)

	// Payment details
	s.addPaymentDetails(m, invoice)

	// Add spacing before footer
	m.AddRow(15)

	// Company ICE footer
	s.addFooter(m)

	// Generate PDF
	doc, err := m.Generate()
	if err != nil {
		return "", fmt.Errorf("failed to generate PDF: %w", err)
	}

	// Save to file
	outputDir, err := os.UserConfigDir()
	if err != nil {
		outputDir = "."
	}
	pdfDir := filepath.Join(outputDir, "FactureApp", "pdfs")
	if err := os.MkdirAll(pdfDir, 0755); err != nil {
		return "", err
	}

	pdfPath := filepath.Join(pdfDir, fmt.Sprintf("Facture_%s.pdf", invoice.FormattedID))
	pdfPath = filepath.Clean(pdfPath)

	// Replace spaces and special chars in filename
	safeName := fmt.Sprintf("Facture_%04d_%d.pdf", invoice.ID, invoice.ID)
	pdfPath = filepath.Join(pdfDir, safeName)

	if err := doc.Save(pdfPath); err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}

	return pdfPath, nil
}

func (s *Service) addHeader(m core.Maroto, invoice *InvoiceResponse) {
	m.AddRow(8,
		col.New(6).Add(
			text.New("Facture N°: "+invoice.FormattedID, props.Text{
				Size:  12,
				Style: fontstyle.Bold,
			}),
		),
		col.New(6).Add(
			text.New("A: "+invoice.ClientName, props.Text{
				Size:  11,
				Align: align.Right,
			}),
		),
	)

	m.AddRow(6,
		col.New(6).Add(
			text.New("Date: "+invoice.Date, props.Text{
				Size: 10,
			}),
		),
		col.New(6).Add(
			text.New("Ville: "+invoice.ClientCity, props.Text{
				Size:  10,
				Align: align.Right,
			}),
		),
	)

	m.AddRow(6,
		col.New(6),
		col.New(6).Add(
			text.New("ICE: "+invoice.ClientICE, props.Text{
				Size:  10,
				Align: align.Right,
			}),
		),
	)
}

func (s *Service) addItemsTable(m core.Maroto, invoice *InvoiceResponse) {
	// Table header
	headerProps := props.Text{
		Size:  10,
		Style: fontstyle.Bold,
		Align: align.Center,
	}

	m.AddRow(8,
		col.New(5).Add(text.New("Description", headerProps)),
		col.New(2).Add(text.New("Qté", headerProps)),
		col.New(3).Add(text.New("Prix Unit TTC", headerProps)),
		col.New(2).Add(text.New("Total TTC", headerProps)),
	)

	// Draw header line
	m.AddRow(1)

	// Table rows
	cellProps := props.Text{
		Size:  9,
		Align: align.Center,
	}

	for _, item := range invoice.Items {
		m.AddRow(7,
			col.New(5).Add(text.New(item.Description, props.Text{
				Size: 9,
			})),
			col.New(2).Add(text.New(fmt.Sprintf("%.2f", item.Quantity), cellProps)),
			col.New(3).Add(text.New(fmt.Sprintf("%.2f DH", item.PrixUnitTTC), cellProps)),
			col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", item.TotalTTC), cellProps)),
		)
	}
}

func (s *Service) addTotals(m core.Maroto, invoice *InvoiceResponse) {
	totalProps := props.Text{
		Size:  10,
		Align: align.Right,
	}

	boldTotalProps := props.Text{
		Size:  11,
		Style: fontstyle.Bold,
		Align: align.Right,
	}

	m.AddRow(6,
		col.New(8),
		col.New(2).Add(text.New("Total HT:", totalProps)),
		col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", invoice.TotalHT), totalProps)),
	)

	m.AddRow(6,
		col.New(8),
		col.New(2).Add(text.New("TVA 20%:", totalProps)),
		col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", invoice.TotalTVA), totalProps)),
	)

	m.AddRow(7,
		col.New(8),
		col.New(2).Add(text.New("TOTAL TTC:", boldTotalProps)),
		col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", invoice.TotalTTC), boldTotalProps)),
	)
}

func (s *Service) addLegalText(m core.Maroto, invoice *InvoiceResponse) {
	m.AddRow(12,
		col.New(12).Add(
			text.New(invoice.TotalInWords, props.Text{
				Size:  9,
				Style: fontstyle.Italic,
			}),
		),
	)
}

func (s *Service) addPaymentDetails(m core.Maroto, invoice *InvoiceResponse) {
	var paymentText string

	switch invoice.PaymentMethod {
	case "ESPECE":
		paymentText = "Mode de paiement: Espèce"
	case "CHEQUE":
		if invoice.ChequeInfo != nil {
			paymentText = fmt.Sprintf(
				"Paiement par Chèque N° %s, Banque: %s, Ville: %s, Réf: %s",
				invoice.ChequeInfo.Number,
				invoice.ChequeInfo.Bank,
				invoice.ChequeInfo.City,
				invoice.ChequeInfo.Reference,
			)
		}
	case "EFFET":
		if invoice.EffetInfo != nil {
			paymentText = fmt.Sprintf(
				"Paiement par Effet, Ville: %s, Date d'échéance: %s",
				invoice.EffetInfo.City,
				invoice.EffetInfo.DateEcheance,
			)
		}
	}

	if paymentText != "" {
		m.AddRow(8,
			col.New(12).Add(
				text.New(paymentText, props.Text{
					Size: 9,
				}),
			),
		)
	}
}

func (s *Service) addFooter(m core.Maroto) {
	m.AddRow(10,
		col.New(12).Add(
			text.New("ICE Société: "+CompanyICE, props.Text{
				Size:  9,
				Align: align.Center,
			}),
		),
	)
}
