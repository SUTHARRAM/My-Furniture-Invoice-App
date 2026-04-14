package services

import (
	"invoice-app/config"
	"invoice-app/models"
)

// ComputeTotals recalculates total, due and status from items and paid amount.
func ComputeTotals(req *models.CreateInvoiceRequest) (total, due float64, status models.InvoiceStatus) {
	for _, item := range req.Items {
		total += item.Amount
	}
	due = total - req.Paid
	status = deriveStatus(total, req.Paid)
	return
}

func ComputeTotalsFromUpdate(req *models.UpdateInvoiceRequest) (total, due float64, status models.InvoiceStatus) {
	for _, item := range req.Items {
		total += item.Amount
	}
	due = total - req.Paid
	if req.Status != "" {
		status = req.Status
	} else {
		status = deriveStatus(total, req.Paid)
	}
	return
}

func deriveStatus(total, paid float64) models.InvoiceStatus {
	if paid <= 0 {
		return models.StatusDraft
	}
	if paid >= total {
		return models.StatusPaid
	}
	return models.StatusPartiallyPaid
}

// DefaultBusinessInfo fills missing business info from app config.
func DefaultBusinessInfo(b models.BusinessInfo) models.BusinessInfo {
	if b.Name == "" {
		b.Name = config.App.BusinessName
	}
	if b.Phone == "" {
		b.Phone = config.App.BusinessPhone
	}
	if b.Email == "" {
		b.Email = config.App.BusinessEmail
	}
	return b
}
