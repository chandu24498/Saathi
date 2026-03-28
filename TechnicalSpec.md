# Technical Architecture Document
## Product: Saathi
## Version: v1 (Hackathon + Scalable MVP)
## Backend: Golang
## Frontend: Next.js (React) + Tailwind CSS + shadcn/ui
## Cloud: Google Cloud Platform (GCP)

---

# 🏗️ 1. High-Level Architecture

                ┌──────────────────────┐
                │   Next.js Frontend   │
                │ (React + Tailwind)   │
                └─────────┬────────────┘
                          │ HTTPS (REST)
                          ▼
                ┌──────────────────────┐
                │   API Gateway Layer  │
                └─────────┬────────────┘
                          ▼
        ┌────────────────────────────────────┐
        │     Golang Microservices Layer     │
        │------------------------------------│
        │ Input Service                      │
        │ Intent Service                     │
        │ Context Service                    │
        │ Decision Engine                    │
        │ Response Builder                   │
        └─────────┬──────────────────────────┘
                  ▼
        ┌────────────────────────────────────┐
        │     External / GCP Services        │
        │------------------------------------│
        │ Speech-to-Text                     │
        │ Vision API (OCR)                   │
        │ Translation API                    │
        │ Maps Platform                      │
        └────────────────────────────────────┘

---

# 🎨 2. Frontend Architecture (Next.js)

## 2.1 Framework Choice
- Next.js (App Router)
- React 18+
- Tailwind CSS
- shadcn/ui (component system)

---

## 2.2 Application Structure

frontend/
  app/
    page.tsx                # Main entry (single-screen UX)
    result/page.tsx         # Result display
  components/
    MicButton.tsx
    UploadButton.tsx
    ResultCard.tsx
    ActionButtons.tsx
  services/
    api.ts                  # API client
  hooks/
    useVoiceInput.ts
    useLocation.ts

---

## 2.3 UI State Flow

Idle → Listening → Processing → Result

State managed via:
- React hooks (useState/useReducer)
- Optional: lightweight store (Zustand)

---

## 2.4 Key UI Features

### Voice Input
- Browser SpeechRecognition API
- Fallback to file upload

---

### Result Display
- Summary (top priority)
- Steps list
- Action buttons:
  - Navigate
  - Call
  - Translate

---

### Styling
- Tailwind utility classes
- shadcn components:
  - Card
  - Button
  - Dialog
  - Toast

---

## 2.5 Performance Requirements (Frontend)

- First load < 2s
- Interaction latency < 100ms
- Lighthouse score > 85

---

## 2.6 PWA (Optional but Recommended)

- Installable app
- Offline fallback screen

---

# 🧩 3. Backend Architecture (Golang)

---

## 3.1 API Gateway Layer

### Responsibilities
- Authentication (JWT)
- Rate limiting
- Routing to services

---

## 3.2 Core Microservices

---

### 1. Input Service

Handles:
- Multipart uploads (audio/image)
- Text normalization

Output:
{
  "text": "...",
  "language": "...",
  "type": "voice|image|text"
}

---

### 2. Intent Service

Responsibilities:
- Intent classification
- Entity extraction

Output:
{
  "intent": "route_change",
  "entities": {...},
  "confidence": 0.9
}

---

### 3. Context Service

Responsibilities:
- Fetch:
  - Routes
  - ETA
  - Traffic

Integrates with:
- Google Maps APIs

---

### 4. Decision Engine

Responsibilities:
- Apply business logic
- Generate recommended actions

Example:
IF traffic == heavy → suggest alternate route

---

### 5. Response Builder

Formats final output:

{
  "summary": "...",
  "steps": [...],
  "actions": [...],
  "confidence": 0.92
}

---

# ⚙️ 4. API Contract

## Endpoint

POST /api/process

---

## Request

{
  "type": "voice | text | image",
  "payload": "...",
  "metadata": {
    "location": {
      "lat": 12.97,
      "lng": 77.59
    },
    "language": "en"
  }
}

---

## Response

{
  "summary": "Take back gate route to save 8 mins",
  "steps": [
    "Turn left in 200m",
    "Use service road"
  ],
  "actions": [
    { "type": "navigate", "url": "..." },
    { "type": "call", "number": "..." }
  ],
  "confidence": 0.91
}

---

# ☁️ 5. Google Cloud Architecture

---

## Compute
- Google Kubernetes Engine (GKE)
- Auto-scaling pods

---

## Storage
- Cloud Storage (media files)
- Firestore (real-time data)

---

## Messaging
- Pub/Sub (async tasks)

---

## AI Services
- Speech-to-Text
- Vision API
- Translation API

---

## Maps
- Google Maps Platform

---

## Monitoring
- Cloud Monitoring
- Cloud Logging

---

# ⚡ 6. Concurrency Model (Golang)

---

## Pipeline Pattern

Request Flow:

Input → Intent → Context → Decision → Response

---

## Implementation

- Goroutines per stage
- Channels for communication
- Worker pools for:
  - OCR
  - Speech processing

---

## Timeout Handling

- Context timeout per request (2–3s)
- Fail fast on slow dependencies

---

# 🚀 7. Performance Requirements

- P95 latency < 2s
- P99 latency < 3.5s
- Support 5K–10K concurrent users (MVP scalable)
- Payload size < 2MB

---

# 📈 8. Scalability Strategy

- Stateless services
- Horizontal scaling via GKE
- CDN for frontend assets
- Redis (optional caching layer)

---

# 🔐 9. Security Design

---

## Authentication
- JWT tokens

---

## Transport Security
- HTTPS (TLS 1.2+)

---

## Data Security
- Encrypt at rest (GCP default)
- Mask PII:
  - phone numbers
  - addresses

---

## API Protection
- Rate limiting
- Input validation
- File size restrictions

---

# 🧪 10. Reliability & Fault Tolerance

- Retry with exponential backoff
- Circuit breaker for:
  - Maps API
  - AI APIs

---

## Graceful Degradation

| Failure | Fallback |
|--------|---------|
| Speech API fails | Ask for text input |
| Maps fails | Show basic directions |
| Translation fails | Show original text |

---

# 📦 11. Deployment Strategy

---

## CI/CD
- GitHub Actions / Cloud Build

---

## Containerization
- Docker for all services

---

## Deployment
- Rolling updates (zero downtime)

---

# 🚫 12. Constraints (Important for LLM Code Gen)

- Keep services stateless
- Avoid deep service chaining (>3 sync calls)
- Keep APIs RESTful and simple
- Modular code structure (per service)

---

# 🔮 13. Future Enhancements

- Native mobile apps (React Native)
- Offline AI inference
- Personalization layer
- Gig platform integrations

---