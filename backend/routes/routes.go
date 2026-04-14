package routes

import (
	"net/http"

	"invoice-app/config"
	"invoice-app/handlers"
	"invoice-app/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine) {
	r.Use(middleware.CORS())

	// Health
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "db": config.DB.Name()})
	})

	v1 := r.Group("/api/v1")

	// Auth (rate-limited)
	auth := v1.Group("/auth")
	auth.Use(middleware.RateLimit())
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/refresh", handlers.RefreshToken)
		auth.POST("/logout", middleware.AuthRequired(), handlers.Logout)
		auth.GET("/me", middleware.AuthRequired(), handlers.Me)
	}

	// Users (admin only)
	users := v1.Group("/users")
	users.Use(middleware.AuthRequired(), middleware.AdminOnly())
	{
		users.GET("", handlers.ListUsers)
		users.PATCH("/:id", handlers.UpdateUser)
		users.DELETE("/:id", handlers.DeleteUser)
	}

	// Invoices
	invoices := v1.Group("/invoices")
	invoices.Use(middleware.AuthRequired())
	{
		invoices.GET("", handlers.ListInvoices)
		invoices.POST("", handlers.CreateInvoice)
		invoices.GET("/stats", handlers.GetStats)
		invoices.GET("/:id", handlers.GetInvoice)
		invoices.PUT("/:id", handlers.UpdateInvoice)
		invoices.PATCH("/:id/payment", handlers.UpdatePayment)
		invoices.DELETE("/:id", handlers.DeleteInvoice)

		// PDF
		invoices.POST("/:id/pdf/generate", handlers.GeneratePDF)
		invoices.GET("/:id/pdf/download", handlers.DownloadPDF)

		// Share
		invoices.POST("/:id/share/email", handlers.ShareEmail)
		invoices.POST("/:id/share/whatsapp", handlers.ShareWhatsApp)
	}
}
