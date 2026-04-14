package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	GinMode            string
	MongoURI           string
	MongoDBName        string
	JWTSecret          string
	JWTAccessExpiry    time.Duration
	JWTRefreshExpiry   time.Duration
	PDFStoragePath     string
	BusinessName       string
	BusinessPhone      string
	BusinessEmail      string
	SMTPHost           string
	SMTPPort           int
	SMTPUser           string
	SMTPPassword       string
	SMTPFromName       string
	TwilioAccountSID   string
	TwilioAuthToken    string
	TwilioWhatsAppFrom string
	WATIAPIEndpoint    string
	WATIAPIToken       string
	AllowedOrigins     string
}

var App *Config

func Load() {
	_ = godotenv.Load()

	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	accessExpiry, err := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		log.Fatal("Invalid JWT_ACCESS_EXPIRY:", err)
	}
	refreshExpiry, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		log.Fatal("Invalid JWT_REFRESH_EXPIRY:", err)
	}

	App = &Config{
		Port:               getEnv("PORT", "8080"),
		GinMode:            getEnv("GIN_MODE", "debug"),
		MongoURI:           getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDBName:        getEnv("MONGO_DB_NAME", "invoice_app"),
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
		JWTAccessExpiry:    accessExpiry,
		JWTRefreshExpiry:   refreshExpiry,
		PDFStoragePath:     getEnv("PDF_STORAGE_PATH", "./storage/pdfs"),
		BusinessName:       getEnv("BUSINESS_NAME", "Carp. Ramesh Kumar Suthar"),
		BusinessPhone:      getEnv("BUSINESS_PHONE", "9660600709"),
		BusinessEmail:      getEnv("BUSINESS_EMAIL", "rc42847@gmail.com"),
		SMTPHost:           getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:           smtpPort,
		SMTPUser:           getEnv("SMTP_USER", ""),
		SMTPPassword:       getEnv("SMTP_PASSWORD", ""),
		SMTPFromName:       getEnv("SMTP_FROM_NAME", "Invoice App"),
		TwilioAccountSID:   getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioAuthToken:    getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioWhatsAppFrom: getEnv("TWILIO_WHATSAPP_FROM", ""),
		WATIAPIEndpoint:    getEnv("WATI_API_ENDPOINT", ""),
		WATIAPIToken:       getEnv("WATI_API_TOKEN", ""),
		AllowedOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
	}
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
