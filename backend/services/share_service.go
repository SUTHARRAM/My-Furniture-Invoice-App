package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"invoice-app/config"
	"invoice-app/models"

	gomail "gopkg.in/gomail.v2"
)

type EmailRequest struct {
	To      string `json:"to" binding:"required,email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

type WhatsAppRequest struct {
	Phone string `json:"phone" binding:"required"`
}

func SendInvoiceEmail(inv *models.Invoice, req EmailRequest, pdfPath string) error {
	cfg := config.App

	subject := req.Subject
	if subject == "" {
		subject = fmt.Sprintf("Invoice %s from %s", inv.InvoiceNumber, inv.Business.Name)
	}
	body := req.Message
	if body == "" {
		body = fmt.Sprintf("Please find attached invoice %s for \u20b9 %s.\n\nTotal: \u20b9%.2f\nPaid: \u20b9%.2f\nDue: \u20b9%.2f",
			inv.InvoiceNumber, inv.BillTo.Name, inv.Total, inv.Paid, inv.Due)
	}

	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", cfg.SMTPFromName, cfg.SMTPUser))
	m.SetHeader("To", req.To)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)
	if pdfPath != "" {
		m.Attach(pdfPath)
	}

	d := gomail.NewDialer(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword)
	return d.DialAndSend(m)
}

func SendWhatsAppMessage(inv *models.Invoice, phone string) error {
	cfg := config.App

	if cfg.TwilioAccountSID != "" {
		return sendViaTwilio(inv, phone)
	}
	if cfg.WATIAPIToken != "" {
		return sendViaWATI(inv, phone)
	}
	return fmt.Errorf("no WhatsApp provider configured")
}

func sendViaTwilio(inv *models.Invoice, phone string) error {
	cfg := config.App
	message := fmt.Sprintf("Invoice %s - Bill to: %s\nTotal: \u20b9%.2f | Paid: \u20b9%.2f | Due: \u20b9%.2f",
		inv.InvoiceNumber, inv.BillTo.Name, inv.Total, inv.Paid, inv.Due)

	body := fmt.Sprintf("To=whatsapp%%3A%s&From=%s&Body=%s",
		phone, cfg.TwilioWhatsAppFrom, message)
	url := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", cfg.TwilioAccountSID)

	req, err := http.NewRequest("POST", url, bytes.NewBufferString(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(cfg.TwilioAccountSID, cfg.TwilioAuthToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("twilio error: %d", resp.StatusCode)
	}
	return nil
}

func sendViaWATI(inv *models.Invoice, phone string) error {
	cfg := config.App
	message := fmt.Sprintf("Invoice %s\nBill to: %s\nTotal: \u20b9%.2f | Due: \u20b9%.2f",
		inv.InvoiceNumber, inv.BillTo.Name, inv.Total, inv.Due)

	payload := map[string]string{
		"template_name": "invoice_notification",
		"broadcast_name": inv.InvoiceNumber,
		"parameters": message,
	}
	data, _ := json.Marshal(payload)

	url := fmt.Sprintf("%s/api/v1/sendTemplateMessage?whatsappNumber=%s", cfg.WATIAPIEndpoint, phone)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.WATIAPIToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("WATI error: %d", resp.StatusCode)
	}
	return nil
}
