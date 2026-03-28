# Functional Requirements Specification (FRS)
## Feature Name: Notification-Based Order Analysis
## Product: Saathi
## Version: v1 MVP

---

# 🎯 1. Feature Overview

This feature simulates real-time gig order notifications and enables the user (gig worker) to analyze whether an order is worth accepting.

The system provides:
1. A simulated push notification UI
2. A popup displaying order details
3. An "Analyze" action
4. A structured decision report

---

# 👤 2. User Persona

- Gig worker (delivery / ride)
- Needs quick decision-making support
- Operates in high-speed, real-time environments

---

# 🔁 3. Functional Flow

### Step 1: Trigger Notification
- User clicks "Simulate Notification" button in UI

### Step 2: Display Notification Popup
- A notification modal/popup is displayed

### Step 3: User Initiates Analysis
- User clicks "Analyze" button inside the popup

### Step 4: System Generates Report
- UI calls backend API
- Backend processes order details
- UI displays structured analysis report

---

# 🧩 4. Functional Components

---

## 4.1 Notification Trigger Component

### Description
Simulates receiving a new gig order notification.

### UI Element
- Button: "Simulate Notification"

### Behavior
- On click:
  - Generate mock order data
  - Trigger notification popup

---

## 4.2 Notification Popup Component

### Description
Displays incoming order details in a modal/popup.

### UI Fields
- Order ID
- Distance (in km)
- Earnings (in ₹)

### Example
Order ID: ORD12345
Distance: 5.2 km
Earnings: ₹120

---

### Actions
- "Analyze" button (primary CTA)
- "Dismiss" button (secondary)

---

## 4.3 Analyze Action

### Trigger
- User clicks "Analyze"

### Behavior
- Send request to backend API:
  POST /api/analyze-order

---

## 4.4 Backend Processing Logic

### Inputs
```json
{
  "order_id": "ORD12345",
  "distance_km": 5.2,
  "earnings": 120,
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "timestamp": "2026-03-28T14:00:00Z"
}
```

---

### Processing Steps
1. Estimate travel time based on distance
2. Calculate earnings per hour:
   earnings_per_hour = (earnings / estimated_time) * 60
3. Compare with threshold (configurable)
4. Determine decision:
   - Accept (if above threshold)
   - Reject (if below threshold)
5. Suggest relocation (optional):
   - If low demand area detected

---

## 4.5 Analysis Report (Output)

### Format
```json
{
  "decision": "Accept | Reject",
  "earnings_per_hour": 400,
  "estimated_time_minutes": 18,
  "suggested_relocation": "Move 1.2 km towards high-demand area" | null
}
```

---

## 4.6 UI Report Display Component

### Description
Displays structured analysis in a visually clear format.

### UI Sections

#### 1. Decision Recommendation
- Prominent display (large text)
- Color-coded:
  - Green → Accept
  - Red → Reject

---

#### 2. Earnings per Hour
- Format: ₹XXX/hr

---

#### 3. Time Estimate
- Format: XX minutes

---

#### 4. Suggested Relocation
- Optional text
- Display only if available

---

# ⚡ 5. Functional Requirements

---

## FR-1: Notification Simulation
- System shall provide a button to simulate incoming order notification

---

## FR-2: Notification Display
- System shall display a popup with:
  - Order ID
  - Distance
  - Earnings

---

## FR-3: Analyze Action
- System shall provide an "Analyze" button in the popup

---

## FR-4: API Integration
- System shall call backend API on analyze action

---

## FR-5: Decision Computation
- System shall compute:
  - Estimated time
  - Earnings per hour
  - Accept/Reject decision

---

## FR-6: Report Display
- System shall display:
  - Decision recommendation
  - Earnings/hour
  - Time estimate
  - Suggested relocation (optional)

---

## FR-7: Response Time
- System shall return analysis result within 2 seconds

---

# 🚫 6. Out of Scope

- Real push notification integration (FCM)
- Real-time demand heatmaps
- Historical earnings tracking

---

# 📊 7. Success Metrics

- Time taken to analyze < 2 seconds
- User interaction completion rate > 90%
- Decision clarity (user feedback)

---

# 🧪 8. Test Scenarios

### Scenario 1: High Value Order
- Input: ₹150, 4 km
- Expected: Accept

---

### Scenario 2: Low Value Order
- Input: ₹50, 6 km
- Expected: Reject

---

### Scenario 3: Medium Order
- Input: ₹100, 5 km
- Expected: Conditional decision

---

# 🔧 9. Future Enhancements

- Real push notifications (FCM)
- AI-based demand prediction
- Personalized earning thresholds

---