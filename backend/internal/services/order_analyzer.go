package services

import (
	"fmt"
	"math"
)

// AnalyzeOrderRequest is the incoming payload from the frontend.
type AnalyzeOrderRequest struct {
	OrderID    string   `json:"order_id"    binding:"required"`
	DistanceKM float64  `json:"distance_km" binding:"required"`
	Earnings   float64  `json:"earnings"    binding:"required"`
	Location   Location `json:"location"    binding:"required"`
	Timestamp  string   `json:"timestamp"`
}

// Location represents the gig worker's current position using WGS84 coordinates.
type Location struct {
	Lat float64 `json:"lat"` // Latitude: -90 to 90 degrees
	Lng float64 `json:"lng"` // Longitude: -180 to 180 degrees
}

// AnalyzeOrderResponse is the structured decision report.
type AnalyzeOrderResponse struct {
	OrderID              string  `json:"order_id"`
	Decision             string  `json:"decision"`
	EarningsPerHour      float64 `json:"earnings_per_hour"`
	EstimatedTimeMinutes float64 `json:"estimated_time_minutes"`
	SuggestedRelocation  *string `json:"suggested_relocation"`
}

// Configurable threshold (INR per hour). Orders above this are worth taking.
const EarningsPerHourThreshold = 300.0

// Average speed assumption for Bangalore city traffic (km/h).
const AverageSpeedKMH = 20.0

// High-demand zones in Bangalore (lat, lng, radius_km, name).
type demandZone struct {
	Lat    float64
	Lng    float64
	Radius float64
	Name   string
}

var highDemandZones = []demandZone{
	{12.9352, 77.6245, 2.0, "Koramangala"},
	{12.9716, 77.5946, 1.5, "MG Road / Brigade Road"},
	{13.0206, 77.6400, 2.0, "Indiranagar"},
	{12.9698, 77.7500, 2.5, "Whitefield"},
	{13.0358, 77.5970, 1.5, "Malleshwaram"},
}

// haversineKM calculates the great-circle distance in kilometers between two lat/lng coordinates.
// Returns -1 for invalid coordinates (outside WGS84 bounds).
// Assumes WGS84 Earth radius of 6371 km.
func haversineKM(lat1, lng1, lat2, lng2 float64) float64 {
	// Validate coordinate ranges for WGS84
	if !isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2) {
		return -1 // Sentinel value indicating invalid input
	}

	const R = 6371.0 // Earth radius in kilometers
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLng := (lng2 - lng1) * math.Pi / 180.0
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180.0)*math.Cos(lat2*math.Pi/180.0)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// isValidCoordinate validates that latitude and longitude are within WGS84 bounds.
func isValidCoordinate(lat, lng float64) bool {
	return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// findRelocationSuggestion checks if the worker is far from all high-demand
// zones and returns a suggestion to move toward the nearest one.
func findRelocationSuggestion(lat, lng float64) *string {
	var nearest string
	minDist := math.MaxFloat64
	for _, z := range highDemandZones {
		d := haversineKM(lat, lng, z.Lat, z.Lng)
		if d < z.Radius {
			// Already in a high-demand zone – no relocation needed.
			return nil
		}
		if d < minDist {
			minDist = d
			nearest = z.Name
		}
	}
	if nearest != "" {
		s := "Move " + formatFloat(minDist) + " km towards " + nearest + " (high-demand area)"
		return &s
	}
	return nil
}

func formatFloat(v float64) string {
	rounded := math.Round(v*10) / 10
	return fmt.Sprintf("%.1f", rounded)
}


// AnalyzeOrder is the core business logic for order analysis.
// It validates input and returns a decision with earnings metrics.
func AnalyzeOrder(req AnalyzeOrderRequest) AnalyzeOrderResponse {
	// 1. Validate input ranges
	if req.DistanceKM <= 0 || req.Earnings < 0 {
		return AnalyzeOrderResponse{
			OrderID:              req.OrderID,
			Decision:             "Reject",
			EarningsPerHour:      0,
			EstimatedTimeMinutes: 0,
			SuggestedRelocation:  nil,
		}
	}

	// 2. Validate coordinates
	if !isValidCoordinate(req.Location.Lat, req.Location.Lng) {
		return AnalyzeOrderResponse{
			OrderID:              req.OrderID,
			Decision:             "Reject",
			EarningsPerHour:      0,
			EstimatedTimeMinutes: 0,
			SuggestedRelocation:  nil,
		}
	}

	// 3. Estimate travel time (minutes) = distance / speed * 60
	estimatedMinutes := (req.DistanceKM / AverageSpeedKMH) * 60.0
	if estimatedMinutes < 1 {
		estimatedMinutes = 1 // minimum 1 minute
	}

	// 4. Earnings per hour
	eph := (req.Earnings / estimatedMinutes) * 60.0

	// 5. Decision based on threshold
	decision := "Reject"
	if eph >= EarningsPerHourThreshold {
		decision = "Accept"
	}

	// 6. Round for clean display
	eph = math.Round(eph*100) / 100
	estimatedMinutes = math.Round(estimatedMinutes*100) / 100

	// 7. Relocation suggestion (only when rejecting)
	var relocation *string
	if decision == "Reject" {
		relocation = findRelocationSuggestion(req.Location.Lat, req.Location.Lng)
	}

	return AnalyzeOrderResponse{
		OrderID:              req.OrderID,
		Decision:             decision,
		EarningsPerHour:      eph,
		EstimatedTimeMinutes: estimatedMinutes,
		SuggestedRelocation:  relocation,
	}
}
