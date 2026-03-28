# Product Requirements Document (PRD)
## Product Name: Saathi
## Version: v1 MVP
## Target Users: Gig Workers (Delivery / Ride / Field)

---

## 🎯 Product Vision
Saathi acts as a real-time assistant that converts unstructured, real-world inputs into structured, actionable tasks to help gig workers save time, reduce confusion, and increase earnings.

---

## 🔥 Primary Features (STRICT SCOPE)

### 1. Smart Navigation from Unstructured Input

#### Problem
Gig workers receive unclear instructions (voice/text/images) that are hard to interpret and act upon quickly.

#### Goal
Convert messy instructions into optimized navigation actions.

#### Inputs
- Voice input (primary)
- Text input
- Image input (address screenshots, notes)
- Current GPS location

#### Functional Behavior
- Convert input into structured instructions
- Detect route changes or special instructions (e.g., "back gate")
- Generate optimized route based on real-time conditions
- Provide one-tap navigation

#### Output
- Short actionable summary (1 line)
- Step-by-step instructions
- Navigation button
- Optional: call/contact shortcut

#### Success Criteria
- Response time < 2 seconds
- ≥90% accuracy in intent detection for navigation-related inputs

---

### 2. Earnings Optimization Assistant

#### Problem
Gig workers lack clarity on whether a task/order is worth accepting.

#### Goal
Provide real-time decision support to maximize earnings per hour.

#### Inputs
- Current location
- Task/order details (distance, payout)
- Time of day
- Optional voice query: "Should I take this?"

#### Functional Behavior
- Estimate time required for task completion
- Calculate earnings per hour
- Compare with baseline threshold
- Suggest action: Accept / Reject / Relocate

#### Output
- Decision recommendation (Accept / Reject)
- Estimated earnings/hour
- Time estimate
- Suggested relocation (if applicable)

#### Success Criteria
- Decision response time < 2 seconds
- Increase effective earnings/hour (tracked via analytics)

---

### 3. Multilingual Instruction Interpreter

#### Problem
Language barriers cause miscommunication between workers and customers.

#### Goal
Translate and simplify instructions into worker’s preferred language with actionable steps.

#### Inputs
- Voice input (any language)
- Text input
- Image input (notes, instructions)

#### Functional Behavior
- Detect input language
- Translate to preferred language
- Extract actionable steps from translated content
- Provide optional audio playback

#### Output
- Translated summary
- Step-by-step instructions
- Audio playback in target language

#### Success Criteria
- Translation accuracy ≥90% for supported languages
- Response time < 2.5 seconds

---

## 📱 UX Principles
- Voice-first interaction
- Minimal typing required
- One-tap actions
- Large, accessible UI elements
- Color-coded urgency indicators

---

## 🌐 Supported Languages (MVP)
- English
- Hindi
- Kannada
- Tamil
- Telugu

---

## 🚫 Out of Scope (MVP)
- Full automation of task execution
- Deep integrations with gig platforms (initially)
- Offline AI processing (basic fallback only)

---

## 📊 Metrics to Track
- Daily active users
- Average response latency
- Task completion success rate
- User retention (Day 7 / Day 30)

---