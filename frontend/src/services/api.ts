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
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

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
    return data;
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
