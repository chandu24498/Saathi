package services

type Action struct {
	Type   string `json:"type"`
	URL    string `json:"url,omitempty"`
	Number string `json:"number,omitempty"`
}

type FinalResponse struct {
	Summary    string   `json:"summary"`
	Steps      []string `json:"steps"`
	Actions    []Action `json:"actions"`
	Confidence float64  `json:"confidence"`
}

// BuildResponse formats the output into the final JSON structure requested
func BuildResponse(decision DecisionResponse) FinalResponse {
	summaryText := "Keep driving."
	actions := make([]Action, 0)

	if decision.RecommendedAction == "reroute" {
		summaryText = decision.Steps[0]
		actions = append(actions, Action{
			Type: "navigate",
			URL:  "https://maps.google.com/?daddr=alternate_route",
		})
		actions = append(actions, Action{
			Type:   "call",
			Number: "+123456789", // Mock fallback logic
		})
	}

	// Prepare steps excluding the summary from the list if desired
	var steps []string
	if len(decision.Steps) > 1 {
		steps = decision.Steps[1:]
	} else {
		steps = decision.Steps
	}

	return FinalResponse{
		Summary:    summaryText,
		Steps:      steps,
		Actions:    actions,
		Confidence: decision.Confidence, // Based on tech spec payload structure
	}
}
