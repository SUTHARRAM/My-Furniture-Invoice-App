package handlers

import (
	"strconv"
	"time"

	"invoice-app/middleware"
	"invoice-app/models"
	"invoice-app/repository"
	"invoice-app/services"
	"invoice-app/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func CreateInvoice(c *gin.Context) {
	var req models.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	userIDStr := c.GetString(middleware.UserIDKey)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		utils.Unauthorized(c, "invalid user")
		return
	}

	invoiceNum, err := utils.GenerateInvoiceNumber()
	if err != nil {
		utils.InternalError(c, "failed to generate invoice number")
		return
	}

	total, due, status := services.ComputeTotals(&req)
	business := services.DefaultBusinessInfo(req.Business)

	inv := &models.Invoice{
		InvoiceNumber: invoiceNum,
		CreatedBy:     userID,
		Business:      business,
		BillTo:        req.BillTo,
		Date:          req.Date,
		DueDate:       req.DueDate,
		Items:         req.Items,
		Total:         total,
		Paid:          req.Paid,
		Due:           due,
		Status:        status,
		Notes:         req.Notes,
	}

	if err := repository.CreateInvoice(inv); err != nil {
		utils.InternalError(c, "failed to create invoice")
		return
	}
	utils.Created(c, inv)
}

func GetInvoice(c *gin.Context) {
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
	utils.OK(c, inv)
}

func ListInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 100 {
		limit = 100
	}
	if page < 1 {
		page = 1
	}

	filter := repository.InvoiceFilter{
		Q:      c.Query("q"),
		Status: c.Query("status"),
		Page:   page,
		Limit:  limit,
	}

	if fromStr := c.Query("from"); fromStr != "" {
		t, err := time.Parse("2006-01-02", fromStr)
		if err == nil {
			filter.From = &t
		}
	}
	if toStr := c.Query("to"); toStr != "" {
		t, err := time.Parse("2006-01-02", toStr)
		if err == nil {
			// end of day
			t = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			filter.To = &t
		}
	}

	invoices, total, err := repository.ListInvoices(filter)
	if err != nil {
		utils.InternalError(c, "failed to list invoices")
		return
	}
	utils.Paginated(c, invoices, total, page, limit)
}

func UpdateInvoice(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid invoice id")
		return
	}

	var req models.UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	total, due, status := services.ComputeTotalsFromUpdate(&req)
	business := services.DefaultBusinessInfo(req.Business)

	update := bson.M{
		"business": business,
		"bill_to":  req.BillTo,
		"date":     req.Date,
		"items":    req.Items,
		"total":    total,
		"paid":     req.Paid,
		"due":      due,
		"status":   status,
		"notes":    req.Notes,
		"pdf_path": "", // clear stale PDF
	}
	if req.DueDate != nil {
		update["due_date"] = req.DueDate
	}

	if err := repository.UpdateInvoice(id, update); err != nil {
		utils.InternalError(c, "failed to update invoice")
		return
	}

	inv, _ := repository.FindInvoiceByID(id)
	utils.OK(c, inv)
}

func UpdatePayment(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid invoice id")
		return
	}

	var req models.UpdatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	inv, err := repository.FindInvoiceByID(id)
	if err != nil {
		utils.NotFound(c, "invoice not found")
		return
	}

	due := inv.Total - req.Paid
	status := models.StatusPartiallyPaid
	if req.Paid >= inv.Total {
		status = models.StatusPaid
		due = 0
	} else if req.Paid <= 0 {
		status = models.StatusDraft
	}

	update := bson.M{"paid": req.Paid, "due": due, "status": status}
	if err := repository.UpdateInvoice(id, update); err != nil {
		utils.InternalError(c, "failed to update payment")
		return
	}
	utils.OKMessage(c, "payment updated")
}

func DeleteInvoice(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid invoice id")
		return
	}
	if err := repository.DeleteInvoice(id); err != nil {
		utils.InternalError(c, "failed to delete invoice")
		return
	}
	utils.OKMessage(c, "invoice deleted")
}

func GetStats(c *gin.Context) {
	stats, err := repository.GetInvoiceStats()
	if err != nil {
		utils.InternalError(c, "failed to get stats")
		return
	}
	utils.OK(c, stats)
}
