package invoice

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

const (
	// CompanyICE is the placeholder for company ICE number
	CompanyICE = "001844544000022" // Replace with actual company ICE

	// TopMarginMM is the blank margin at top for pre-printed stationery
	TopMarginMM = 40.0
)

// Color definitions
var (
	primaryColor  = &props.Color{Red: 0, Green: 0, Blue: 0}       // Black
	headerBgColor = &props.Color{Red: 230, Green: 230, Blue: 230} // Light gray
	lineColor     = &props.Color{Red: 128, Green: 128, Blue: 128} // Medium gray
	totalBgColor  = &props.Color{Red: 200, Green: 200, Blue: 200} // Gray
	darkGray      = &props.Color{Red: 80, Green: 80, Blue: 80}    // Dark gray
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

	// Separator line
	s.addSeparatorLine(m)

	// Add spacing
	m.AddRow(8)

	// Items table with borders
	s.addItemsTable(m, invoice)

	// Add spacing
	m.AddRow(10)

	// Totals section
	s.addTotals(m, invoice)

	// Separator line
	s.addSeparatorLine(m)

	// Add spacing
	m.AddRow(6)

	// Legal text (Total in words)
	s.addLegalText(m, invoice)

	// Add spacing
	m.AddRow(6)

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

	// Create safe filename
	safeName := fmt.Sprintf("Facture_%04d_%d.pdf", invoice.ID, invoice.ID)
	pdfPath := filepath.Join(pdfDir, safeName)

	if err := doc.Save(pdfPath); err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}

	return pdfPath, nil
}

func (s *Service) addSeparatorLine(m core.Maroto) {
	m.AddRow(3,
		col.New(12).Add(
			line.New(props.Line{
				Color:     lineColor,
				Thickness: 0.5,
			}),
		),
	)
}

func (s *Service) addHeader(m core.Maroto, invoice *InvoiceResponse) {
	// Determine which ID to show
	displayID := invoice.FormattedID
	if invoice.CustomFormattedID != "" {
		displayID = invoice.CustomFormattedID
	}

	// Invoice number with blue color
	m.AddRow(10,
		col.New(6).Add(
			text.New("FACTURE N°: "+displayID, props.Text{
				Size:  14,
				Style: fontstyle.Bold,
				Color: primaryColor,
			}),
		),
		col.New(6).Add(
			text.New("Client: "+invoice.ClientName, props.Text{
				Size:  12,
				Style: fontstyle.Bold,
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
				Color: darkGray,
			}),
		),
	)
}

func (s *Service) addItemsTable(m core.Maroto, invoice *InvoiceResponse) {
	// Table header with background
	headerProps := props.Text{
		Size:  10,
		Style: fontstyle.Bold,
		Align: align.Center,
		Color: primaryColor,
	}

	// Header row with background color
	m.AddRow(9,
		col.New(5).Add(text.New("DESCRIPTION", headerProps)),
		col.New(2).Add(text.New("QTÉ", headerProps)),
		col.New(3).Add(text.New("PRIX UNIT. TTC", headerProps)),
		col.New(2).Add(text.New("TOTAL TTC", headerProps)),
	).WithStyle(&props.Cell{
		BackgroundColor: headerBgColor,
	})

	// Header bottom line
	m.AddRow(1,
		col.New(12).Add(
			line.New(props.Line{
				Color:     primaryColor,
				Thickness: 1.0,
			}),
		),
	)

	// Table rows
	cellProps := props.Text{
		Size:  9,
		Align: align.Center,
	}

	for i, item := range invoice.Items {
		// Alternate row background
		var rowStyle *props.Cell
		if i%2 == 1 {
			rowStyle = &props.Cell{
				BackgroundColor: &props.Color{Red: 250, Green: 250, Blue: 250},
			}
		}

		m.AddRow(8,
			col.New(5).Add(text.New(item.Description, props.Text{
				Size: 9,
			})),
			col.New(2).Add(text.New(fmt.Sprintf("%.0f", item.Quantity), cellProps)),
			col.New(3).Add(text.New(fmt.Sprintf("%.2f DH", item.PrixUnitTTC), cellProps)),
			col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", item.TotalTTC), props.Text{
				Size:  9,
				Align: align.Right,
				Style: fontstyle.Bold,
			})),
		).WithStyle(rowStyle)

		// Row separator line
		m.AddRow(1,
			col.New(12).Add(
				line.New(props.Line{
					Color:     &props.Color{Red: 220, Green: 220, Blue: 220},
					Thickness: 0.3,
				}),
			),
		)
	}

	// Table bottom line
	m.AddRow(1,
		col.New(12).Add(
			line.New(props.Line{
				Color:     lineColor,
				Thickness: 0.8,
			}),
		),
	)
}

func (s *Service) addTotals(m core.Maroto, invoice *InvoiceResponse) {
	labelProps := props.Text{
		Size:  10,
		Align: align.Right,
	}

	valueProps := props.Text{
		Size:  10,
		Align: align.Right,
		Style: fontstyle.Bold,
	}

	// Total HT
	m.AddRow(7,
		col.New(8),
		col.New(2).Add(text.New("Total HT:", labelProps)),
		col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", invoice.TotalHT), valueProps)),
	)

	// TVA
	m.AddRow(7,
		col.New(8),
		col.New(2).Add(text.New("TVA 20%:", labelProps)),
		col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", invoice.TotalTVA), props.Text{
			Size:  10,
			Align: align.Right,
			Color: darkGray,
		})),
	)

	// Line before total
	m.AddRow(2,
		col.New(8),
		col.New(4).Add(
			line.New(props.Line{
				Color:     primaryColor,
				Thickness: 1.0,
			}),
		),
	)

	// Total TTC with highlight
	m.AddRow(10,
		col.New(8),
		col.New(2).Add(text.New("TOTAL TTC:", props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Align: align.Right,
			Color: primaryColor,
		})),
		col.New(2).Add(text.New(fmt.Sprintf("%.2f DH", invoice.TotalTTC), props.Text{
			Size:  12,
			Style: fontstyle.Bold,
			Align: align.Right,
			Color: primaryColor,
		})),
	)
}

func (s *Service) addLegalText(m core.Maroto, invoice *InvoiceResponse) {
	m.AddRow(12,
		col.New(12).Add(
			text.New(invoice.TotalInWords, props.Text{
				Size:  9,
				Style: fontstyle.BoldItalic,
				Color: darkGray,
			}),
		),
	)
}

func (s *Service) addPaymentDetails(m core.Maroto, invoice *InvoiceResponse) {
	rowStyle := &props.Cell{
		BackgroundColor: &props.Color{Red: 245, Green: 245, Blue: 245},
	}
	labelProps := props.Text{
		Size:  9,
		Style: fontstyle.Bold,
		Color: darkGray,
	}
	valueProps := props.Text{
		Size:  9,
		Color: primaryColor,
	}

	switch invoice.PaymentMethod {
	case "ESPECE":
		m.AddRow(8,
			col.New(3).Add(text.New("Mode de paiement:", labelProps)),
			col.New(9).Add(text.New("Espèce", valueProps)),
		).WithStyle(rowStyle)

	case "CHEQUE":
		if invoice.ChequeInfo != nil {
			// Row 1: Payment type
			m.AddRow(7,
				col.New(3).Add(text.New("Mode de paiement:", labelProps)),
				col.New(9).Add(text.New("Chèque", valueProps)),
			).WithStyle(rowStyle)

			// Row 2: Cheque number
			m.AddRow(7,
				col.New(3).Add(text.New("N° Chèque:", labelProps)),
				col.New(9).Add(text.New(invoice.ChequeInfo.Number, valueProps)),
			).WithStyle(rowStyle)

			// Row 3: Bank
			m.AddRow(7,
				col.New(3).Add(text.New("Banque:", labelProps)),
				col.New(9).Add(text.New(invoice.ChequeInfo.Bank, valueProps)),
			).WithStyle(rowStyle)

			// Row 4: City
			if invoice.ChequeInfo.City != "" {
				m.AddRow(7,
					col.New(3).Add(text.New("Ville:", labelProps)),
					col.New(9).Add(text.New(invoice.ChequeInfo.City, valueProps)),
				).WithStyle(rowStyle)
			}

			// Row 5: Reference
			if invoice.ChequeInfo.Reference != "" {
				m.AddRow(7,
					col.New(3).Add(text.New("Référence:", labelProps)),
					col.New(9).Add(text.New(invoice.ChequeInfo.Reference, valueProps)),
				).WithStyle(rowStyle)
			}
		}

	case "EFFET":
		if invoice.EffetInfo != nil {
			// Row 1: Payment type
			m.AddRow(7,
				col.New(3).Add(text.New("Mode de paiement:", labelProps)),
				col.New(9).Add(text.New("Effet", valueProps)),
			).WithStyle(rowStyle)

			// Row 2: City
			m.AddRow(7,
				col.New(3).Add(text.New("Ville:", labelProps)),
				col.New(9).Add(text.New(invoice.EffetInfo.City, valueProps)),
			).WithStyle(rowStyle)

			// Row 3: Due date
			m.AddRow(7,
				col.New(3).Add(text.New("Échéance:", labelProps)),
				col.New(9).Add(text.New(invoice.EffetInfo.DateEcheance, valueProps)),
			).WithStyle(rowStyle)
		}
	}
}

func (s *Service) addFooter(m core.Maroto) {
	// Separator line
	s.addSeparatorLine(m)

	m.AddRow(10,
		col.New(12).Add(
			text.New("ICE Société: "+CompanyICE, props.Text{
				Size:  11,
				Style: fontstyle.Bold,
				Align: align.Center,
				Color: primaryColor,
			}),
		),
	)
}
