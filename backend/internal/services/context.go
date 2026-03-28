package services

import (
	"context"
)

type ContextResponse struct {
	Routes  []string `json:"routes"`
	Traffic string   `json:"traffic"`
	ETA     string   `json:"eta"`
}

// FetchContext retrieves external contextual data (e.g., Maps, Traffic)
func FetchContext(ctx context.Context, lat, lng float64, intent IntentResponse) (ContextResponse, error) {
	// Mock contextual data for MVP
	return ContextResponse{
		Routes:  []string{"Main Road", "Service Road"},
		Traffic: "heavy",
		ETA:     "15 mins",
	}, nil
}
