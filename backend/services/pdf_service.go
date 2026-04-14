package services

import (
	"fmt"
	"os"
	"path/filepath"

	"invoice-app/config"
	"invoice-app/models"

	"github.com/go-pdf/fpdf"
)

// peach RGB
const (
	peachR = 245
	peachG = 198
	peachB = 160
)

// dejaVuDir is the directory containing DejaVuSans TTF files
const dejaVuDir = "/usr/share/fonts/truetype/dejavu"

func newPDF() *fpdf.Fpdf {
	// Pass font directory to fpdf so font names are resolved relative to it
	fontDir := ""
	if _, err := os.Stat(dejaVuDir + "/DejaVuSans.ttf"); err == nil {
		fontDir = dejaVuDir
	}

	pdf := fpdf.New("P", "mm", "A4", fontDir)

	if fontDir != "" {
		pdf.AddUTF8Font("DejaVu", "", "DejaVuSans.ttf")
		pdf.AddUTF8Font("DejaVu", "B", "DejaVuSans-Bold.ttf")
	}

	return pdf
}

var dejaVuAvailable = func() bool {
	_, err := os.Stat(dejaVuDir + "/DejaVuSans.ttf")
	return err == nil
}()

func fontName() string {
	if dejaVuAvailable {
		return "DejaVu"
	}
	return "Helvetica"
}

// inr returns the rupee symbol when using a Unicode font, else "Rs."
func inr() string {
	if dejaVuAvailable {
		return "\u20b9"
	}
	return "Rs."
}

func GenerateInvoicePDF(inv *models.Invoice) (string, error) {
	pdf := newPDF()
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()
	pdf.SetAutoPageBreak(true, 15)

	pageW, _ := pdf.GetPageSize()
	contentW := pageW - 30

	fn := fontName()

	// ── Header ───────────────────────────────────────────────────────────────
	pdf.SetFont(fn, "B", 12)
	pdf.CellFormat(contentW/2, 7, inv.Business.Name, "", 0, "L", false, 0, "")
	pdf.SetFont(fn, "B", 28)
	pdf.CellFormat(contentW/2, 12, "Bill", "", 1, "R", false, 0, "")

	pdf.SetFont(fn, "", 10)
	pdf.CellFormat(contentW, 5, inv.Business.Phone, "", 1, "L", false, 0, "")
	pdf.CellFormat(contentW, 5, inv.Business.Email, "", 1, "L", false, 0, "")
	pdf.Ln(4)

	// ── Due Balance Banner ────────────────────────────────────────────────────
	pdf.SetFillColor(peachR, peachG, peachB)
	pdf.SetFont(fn, "B", 12)
	dueText := fmt.Sprintf("Due Balance  %s %s", inr(), formatAmount(inv.Due))
	dateText := fmt.Sprintf("Date: %s", inv.Date.Format("Jan 02, 2006"))
	pdf.CellFormat(contentW/2, 10, dueText, "", 0, "L", true, 0, "")
	pdf.CellFormat(contentW/2, 10, dateText, "", 1, "R", true, 0, "")
	pdf.Ln(5)

	// ── Bill To ───────────────────────────────────────────────────────────────
	pdf.SetFillColor(255, 255, 255)
	pdf.SetFont(fn, "B", 11)
	pdf.CellFormat(contentW, 6, "Bill to", "", 1, "L", false, 0, "")
	pdf.SetDrawColor(peachR, peachG, peachB)
	pdf.SetLineWidth(0.5)
	x, y := pdf.GetXY()
	pdf.Line(x, y, x+contentW, y)
	pdf.Ln(2)
	pdf.SetFont(fn, "", 11)
	pdf.CellFormat(contentW, 6, inv.BillTo.Name, "", 1, "L", false, 0, "")
	if inv.BillTo.Phone != "" {
		pdf.CellFormat(contentW, 5, inv.BillTo.Phone, "", 1, "L", false, 0, "")
	}
	if inv.BillTo.Address != "" {
		pdf.CellFormat(contentW, 5, inv.BillTo.Address, "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// ── Items Table ───────────────────────────────────────────────────────────
	colDesc := contentW * 0.45
	colRate := contentW * 0.20
	colQty := contentW * 0.10
	colAmt := contentW * 0.25

	pdf.SetFillColor(peachR, peachG, peachB)
	pdf.SetFont(fn, "B", 10)
	pdf.SetDrawColor(200, 150, 100)
	pdf.CellFormat(colDesc, 8, "Description", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colRate, 8, "Rate", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colQty, 8, "Quantity", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colAmt, 8, "Amount(INR)", "1", 1, "C", true, 0, "")

	pdf.SetFont(fn, "", 9)
	pdf.SetFillColor(255, 255, 255)
	pdf.SetDrawColor(220, 180, 140)

	for _, item := range inv.Items {
		rateStr := "-"
		if item.Rate != nil && *item.Rate > 0 {
			rateStr = fmt.Sprintf("%.0f %s", *item.Rate, item.RateUnit)
		}
		qtyStr := "-"
		if item.Quantity != nil && *item.Quantity > 0 {
			qtyStr = fmt.Sprintf("%.0f", *item.Quantity)
		}
		amtStr := fmt.Sprintf("%s %s", inr(), formatAmount(item.Amount))
		descLine := "* " + item.Description

		startY := pdf.GetY()
		startX := pdf.GetX()

		pdf.MultiCell(colDesc, 5, descLine, "LR", "L", false)
		endY := pdf.GetY()
		actualH := endY - startY

		pdf.SetXY(startX+colDesc, startY)
		pdf.CellFormat(colRate, actualH, rateStr, "LR", 0, "C", false, 0, "")
		pdf.CellFormat(colQty, actualH, qtyStr, "LR", 0, "C", false, 0, "")
		pdf.CellFormat(colAmt, actualH, amtStr, "LR", 0, "R", false, 0, "")
		pdf.Ln(0)
		pdf.SetX(startX)
		pdf.SetY(endY)
		pdf.SetX(startX)
		pdf.CellFormat(contentW, 0, "", "T", 1, "", false, 0, "")
	}

	pdf.Ln(2)

	// ── Footer Totals ─────────────────────────────────────────────────────────
	footerLabelW := contentW * 0.75
	footerAmtW := contentW * 0.25

	totalRow := func(label string, amount float64, fill bool) {
		if fill {
			pdf.SetFillColor(peachR, peachG, peachB)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.SetFont(fn, "B", 10)
		pdf.CellFormat(footerLabelW, 8, label, "1", 0, "R", false, 0, "")
		pdf.CellFormat(footerAmtW, 8, fmt.Sprintf("%s %s", inr(), formatAmount(amount)), "1", 1, "R", fill, 0, "")
	}

	totalRow("Total", inv.Total, false)
	totalRow("Paid", inv.Paid, false)
	totalRow("Due", inv.Due, true)

	// ── Save to disk ──────────────────────────────────────────────────────────
	storagePath := config.App.PDFStoragePath
	if err := os.MkdirAll(storagePath, 0755); err != nil {
		return "", fmt.Errorf("create pdf dir: %w", err)
	}

	filename := fmt.Sprintf("%s.pdf", inv.InvoiceNumber)
	fullPath := filepath.Join(storagePath, filename)

	if err := pdf.OutputFileAndClose(fullPath); err != nil {
		return "", fmt.Errorf("write pdf: %w", err)
	}

	return fullPath, nil
}

func formatAmount(v float64) string {
	if v == float64(int64(v)) {
		return fmt.Sprintf("%d", int64(v))
	}
	return fmt.Sprintf("%.2f", v)
}
