package handlers

import (
	"time"

	"invoice-app/config"
	"invoice-app/middleware"
	"invoice-app/models"
	"invoice-app/repository"
	"invoice-app/services"
	"invoice-app/utils"

	"github.com/gin-gonic/gin"
)

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Check duplicate
	if _, err := repository.FindUserByEmail(req.Email); err == nil {
		utils.Conflict(c, "email already registered")
		return
	}

	hash, err := services.HashPassword(req.Password)
	if err != nil {
		utils.InternalError(c, "failed to hash password")
		return
	}

	user := &models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         models.RoleUser,
		IsActive:     true,
	}

	if err := repository.CreateUser(user); err != nil {
		utils.InternalError(c, "failed to create user")
		return
	}

	utils.Created(c, gin.H{"message": "registered successfully", "user_id": user.ID})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := repository.FindUserByEmail(req.Email)
	if err != nil || !services.CheckPassword(req.Password, user.PasswordHash) {
		utils.Unauthorized(c, "invalid email or password")
		return
	}

	if !user.IsActive {
		utils.Unauthorized(c, "account is deactivated")
		return
	}

	accessToken, err := services.GenerateAccessToken(user)
	if err != nil {
		utils.InternalError(c, "failed to generate token")
		return
	}

	rawRefresh, hashedRefresh, err := services.GenerateRefreshToken()
	if err != nil {
		utils.InternalError(c, "failed to generate refresh token")
		return
	}

	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: hashedRefresh,
		ExpiresAt: time.Now().Add(config.App.JWTRefreshExpiry),
		Revoked:   false,
	}
	if err := repository.SaveRefreshToken(rt); err != nil {
		utils.InternalError(c, "failed to save refresh token")
		return
	}

	// Set refresh token as httpOnly cookie
	c.SetCookie("refresh_token", rawRefresh, int(config.App.JWTRefreshExpiry.Seconds()), "/", "", false, true)

	utils.OK(c, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func RefreshToken(c *gin.Context) {
	rawToken, err := c.Cookie("refresh_token")
	if err != nil || rawToken == "" {
		utils.Unauthorized(c, "refresh token missing")
		return
	}

	hashed := services.HashToken(rawToken)
	rt, err := repository.FindRefreshToken(hashed)
	if err != nil {
		utils.Unauthorized(c, "invalid or expired refresh token")
		return
	}

	if time.Now().After(rt.ExpiresAt) {
		utils.Unauthorized(c, "refresh token expired")
		return
	}

	// Rotate: revoke old
	_ = repository.RevokeRefreshToken(hashed)

	user, err := repository.FindUserByID(rt.UserID)
	if err != nil {
		utils.Unauthorized(c, "user not found")
		return
	}

	accessToken, _ := services.GenerateAccessToken(user)
	newRaw, newHashed, _ := services.GenerateRefreshToken()

	newRT := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: newHashed,
		ExpiresAt: time.Now().Add(config.App.JWTRefreshExpiry),
		Revoked:   false,
	}
	_ = repository.SaveRefreshToken(newRT)

	c.SetCookie("refresh_token", newRaw, int(config.App.JWTRefreshExpiry.Seconds()), "/", "", false, true)
	utils.OK(c, gin.H{"access_token": accessToken})
}

func Logout(c *gin.Context) {
	rawToken, err := c.Cookie("refresh_token")
	if err == nil && rawToken != "" {
		hashed := services.HashToken(rawToken)
		_ = repository.RevokeRefreshToken(hashed)
	}
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	utils.OKMessage(c, "logged out successfully")
}

func Me(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	// userID is already a hex string from JWT claims
	user, err := repository.FindUserByEmail(c.GetString(middleware.UserEmailKey))
	if err != nil {
		utils.NotFound(c, "user not found")
		return
	}
	_ = userID
	utils.OK(c, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"role":       user.Role,
		"is_active":  user.IsActive,
		"created_at": user.CreatedAt,
	})
}
