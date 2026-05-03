# VoterPath India: Election Guidance Platform (2026 Assembly Elections)

## 🗳️ Vertical: Civic Tech & Democratic Engagement
VoterPath India is a technical bridge between election procedures and the electorate. It provides a structured interface for the 2026 Assembly Elections across 5+ states (Tamil Nadu, Kerala, West Bengal, Assam, Puducherry), prioritizing **Manifest-Grounded Facts** and multi-lingual accessibility.

---

## 🛠️ Approach & Logic

### 1. Manifest-Grounded Architecture
Unlike standard LLMs that generate probabilistic answers, VoterPath uses a **Two-Tier Truth Model**:
- **Grounded Fact Service**: `eciService.js` provides exact-match deterministic resolution from a **cryptographically signed local manifest** (`electionFacts.json`). This ensures that dates, seat counts, and procedures are retrieved from a curated, verified dataset.
- **Contextual AI Explainer**: Gemini 2.0 Flash is used for language translation and simplifying complex procedures, but its reasoning is constrained by a **Pre-AI Intent Router** that injects resolved facts into the model context.

### 2. Multi-Modal Verification (OCR + Semantic Logic)
The platform uses **Gemini Vision AI (Native JSON Mode)** for structural extraction from Voter IDs. This data undergoes a **Semantic Validation Layer** to verify EPIC formats and cross-reference region data against the signed manifest before enrichment.

### 3. Native Script Mandate
VoterPath enforces a **Native Script Mandate**. The AI is programmatically constrained to respond ONLY in the native script of the selected language (e.g., தமிழ், हिन्दी), ensuring linguistic authenticity.

---

## 🚀 Key Features

### A. Grounded Document Extraction
- **Vision Engine**: Uses Gemini 2.0 Flash with `responseMimeType: application/json` for reliable extraction.
- **Semantic Validation**: Extracted data is cross-referenced against the `eciService` manifest.
- **Privacy**: Processing occurs in-memory; PII is never persisted.

### B. Deterministic Fact API (v1)
A rule-based REST API provides non-LLM access to core election data:
- `GET /api/v1/facts/eligibility`: Rule-based eligibility criteria.
- `GET /api/v1/facts/schedules`: Deterministic election dates by state.
- `GET /api/v1/facts/steps`: Static registration and correction procedures.

---

## 🏗️ Technical Architecture
- **Frontend**: React 19, Tailwind CSS v4, i18next (15 Localized Scripts).
- **Backend**: Node.js/Express, CommonJS (Standard Formatting).
- **Security**: 
  - **Hardened Auth**: Strict fail-closed middleware with 100% token verification.
  - **Manifest Integrity**: RSA-SHA256 signature verification with public-key fingerprint pinning.
  - **Payload Defense**: Magic-number validation for image uploads.

---

## 📝 Grounding Rules
1. **Qualifying Date**: January 1, 2026.
2. **Fact Source**: Curated manifest (`electionFacts.json`) verified via `trusted_registry.json`.
3. **MIME Validation**: Strict magic-number checking for JPEG, PNG, and WEBP.

---

## ⚖️ Security & Reliability (Fail-Closed)
- **Zero-Trust Auth**: All routes require a valid Firebase ID Token. No bypasses exist in the production runtime.
- **Deterministic Fallback**: High-availability pipeline with automatic fallback to Groq Llama 3.3 for explanatory text, using the same pre-resolved fact packets as Gemini.
- **Error Differentiating**: Distinct handling for 401 (Auth), 422 (Extraction Failure), 503 (Service Busy), and 500 (Internal).

---

## 🏆 Quality Standards

### 1. Truthful Provenance
The platform clearly labels all data sources. Matches found in the signed manifest are labeled as `MANIFEST_EXACT_MATCH`, while AI-only extractions are marked as `EXTRACTION_ONLY`.

### 2. Accessibility
- **WCAG 2.1 Focus**: Screen-reader landmarks, ARIA live regions for status updates, and full keyboard focus traps.
- **Language Coverage**: 15+ Indian languages supported with native script rendering.

### 3. Testing
- **Security Suite**: `backend/tests/security.test.js` (Auth, MIME, DoS).
- **API Suite**: `backend/tests/api.test.js` (Schema, Fallback).
- **Fact Suite**: `backend/tests/eciService.test.js` (Signature, Hash, Expiry).
