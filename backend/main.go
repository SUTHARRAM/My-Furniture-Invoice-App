package main

import (
	"log"

	"invoice-app/config"
	"invoice-app/repository"
	"invoice-app/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load config
	config.Load()

	// Connect to MongoDB
	config.ConnectDB()

	// Ensure indexes
	if err := repository.EnsureUserIndexes(); err != nil {
		log.Println("Warning: user indexes:", err)
	}
	if err := repository.EnsureTokenIndexes(); err != nil {
		log.Println("Warning: token indexes:", err)
	}
	if err := repository.EnsureInvoiceIndexes(); err != nil {
		log.Println("Warning: invoice indexes:", err)
	}

	// Setup Gin
	gin.SetMode(config.App.GinMode)
	r := gin.Default()

	// Register routes
	routes.Setup(r)

	log.Printf("Server starting on :%s\n", config.App.Port)
	if err := r.Run(":" + config.App.Port); err != nil {
		log.Fatal("Server error:", err)
	}
}
