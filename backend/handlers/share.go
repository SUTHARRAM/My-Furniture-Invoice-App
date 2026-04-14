package handlers

import (
	"invoice-app/repository"
	"invoice-app/services"
	"invoice-app/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func ShareEmail(c *gin.Context) {
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
			utils.InternalError(c, "fetch failed")
		}
		return
	}

	var req services.EmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Ensure PDF exists
	if inv.PDFPath == "" {
		pdfPath, err := services.GenerateInvoicePDF(inv)
		if err != nil {
			utils.InternalError(c, "failed to generate PDF for email")
			return
		}
		inv.PDFPath = pdfPath
	}

	if err := services.SendInvoiceEmail(inv, req, inv.PDFPath); err != nil {
		utils.InternalError(c, "failed to send email: "+err.Error())
		return
	}

	utils.OKMessage(c, "email sent successfully")
}

func ShareWhatsApp(c *gin.Context) {
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

	var req services.WhatsAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := services.SendWhatsAppMessage(inv, req.Phone); err != nil {
		utils.InternalError(c, "failed to send WhatsApp message: "+err.Error())
		return
	}

	utils.OKMessage(c, "WhatsApp message sent")
}
