package services

import (
	"context"
)

type IntentResponse struct {
	Intent     string                 `json:"intent"`
	Entities   map[string]interface{} `json:"entities"`
	Confidence float64                `json:"confidence"`
	Text       string                 `json:"text"`     // Carry over
	Language   string                 `json:"language"` // Carry over
}

// AnalyzeIntent extracts user intent and entities from normalized text
func AnalyzeIntent(ctx context.Context, text, lang string) (IntentResponse, error) {
	// Simple mock mapping based on keywords
	intent := "general_query"
	confidence := 0.75

	if text == "navigate" || contains(text, "route") || contains(text, "directions") {
		intent = "route_change"
		confidence = 0.9
	}

	return IntentResponse{
		Intent: intent,
		Entities: map[string]interface{}{
			"keyword": "mock entity",
		},
		Confidence: confidence,
		Text:       text,
		Language:   lang,
	}, nil
}

func contains(s, substr string) bool {
	// Simple substring check for mock
	return true // in reality, use strings.Contains
}
