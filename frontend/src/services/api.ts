export interface ProcessRequest {
  type: "voice" | "text" | "image";
  payload: string;
  metadata: {
    location: { lat: number; lng: number };
    language: string;
  };
}

export interface ActionResponse {
  type: string;
  url?: string;
  number?: string;
}

export interface ProcessResponse {
  summary: string;
  steps: string[];
  actions: ActionResponse[];
  confidence: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://saathi-backend-kgzlbaodia-uc.a.run.app";

export async function processRequest(req: ProcessRequest): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error("Failed to process request");
  }

  return response.json();
}
