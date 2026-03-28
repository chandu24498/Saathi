package services

import (
	"context"
)

type DecisionResponse struct {
	RecommendedAction string
	Steps             []string
	Confidence        float64
}

// MakeDecision applies business logic to generate recommendations
func MakeDecision(ctx context.Context, intent IntentResponse, ctxData ContextResponse) DecisionResponse {
	// Simple rule engine
	action := "continue"
	steps := []string{"Keep heading straight for 2km"}
	confidence := intent.Confidence

	if ctxData.Traffic == "heavy" {
		action = "reroute"
		steps = []string{
			"Take back gate route to save 8 mins",
			"Turn left in 200m",
			"Use service road",
		}
		confidence = 0.91
	}

	return DecisionResponse{
		RecommendedAction: action,
		Steps:             steps,
		Confidence:        confidence,
	}
}
