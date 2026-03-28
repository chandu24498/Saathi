// Configuration constants
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_DISTANCE_KM = 100;
const MAX_EARNINGS = 100000;
const MIN_EARNINGS = 0;

// Custom error type for API failures
export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Validate request data before sending
function validateAnalyzeOrderRequest(req: AnalyzeOrderRequest): string | null {
  if (!req.order_id || req.order_id.trim().length === 0) {
    return "Order ID is required";
  }

  if (req.distance_km <= 0 || req.distance_km > MAX_DISTANCE_KM) {
    return `Distance must be between 0 and ${MAX_DISTANCE_KM} km`;
  }

  if (req.earnings < MIN_EARNINGS || req.earnings > MAX_EARNINGS) {
    return `Earnings must be between ${MIN_EARNINGS} and ${MAX_EARNINGS}`;
  }

  if (req.location.lat < -90 || req.location.lat > 90) {
    return "Latitude must be between -90 and 90 degrees";
  }

  if (req.location.lng < -180 || req.location.lng > 180) {
    return "Longitude must be between -180 and 180 degrees";
  }

  if (!req.timestamp || new Date(req.timestamp).toString() === "Invalid Date") {
    return "Invalid or missing timestamp";
  }

  return null; // Valid
}

// Validate and get API base URL
function getAPIBaseURL(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "https://saathi-backend-kgzlbaodia-uc.a.run.app";
  
  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch {
    console.error(`Invalid API_BASE_URL: ${url}`);
    // Fallback for development
    return "http://localhost:8080";
  }
}

const API_BASE_URL = getAPIBaseURL();

export interface AnalyzeOrderRequest {
  order_id: string;
  distance_km: number;
  earnings: number;
  location: { lat: number; lng: number };
  timestamp: string;
}

export interface AnalyzeOrderResponse {
  order_id: string;
  decision: "Accept" | "Reject";
  earnings_per_hour: number;
  estimated_time_minutes: number;
  suggested_relocation: string | null;
}

export async function analyzeOrder(req: AnalyzeOrderRequest): Promise<AnalyzeOrderResponse> {
  // Validate request before sending
  const validationError = validateAnalyzeOrderRequest(req);
  if (validationError) {
    throw new APIError(400, 'Validation Error', validationError);
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-ok responses with specific status information
      if (!response.ok) {
        let errorMessage = "Failed to analyze order";
        let errorData: unknown = null;

        try {
          errorData = await response.json();
          if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
            errorMessage = (errorData as { error: string }).error;
          }
        } catch {
          // Response is not JSON, use HTTP status text
          errorMessage = `API Error (${response.status}): ${response.statusText}`;
        }

        throw new APIError(response.status, response.statusText, errorMessage);
      }

      const data = await response.json() as AnalyzeOrderResponse;
      
      // Validate response data
      if (!data.order_id || !data.decision) {
        throw new APIError(500, 'Invalid Response', 'Server returned incomplete data');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort as timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(
          408,
          'Request Timeout',
          `Request took longer than ${REQUEST_TIMEOUT_MS / 1000} seconds. Try again.`
        );
      }
      
      throw error;
    }
  } catch (error) {
    // Re-throw APIError as-is
    if (error instanceof APIError) {
      throw error;
    }

    // Network error or JSON parse error
    if (error instanceof TypeError) {
      throw new APIError(
        0,
        'Network Error',
        `Network error: ${error.message}. Ensure backend is running at ${API_BASE_URL}`
      );
    }

    // Unknown error
    throw new APIError(
      500,
      'Unknown Error',
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}
