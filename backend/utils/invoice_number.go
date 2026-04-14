package utils

import (
	"context"
	"fmt"
	"time"

	"invoice-app/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GenerateInvoiceNumber() (string, error) {
	year := time.Now().Year()
	counterID := fmt.Sprintf("invoice_seq_%d", year)

	coll := config.GetCollection("counters")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	filter := bson.M{"_id": counterID}
	update := bson.M{"$inc": bson.M{"seq": 1}}

	var result struct {
		Seq int `bson:"seq"`
	}
	if err := coll.FindOneAndUpdate(ctx, filter, update, opts).Decode(&result); err != nil {
		return "", err
	}

	return fmt.Sprintf("INV-%d-%04d", year, result.Seq), nil
}
