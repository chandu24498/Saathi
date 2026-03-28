package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"saathi-backend/internal/services"
)

// HealthResponse represents the API health check response.
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Firestore string    `json:"firestore"`
}

// ErrorResponse represents a structured error response.
type ErrorResponse struct {
	Error   string `json:"error"`
	Status  int    `json:"status"`
	Message string `json:"message,omitempty"`
}

// AnalysisErrorResponse includes validation-specific error details.
type AnalysisErrorResponse struct {
	Error      string `json:"error"`
	Status     int    `json:"status"`
	InvalidKey string `json:"invalid_key,omitempty"`
}

var logger = log.New(os.Stdout, "[Saathi API] ", log.LstdFlags|log.Lshortfile)

// Configuration constants
const (
	// Firebase initialization timeout
	FirestoreInitTimeout = 10 * time.Second

	// Request processing timeout for Firestore operations
	FirestoreTimeout = 5 * time.Second

	// CORS max age in seconds
	CORSMaxAge = "3600"
)

// Allowed origins for CORS (configure via environment or hardcode trusted domains)
var AllowedOrigins = map[string]bool{
	"http://localhost:3000":                            true,
	"https://saathi-frontend-abcd1234.vercel.app":     true,
	"https://saathi-frontend-kgzlbaodia-uc.a.run.app": true,
}

// Global Firestore client (nil if unavailable – graceful degradation)
var fsClient *services.FirestoreClient

func main() {
	// Initialise Firestore
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fc, err := services.NewFirestoreClient(ctx)
	if err != nil {
		logger.Printf("WARNING: Firestore unavailable – running without persistence: %v", err)
	} else {
		fsClient = fc
		defer fsClient.Close()
	}

	r := gin.Default()

	// CORS middleware with origin validation
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		// Only set CORS header if origin is in allowlist
		if origin != "" && AllowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		c.Writer.Header().Set("Access-Control-Max-Age", CORSMaxAge)
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/api/health", handleHealth)
	r.POST("/api/analyze-order", handleAnalyzeOrder)
	r.GET("/api/orders/recent", handleRecentOrders)

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Endpoint not found", Status: 404})
	})

	logger.Println("Starting Saathi API Gateway on :8080")
	if err := r.Run(":8080"); err != nil {
		logger.Fatalf("Failed to start server: %v", err)
	}
}

func handleHealth(c *gin.Context) {
	fsStatus := "disconnected"
	if fsClient != nil {
		fsStatus = "connected"
	}
	c.JSON(http.StatusOK, HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC(),
		Firestore: fsStatus,
	})
}

func handleAnalyzeOrder(c *gin.Context) {
	var req services.AnalyzeOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Printf("Invalid request from %s: %v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, AnalysisErrorResponse{
			Error:      "Invalid request payload",
			Status:     http.StatusBadRequest,
			InvalidKey: err.Error(),
		})
		return
	}

	logger.Printf("Analyzing order: %s (earnings=%.2f, distance=%.2f km)",
		req.OrderID, req.Earnings, req.DistanceKM)

	// Save the order to Firestore (non-blocking with proper context handling)
	if fsClient != nil {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), FirestoreTimeout)
			defer cancel()
			if err := fsClient.SaveOrder(ctx, req); err != nil {
				logger.Printf("Firestore SaveOrder error for %s: %v", req.OrderID, err)
			}
		}()
	}

	// Run analysis
	result := services.AnalyzeOrder(req)

	if result.Decision == "" || result.OrderID == "" || result.EarningsPerHour < 0 || result.EstimatedTimeMinutes < 0 {
		logger.Printf("Invalid response generated for order %s", req.OrderID)
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:  "Failed to generate analysis",
			Status: http.StatusInternalServerError,
		})
		return
	}

	// Save the result to Firestore (non-blocking with proper context handling)
	if fsClient != nil {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), FirestoreTimeout)
			defer cancel()
			if err := fsClient.SaveResult(ctx, result); err != nil {
				logger.Printf("Firestore SaveResult error for %s: %v", result.OrderID, err)
			}
		}()
	}

	logger.Printf("Analysis result for %s: %s (EPH=%.2f)",
		req.OrderID, result.Decision, result.EarningsPerHour)

	c.JSON(http.StatusOK, result)
}

func handleRecentOrders(c *gin.Context) {
	if fsClient == nil {
		c.JSON(http.StatusServiceUnavailable, ErrorResponse{
			Error:  "Firestore not available",
			Status: http.StatusServiceUnavailable,
		})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), FirestoreTimeout)
	defer cancel()

	orders, err := fsClient.GetRecentOrders(ctx, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:  "Failed to fetch orders",
			Status: http.StatusInternalServerError,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}
