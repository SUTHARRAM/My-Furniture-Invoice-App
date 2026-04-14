package handlers

import (
	"invoice-app/models"
	"invoice-app/repository"
	"invoice-app/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func ListUsers(c *gin.Context) {
	users, err := repository.ListUsers()
	if err != nil {
		utils.InternalError(c, "failed to fetch users")
		return
	}
	utils.OK(c, users)
}

func UpdateUser(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid user id")
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	update := bson.M{}
	if req.Role != nil {
		update["role"] = *req.Role
	}
	if req.IsActive != nil {
		update["is_active"] = *req.IsActive
	}

	if len(update) == 0 {
		utils.BadRequest(c, "no fields to update")
		return
	}

	if err := repository.UpdateUser(id, update); err != nil {
		utils.InternalError(c, "failed to update user")
		return
	}
	utils.OKMessage(c, "user updated")
}

func DeleteUser(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "invalid user id")
		return
	}
	if err := repository.DeleteUser(id); err != nil {
		utils.InternalError(c, "failed to delete user")
		return
	}
	utils.OKMessage(c, "user deleted")
}
