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

func invoiceColl() *mongo.Collection {
	return config.GetCollection("invoices")
}

func CreateInvoice(inv *models.Invoice) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	inv.ID = primitive.NewObjectID()
	inv.CreatedAt = time.Now()
	inv.UpdatedAt = time.Now()
	_, err := invoiceColl().InsertOne(ctx, inv)
	return err
}

func FindInvoiceByID(id primitive.ObjectID) (*models.Invoice, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var inv models.Invoice
	err := invoiceColl().FindOne(ctx, bson.M{"_id": id}).Decode(&inv)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

type InvoiceFilter struct {
	Q      string
	Status string
	From   *time.Time
	To     *time.Time
	Page   int
	Limit  int
}

func ListInvoices(f InvoiceFilter) ([]models.Invoice, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}

	if f.Q != "" {
		filter["$or"] = bson.A{
			bson.M{"invoice_number": bson.M{"$regex": f.Q, "$options": "i"}},
			bson.M{"bill_to.name": bson.M{"$regex": f.Q, "$options": "i"}},
		}
	}
	if f.Status != "" {
		filter["status"] = f.Status
	}
	if f.From != nil || f.To != nil {
		dateFilter := bson.M{}
		if f.From != nil {
			dateFilter["$gte"] = f.From
		}
		if f.To != nil {
			dateFilter["$lte"] = f.To
		}
		filter["date"] = dateFilter
	}

	total, err := invoiceColl().CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	skip := int64((f.Page - 1) * f.Limit)
	opts := options.Find().
		SetSort(bson.D{{Key: "date", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(f.Limit))

	cursor, err := invoiceColl().Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var invoices []models.Invoice
	if err = cursor.All(ctx, &invoices); err != nil {
		return nil, 0, err
	}
	return invoices, total, nil
}

func UpdateInvoice(id primitive.ObjectID, update bson.M) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	update["updated_at"] = time.Now()
	_, err := invoiceColl().UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

func DeleteInvoice(id primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := invoiceColl().DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func GetInvoiceStats() (*models.InvoiceStats, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: nil},
			{Key: "total_invoices", Value: bson.D{{Key: "$sum", Value: 1}}},
			{Key: "total_amount", Value: bson.D{{Key: "$sum", Value: "$total"}}},
			{Key: "total_paid", Value: bson.D{{Key: "$sum", Value: "$paid"}}},
			{Key: "total_due", Value: bson.D{{Key: "$sum", Value: "$due"}}},
		}}},
	}

	cursor, err := invoiceColl().Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		TotalInvoices int64   `bson:"total_invoices"`
		TotalAmount   float64 `bson:"total_amount"`
		TotalPaid     float64 `bson:"total_paid"`
		TotalDue      float64 `bson:"total_due"`
	}
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	stats := &models.InvoiceStats{}
	if len(results) > 0 {
		stats.TotalInvoices = results[0].TotalInvoices
		stats.TotalAmount = results[0].TotalAmount
		stats.TotalPaid = results[0].TotalPaid
		stats.TotalDue = results[0].TotalDue
	}

	// Count by status
	for _, status := range []models.InvoiceStatus{models.StatusDraft, models.StatusPaid, models.StatusPartiallyPaid, models.StatusOverdue} {
		count, _ := invoiceColl().CountDocuments(ctx, bson.M{"status": status})
		switch status {
		case models.StatusDraft:
			stats.DraftCount = count
		case models.StatusPaid:
			stats.PaidCount = count
		case models.StatusPartiallyPaid:
			stats.PartialCount = count
		case models.StatusOverdue:
			stats.OverdueCount = count
		}
	}

	return stats, nil
}

func EnsureInvoiceIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := invoiceColl().Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "invoice_number", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "created_by", Value: 1}}},
		{Keys: bson.D{{Key: "date", Value: -1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	})
	return err
}
