package handlers

import (
	"os"
	"time"

	"invoice-app/repository"
	"invoice-app/services"
	"invoice-app/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GeneratePDF(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid invoice id")
		return
	}

	inv, err := repository.FindInvoiceByID(id)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.NotFound(c, "invoice not found")
		} else {
			utils.InternalError(c, "failed to fetch invoice")
		}
		return
	}

	pdfPath, err := services.GenerateInvoicePDF(inv)
	if err != nil {
		utils.InternalError(c, "PDF generation failed: "+err.Error())
		return
	}

	now := time.Now()
	_ = repository.UpdateInvoice(id, bson.M{
		"pdf_path":         pdfPath,
		"pdf_generated_at": now,
	})

	utils.OK(c, gin.H{"pdf_path": pdfPath, "generated_at": now})
}

func DownloadPDF(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid invoice id")
		return
	}

	inv, err := repository.FindInvoiceByID(id)
	if err != nil {
		utils.NotFound(c, "invoice not found")
		return
	}

	// Auto-generate if missing or stale
	if inv.PDFPath == "" {
		pdfPath, err := services.GenerateInvoicePDF(inv)
		if err != nil {
			utils.InternalError(c, "PDF generation failed: "+err.Error())
			return
		}
		now := time.Now()
		_ = repository.UpdateInvoice(id, bson.M{
			"pdf_path":         pdfPath,
			"pdf_generated_at": now,
		})
		inv.PDFPath = pdfPath
	}

	// Verify file exists
	if _, err := os.Stat(inv.PDFPath); os.IsNotExist(err) {
		pdfPath, err := services.GenerateInvoicePDF(inv)
		if err != nil {
			utils.InternalError(c, "PDF generation failed: "+err.Error())
			return
		}
		inv.PDFPath = pdfPath
	}

	filename := inv.InvoiceNumber + ".pdf"
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/pdf")
	c.File(inv.PDFPath)
}
