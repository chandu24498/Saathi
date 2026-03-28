package services

import (
	"testing"
)

// TestOrderRecordFields verifies the OrderRecord struct matches expected fields
func TestOrderRecordFields(t *testing.T) {
	rec := OrderRecord{
		OrderID:    "TEST-001",
		DistanceKM: 5.0,
		Earnings:   100.0,
		Lat:        12.9716,
		Lng:        77.5946,
		Timestamp:  "2026-03-28T12:00:00Z",
	}
	if rec.OrderID != "TEST-001" {
		t.Errorf("expected OrderID TEST-001, got %s", rec.OrderID)
	}
	if rec.DistanceKM != 5.0 {
		t.Errorf("expected DistanceKM 5.0, got %f", rec.DistanceKM)
	}
}

// TestResultRecordFields verifies the ResultRecord struct
func TestResultRecordFields(t *testing.T) {
	rec := ResultRecord{
		OrderID:              "TEST-002",
		Decision:             "Accept",
		EarningsPerHour:      400.0,
		EstimatedTimeMinutes: 15.0,
		SuggestedRelocation:  "",
	}
	if rec.Decision != "Accept" {
		t.Errorf("expected Accept, got %s", rec.Decision)
	}
	if rec.EarningsPerHour != 400.0 {
		t.Errorf("expected EPH 400, got %f", rec.EarningsPerHour)
	}
}

// TestAnalyzeOrderResponseHasOrderID ensures the OrderID is populated in the response
func TestAnalyzeOrderResponseHasOrderID(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "TEST-OID-003",
		DistanceKM: 4.0,
		Earnings:   150.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)
	if res.OrderID != "TEST-OID-003" {
		t.Errorf("expected OrderID TEST-OID-003 in response, got %s", res.OrderID)
	}
}

// TestAnalyzeOrderResponseOrderIDOnReject ensures OrderID is populated even for rejected orders
func TestAnalyzeOrderResponseOrderIDOnReject(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "TEST-OID-004",
		DistanceKM: 10.0,
		Earnings:   30.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)
	if res.OrderID != "TEST-OID-004" {
		t.Errorf("expected OrderID TEST-OID-004 in response, got %s", res.OrderID)
	}
	if res.Decision != "Reject" {
		t.Errorf("expected Reject, got %s", res.Decision)
	}
}

// TestAnalyzeOrderResponseOrderIDOnInvalidInput ensures OrderID is populated even for invalid inputs
func TestAnalyzeOrderResponseOrderIDOnInvalidInput(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "TEST-INVALID-005",
		DistanceKM: -1, // invalid
		Earnings:   100.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)
	if res.OrderID != "TEST-INVALID-005" {
		t.Errorf("expected OrderID TEST-INVALID-005 in response, got %s", res.OrderID)
	}
}

// TestHaversineKMValidCoordinates verifies distance calculation between known Bangalore locations
func TestHaversineKMValidCoordinates(t *testing.T) {
	// Koramangala to Indiranagar ~ roughly 3-5 km
	dist := haversineKM(12.9352, 77.6245, 13.0206, 77.6400)
	if dist < 0 {
		t.Errorf("expected positive distance, got %f", dist)
	}
	if dist < 1 || dist > 15 {
		t.Errorf("expected distance between 1 and 15 km for Koramangala-Indiranagar, got %f", dist)
	}
}

// TestHaversineKMInvalidCoordinates verifies sentinel value for invalid input
func TestHaversineKMInvalidCoordinates(t *testing.T) {
	dist := haversineKM(100, 77.6245, 13.0206, 77.6400) // lat out of range
	if dist != -1 {
		t.Errorf("expected -1 for invalid coordinates, got %f", dist)
	}
}

// TestIsValidCoordinate verifies coordinate validation
func TestIsValidCoordinate(t *testing.T) {
	tests := []struct {
		lat, lng float64
		valid    bool
	}{
		{12.9716, 77.5946, true},
		{0, 0, true},
		{-90, -180, true},
		{90, 180, true},
		{91, 0, false},
		{0, 181, false},
		{-91, 0, false},
	}
	for _, tt := range tests {
		got := isValidCoordinate(tt.lat, tt.lng)
		if got != tt.valid {
			t.Errorf("isValidCoordinate(%f, %f) = %v, want %v", tt.lat, tt.lng, got, tt.valid)
		}
	}
}
