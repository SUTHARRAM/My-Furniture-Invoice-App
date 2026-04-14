package repository

import (
	"context"
	"time"

	"invoice-app/config"
	"invoice-app/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func tokenColl() *mongo.Collection {
	return config.GetCollection("refresh_tokens")
}

func SaveRefreshToken(rt *models.RefreshToken) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	rt.ID = primitive.NewObjectID()
	rt.CreatedAt = time.Now()
	_, err := tokenColl().InsertOne(ctx, rt)
	return err
}

func FindRefreshToken(tokenHash string) (*models.RefreshToken, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var rt models.RefreshToken
	err := tokenColl().FindOne(ctx, bson.M{"token_hash": tokenHash, "revoked": false}).Decode(&rt)
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func RevokeRefreshToken(tokenHash string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := tokenColl().UpdateOne(ctx,
		bson.M{"token_hash": tokenHash},
		bson.M{"$set": bson.M{"revoked": true}},
	)
	return err
}

func RevokeAllUserTokens(userID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := tokenColl().UpdateMany(ctx,
		bson.M{"user_id": userID, "revoked": false},
		bson.M{"$set": bson.M{"revoked": true}},
	)
	return err
}

func EnsureTokenIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := tokenColl().Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "token_hash", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "revoked", Value: 1}}},
		{
			Keys:    bson.D{{Key: "expires_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(0),
		},
	})
	return err
}
