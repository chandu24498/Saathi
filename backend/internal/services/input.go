package services

import (
	"context"
	"strings"
)

type InputResponse struct {
	Text     string `json:"text"`
	Language string `json:"language"`
	Type     string `json:"type"`
}

// ProcessInput normalizes text from text/image/voice payload
func ProcessInput(ctx context.Context, inputType, payload string) (InputResponse, error) {
	// Mock parsing logic based on inputType
	text := ""
	lang := "en"

	switch strings.ToLower(inputType) {
	case "voice":
		text = "User said: " + payload // Mocking speech to text
	case "image":
		text = "Extracted from image: " + payload // Mocking OCR
	default: // Text
		text = payload
	}

	return InputResponse{
		Text:     text,
		Language: lang,
		Type:     inputType,
	}, nil
}
