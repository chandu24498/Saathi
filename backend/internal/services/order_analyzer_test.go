package services

import (
	"testing"
)

// FRS Test Scenario 1: High Value Order – ₹150, 4 km → Accept
func TestAnalyzeOrder_HighValue(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "ORD-HIGH-001",
		DistanceKM: 4.0,
		Earnings:   150.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)

	if res.Decision != "Accept" {
		t.Errorf("expected Accept, got %s", res.Decision)
	}
	if res.EarningsPerHour <= 0 {
		t.Errorf("expected positive earnings/hr, got %f", res.EarningsPerHour)
	}
	if res.EstimatedTimeMinutes <= 0 {
		t.Errorf("expected positive estimated time, got %f", res.EstimatedTimeMinutes)
	}
	// Relocation should be nil for accepted orders
	if res.SuggestedRelocation != nil {
		t.Errorf("expected no relocation for accepted order, got %v", *res.SuggestedRelocation)
	}
}

// FRS Test Scenario 2: Low Value Order – ₹50, 6 km → Reject
func TestAnalyzeOrder_LowValue(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "ORD-LOW-002",
		DistanceKM: 6.0,
		Earnings:   50.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)

	if res.Decision != "Reject" {
		t.Errorf("expected Reject, got %s", res.Decision)
	}
	// For a rejected order at MG Road (high-demand zone), relocation should be nil
	// because user is already in a high-demand zone
}

// FRS Test Scenario 3: Medium Order – ₹100, 5 km → borderline
func TestAnalyzeOrder_MediumValue(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "ORD-MED-003",
		DistanceKM: 5.0,
		Earnings:   100.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)

	// At 20 km/h, 5 km = 15 min. EPH = (100/15)*60 = 400. Should Accept.
	if res.Decision != "Accept" {
		t.Errorf("expected Accept for medium order (EPH=400), got %s", res.Decision)
	}
}

// Edge case: very short distance
func TestAnalyzeOrder_VeryShortDistance(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "ORD-SHORT-004",
		DistanceKM: 0.1,
		Earnings:   50.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)

	if res.EstimatedTimeMinutes < 1 {
		t.Errorf("minimum time should be 1 minute, got %f", res.EstimatedTimeMinutes)
	}
	if res.Decision != "Accept" {
		t.Errorf("expected Accept for very short distance order, got %s", res.Decision)
	}
}

// Relocation suggestion for worker outside high-demand zones
func TestAnalyzeOrder_RelocationSuggested(t *testing.T) {
	req := AnalyzeOrderRequest{
		OrderID:    "ORD-RELOC-005",
		DistanceKM: 10.0,
		Earnings:   30.0,
		Location:   Location{Lat: 13.10, Lng: 77.50}, // far from all demand zones
	}
	res := AnalyzeOrder(req)

	if res.Decision != "Reject" {
		t.Errorf("expected Reject for low-value far order, got %s", res.Decision)
	}
	if res.SuggestedRelocation == nil {
		t.Errorf("expected relocation suggestion for worker outside demand zones")
	}
}

// Earnings per hour calculation accuracy
func TestAnalyzeOrder_EarningsPerHourCalculation(t *testing.T) {
	// 3 km at 20 km/h = 9 min. EPH = (120/9)*60 = 800
	req := AnalyzeOrderRequest{
		OrderID:    "ORD-CALC-006",
		DistanceKM: 3.0,
		Earnings:   120.0,
		Location:   Location{Lat: 12.9716, Lng: 77.5946},
	}
	res := AnalyzeOrder(req)

	expectedEPH := 800.0
	if res.EarningsPerHour != expectedEPH {
		t.Errorf("expected EPH=%.2f, got %.2f", expectedEPH, res.EarningsPerHour)
	}
}
