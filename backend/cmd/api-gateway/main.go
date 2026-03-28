package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"saathi-backend/internal/services"
)

type ProcessRequest struct {
	Type     string `json:"type"`
	Payload  string `json:"payload"`
	Metadata struct {
		Location struct {
			Lat float64 `json:"lat"`
			Lng float64 `json:"lng"`
		} `json:"location"`
		Language string `json:"language"`
	} `json:"metadata"`
}

func main() {
	r := gin.Default()

	// CORS middleware could be added here
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.POST("/api/process", handleProcess)

	log.Println("Starting Saathi API Gateway on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func handleProcess(c *gin.Context) {
	var req ProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// 1. Pipeline context with timeout (fail fast on slow dependencies)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	// Pipeline Pattern
	// Input -> Intent -> Context -> Decision -> Response

	// 2. Input Service
	inputRes, err := services.ProcessInput(ctx, req.Type, req.Payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process input"})
		return
	}

	// 3. Intent Service
	intentRes, err := services.AnalyzeIntent(ctx, inputRes.Text, req.Metadata.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze intent"})
		return
	}

	// 4. Context Service
	ctxRes, err := services.FetchContext(ctx, req.Metadata.Location.Lat, req.Metadata.Location.Lng, intentRes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch context"})
		return
	}

	// 5. Decision Engine
	decisionRes := services.MakeDecision(ctx, intentRes, ctxRes)

	// 6. Response Builder
	finalResponse := services.BuildResponse(decisionRes)

	c.JSON(http.StatusOK, finalResponse)
}
