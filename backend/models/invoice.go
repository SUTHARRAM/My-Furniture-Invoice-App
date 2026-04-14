package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type InvoiceStatus string

const (
	StatusDraft         InvoiceStatus = "draft"
	StatusSent          InvoiceStatus = "sent"
	StatusPaid          InvoiceStatus = "paid"
	StatusPartiallyPaid InvoiceStatus = "partially_paid"
	StatusOverdue       InvoiceStatus = "overdue"
)

type BusinessInfo struct {
	Name  string `bson:"name" json:"name"`
	Phone string `bson:"phone" json:"phone"`
	Email string `bson:"email" json:"email"`
}

type BillTo struct {
	Name    string `bson:"name" json:"name"`
	Phone   string `bson:"phone,omitempty" json:"phone,omitempty"`
	Address string `bson:"address,omitempty" json:"address,omitempty"`
}

type Dimensions struct {
	Length *float64 `bson:"length,omitempty" json:"length,omitempty"`
	Width  *float64 `bson:"width,omitempty" json:"width,omitempty"`
}

type InvoiceItem struct {
	Description string      `bson:"description" json:"description"`
	Rate        *float64    `bson:"rate,omitempty" json:"rate,omitempty"`
	RateUnit    string      `bson:"rate_unit,omitempty" json:"rate_unit,omitempty"`
	Quantity    *float64    `bson:"quantity,omitempty" json:"quantity,omitempty"`
	Dimensions  *Dimensions `bson:"dimensions,omitempty" json:"dimensions,omitempty"`
	Formula     string      `bson:"formula,omitempty" json:"formula,omitempty"`
	Amount      float64     `bson:"amount" json:"amount"`
}

type Invoice struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	InvoiceNumber string             `bson:"invoice_number" json:"invoice_number"`
	CreatedBy     primitive.ObjectID `bson:"created_by" json:"created_by"`
	Business      BusinessInfo       `bson:"business" json:"business"`
	BillTo        BillTo             `bson:"bill_to" json:"bill_to"`
	Date          time.Time          `bson:"date" json:"date"`
	DueDate       *time.Time         `bson:"due_date,omitempty" json:"due_date,omitempty"`
	Items         []InvoiceItem      `bson:"items" json:"items"`
	Total         float64            `bson:"total" json:"total"`
	Paid          float64            `bson:"paid" json:"paid"`
	Due           float64            `bson:"due" json:"due"`
	Status        InvoiceStatus      `bson:"status" json:"status"`
	PDFPath       string             `bson:"pdf_path,omitempty" json:"pdf_path,omitempty"`
	PDFGeneratedAt *time.Time        `bson:"pdf_generated_at,omitempty" json:"pdf_generated_at,omitempty"`
	Notes         string             `bson:"notes,omitempty" json:"notes,omitempty"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateInvoiceRequest struct {
	Business BusinessInfo  `json:"business"`
	BillTo   BillTo        `json:"bill_to" binding:"required"`
	Date     time.Time     `json:"date" binding:"required"`
	DueDate  *time.Time    `json:"due_date,omitempty"`
	Items    []InvoiceItem `json:"items" binding:"required,min=1"`
	Paid     float64       `json:"paid"`
	Notes    string        `json:"notes,omitempty"`
}

type UpdateInvoiceRequest struct {
	Business BusinessInfo  `json:"business"`
	BillTo   BillTo        `json:"bill_to"`
	Date     time.Time     `json:"date"`
	DueDate  *time.Time    `json:"due_date,omitempty"`
	Items    []InvoiceItem `json:"items"`
	Paid     float64       `json:"paid"`
	Status   InvoiceStatus `json:"status,omitempty"`
	Notes    string        `json:"notes,omitempty"`
}

type UpdatePaymentRequest struct {
	Paid float64 `json:"paid" binding:"required,min=0"`
}

type InvoiceStats struct {
	TotalInvoices   int64   `json:"total_invoices"`
	TotalAmount     float64 `json:"total_amount"`
	TotalPaid       float64 `json:"total_paid"`
	TotalDue        float64 `json:"total_due"`
	DraftCount      int64   `json:"draft_count"`
	PaidCount       int64   `json:"paid_count"`
	PartialCount    int64   `json:"partial_count"`
	OverdueCount    int64   `json:"overdue_count"`
}
