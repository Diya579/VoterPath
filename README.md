# VoterPath India: Election Intelligence Platform (2026 Assembly Elections)

## 🗳️ Vertical: Civic Tech & Democratic Engagement
VoterPath India is a technical bridge between election bureaucracy and the electorate. It provides a structured interface for the 2026 Assembly Elections across 5+ states (Tamil Nadu, Kerala, West Bengal, Assam, Puducherry), prioritizing deterministic facts and multi-lingual accessibility.

---

## 🛠️ Approach & Logic

### 1. Deterministic Authority Layer
Unlike standard LLMs that generate probabilistic answers, VoterPath uses a **Dual-Path Architecture**:
- **Authoritative Service**: `eciService.js` acts as the single gateway to a curated election manifest (`electionFacts.json`). This ensures that dates, seat counts, and procedures are retrieved deterministically.
- **Contextual AI**: Gemini 2.0 Flash is used for language translation and natural language understanding, but its responses are programmatically grounded in the facts injected from the Authoritative Service.

### 2. Multi-Modal Verification (OCR + Logic)
The platform uses **Gemini Vision AI (Native JSON Mode)** to extract structured data from Voter IDs. This data is then cross-referenced against the Authoritative Service to resolve constituency-specific polling stations and phases, reducing the risk of model hallucination.

### 3. Accessibility & Native Script Mandate
Recognizing the diverse linguistic landscape, VoterPath enforces a **Native Script Mandate**. The AI is programmatically constrained to respond ONLY in the native script of the selected language (e.g., தமிழ், हिन्दी), ensuring authenticity and trust.

---

## 🚀 Key Features

### A. The Document Extraction Pipeline
- **Vision Engine**: Uses Gemini 2.0 Flash with `responseMimeType: application/json` for reliable, regex-free extraction.
- **Enrichment**: Extracted data is automatically enriched with election schedules and booth locations sourced from the `eciService`.
- **Privacy**: Processing occurs in-memory; PII is never persisted, and raw model logs are sanitized.

### B. Intelligent Booth & Procedure Finder
- **Official Resources**: Deep integration of official ECI video guides and embedded maps for geographic discovery.
- **Step-by-Step Guidance**: Rules-based flows for Form 6 (Registration) and Form 8 (Correction).

---

## 🏗️ Technical Architecture
- **Frontend**: React 19, Tailwind CSS v4, i18next (15 Localized Scripts).
- **Backend**: Node.js/Express with strict CommonJS modules.
- **AI Stack**: Google Gemini 2.0 Flash SDK (Vision & Chat).
- **Security**: Firebase Admin (Token Verification), Helmet (Strict CSP), Zod (Request Validation).

---

## 📝 Documented Rules
1. **Qualifying Date**: January 1, 2026.
2. **Authority**: All facts sourced from `backend/data/electionFacts.json` via `eciService`.
3. **MIME Validation**: Strict allowlisting for JPEG, PNG, and WEBP.

---

## ⚖️ Security & Reliability
- **"Fail-Closed" Auth**: Middleware strictly rejects unauthorized requests in all production-like paths.
- **Adversarial Defense**: Prompt neutralization middleware blocks common injection patterns (e.g., "ignore previous instructions").
- **Error Transparency**: Production-safe error handling prevents stack leakage and provides status-specific feedback.
- **CORS Management**: Environment-driven origin allowlisting via `ALLOWED_ORIGINS`.

---

## 🏆 Production Standards

### 1. Code Quality
- **Manifest Hygiene**: Corrected package entry points and unified SDK surfaces.
- **Logic Unification**: Eliminated logic fragmentation; controllers now rely exclusively on the `eciService` for civic facts.

### 2. Accessibility (A11y)
- **Semantic Structure**: Proper use of ARIA landmarks (`main`, `log`, `status`), skip links, and semantic headers.
- **Keyboard Navigation**: Implemented logical focus order and keyboard support for all interactive zones.

### 3. Testing
- **Multi-layered Verification**: Jest (Backend) and Vitest (Frontend) suites covering integration, accessibility, and adversarial scenarios.
