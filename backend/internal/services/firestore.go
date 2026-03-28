package services

import (
	"context"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
)

// FirestoreClient wraps the Firestore client for order storage.
type FirestoreClient struct {
	client *firestore.Client
}

// OrderRecord is what gets persisted to Firestore.
type OrderRecord struct {
	OrderID    string    `firestore:"order_id"`
	DistanceKM float64   `firestore:"distance_km"`
	Earnings   float64   `firestore:"earnings"`
	Lat        float64   `firestore:"lat"`
	Lng        float64   `firestore:"lng"`
	Timestamp  string    `firestore:"timestamp"`
	CreatedAt  time.Time `firestore:"created_at"`
}

// ResultRecord stores the analysis result alongside the order.
type ResultRecord struct {
	OrderID              string    `firestore:"order_id"`
	Decision             string    `firestore:"decision"`
	EarningsPerHour      float64   `firestore:"earnings_per_hour"`
	EstimatedTimeMinutes float64   `firestore:"estimated_time_minutes"`
	SuggestedRelocation  string    `firestore:"suggested_relocation,omitempty"`
	CreatedAt            time.Time `firestore:"created_at"`
}

// NewFirestoreClient initialises the Firestore connection.
// It reads the GCP project ID from the GOOGLE_CLOUD_PROJECT env var.
func NewFirestoreClient(ctx context.Context) (*FirestoreClient, error) {
	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	if projectID == "" {
		projectID = os.Getenv("GCP_PROJECT")
	}
	if projectID == "" {
		projectID = "saathi-491606" // fallback for local dev
	}

	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	log.Printf("[Firestore] Connected to project: %s", projectID)
	return &FirestoreClient{client: client}, nil
}

// Close cleans up the Firestore client.
func (f *FirestoreClient) Close() error {
	return f.client.Close()
}

// SaveOrder persists an order notification to the "orders" collection.
func (f *FirestoreClient) SaveOrder(ctx context.Context, req AnalyzeOrderRequest) error {
	record := OrderRecord{
		OrderID:    req.OrderID,
		DistanceKM: req.DistanceKM,
		Earnings:   req.Earnings,
		Lat:        req.Location.Lat,
		Lng:        req.Location.Lng,
		Timestamp:  req.Timestamp,
		CreatedAt:  time.Now().UTC(),
	}
	_, _, err := f.client.Collection("orders").Add(ctx, record)
	if err != nil {
		log.Printf("[Firestore] Failed to save order %s: %v", req.OrderID, err)
		return err
	}
	log.Printf("[Firestore] Saved order %s", req.OrderID)
	return nil
}

// SaveResult persists an analysis result to the "results" collection.
func (f *FirestoreClient) SaveResult(ctx context.Context, result AnalyzeOrderResponse) error {
	relocation := ""
	if result.SuggestedRelocation != nil {
		relocation = *result.SuggestedRelocation
	}
	record := ResultRecord{
		OrderID:              result.OrderID,
		Decision:             result.Decision,
		EarningsPerHour:      result.EarningsPerHour,
		EstimatedTimeMinutes: result.EstimatedTimeMinutes,
		SuggestedRelocation:  relocation,
		CreatedAt:            time.Now().UTC(),
	}
	_, _, err := f.client.Collection("results").Add(ctx, record)
	if err != nil {
		log.Printf("[Firestore] Failed to save result for %s: %v", result.OrderID, err)
		return err
	}
	log.Printf("[Firestore] Saved result for %s: %s", result.OrderID, result.Decision)
	return nil
}

// GetRecentOrders retrieves the last N orders, newest first.
func (f *FirestoreClient) GetRecentOrders(ctx context.Context, limit int) ([]OrderRecord, error) {
	iter := f.client.Collection("orders").
		OrderBy("created_at", firestore.Desc).
		Limit(limit).
		Documents(ctx)
	defer iter.Stop()

	var orders []OrderRecord
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var o OrderRecord
		if err := doc.DataTo(&o); err != nil {
			continue
		}
		orders = append(orders, o)
	}
	return orders, nil
}
