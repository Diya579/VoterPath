# VoterPath India: Election Intelligence Platform (2026 Assembly Elections)

## 🗳️ Vertical: Civic Tech & Democratic Engagement
VoterPath India is an advanced civic engagement platform designed to bridge the gap between complex election bureaucracy and the diverse Indian electorate. It provides a structured interface for the 2026 Assembly Elections across 5+ states (Tamil Nadu, Kerala, West Bengal, Assam, Puducherry), prioritizing data integrity and authoritative guidance.

---

## 🛠️ Approach & Logic

### 1. "Native Script First" Localization
Recognizing that election accessibility is a language problem, VoterPath implements a **Native Script Mandate**. Our AI engine (powered by Google Gemini 2.0 Flash) is constrained to respond in the authentic script of the selected language (e.g., ગુજરાતી, தமிழ், हिन्दी), ensuring trust and readability for local voters.

### 2. Multi-Modal Identity Verification
The platform treats the Voter ID card (EPIC) as the primary data key. By combining **OCR (Vision AI)** with contextual logic, we facilitate the discovery of a voter's polling station and election phase. The system parses document structure to extract relevant civic identifiers for localized guidance.

### 3. Source-of-Truth Architecture
Unlike standard LLMs, the VoterPath Expert is domain-locked and backed by a **Dedicated ECI Data Service**. This service serves as the single source of truth for all election dates, qualifying rules, and procedural guidelines, ensuring that AI responses are grounded in verifiable civic facts rather than probabilistic guesses.

---

## 🚀 How the Solution Works

### A. The AI Document Pipeline
- **Scanner**: A multi-stage Vision pipeline extracts PII and Polling Station data from uploaded EPIC cards or e-EPIC PDFs.
- **Logic Engine**: The backend maps the extracted constituency to an authoritative election schedule (2026 Assembly dates) provided by the `eciService`.
- **Privacy Hygiene**: PII is processed in-memory for extraction only and is never persisted. Raw model outputs are stripped to protect privacy.

### B. Intelligent Booth Finder
- **Geographic Mapping**: Uses embedded maps and distance-aware logic to guide voters to their specific constituency booths.
- **Official Procedures**: Provides direct links and step-by-step guidance for voter registration (Form 6) and corrections (Form 8).

### C. Domain-Locked AI Expert
- **Strict Constraints**: The assistant is programmatically restricted from off-topic queries. It utilizes the current ECI qualifying date (Jan 1, 2026) and official schedules injected via system instructions to provide accurate eligibility and procedural advice.

---

## 🏗️ Technical Architecture
- **Frontend**: React 19, Tailwind CSS v4, Framer Motion, i18next (15 Localized Scripts).
- **Backend**: Node.js/Express (CommonJS).
- **AI Engines**: 
  - **OCR/Vision**: Google Gemini 2.0 Flash SDK.
  - **Chat/Guidance**: Google Gemini 2.0 Flash SDK (with history support).
- **Infrastructure**: Firebase Admin (Auth Verification), Firestore (Booth Data), Multi-stage Sanitization Middleware.

---

## 📝 Documented Constants & Rules
1. **Qualifying Date**: Verified as **January 1, 2026** for the 2026 cycle.
2. **Authoritative Source**: All election facts are sourced via `backend/services/eciService.js` (Simulated ECI API).
3. **MIME Validation**: Strict allowlisting for JPEG, PNG, and WEBP image uploads.

---

## ⚖️ Compliance & Security
- **Fail-Closed Auth**: Authentication middleware strictly rejects unauthorized requests in production.
- **Sanitization**: Robust multi-stage sanitization strips script tags and prompt-injection keywords.
- **Production CSP**: Hardened Content Security Policy removes `unsafe-inline` concessions.

---

## 🏆 Production-Grade Rigor

### 1. Code Quality
- **Standardized Documentation**: Core functions documented using JSDoc.
- **Type Safety**: Enabled via `jsconfig.json` with strict type checking in both frontend and backend.
- **Manifest Hygiene**: Corrected package entry points and dependency versioning.

### 2. Security
- **Backend Hardening**: Helmet.js (modern headers), Express-Rate-Limit (DDoS protection), and Zod (schema validation).
- **Audit Compliance**: Resolved fragile pathing, obsolete headers (xssFilter), and insecure dev-bypass logic.

### 3. Testing
- **Automated Verification**: Integrated Jest (Backend) and Vitest (Frontend) test suites.
- **Continuous Integration**: GitHub Actions workflow validates code integrity on every deployment.

### 4. Accessibility (A11y)
- **High Contrast**: Native support for WCAG-compliant high-contrast themes.
- **Semantic HTML**: Proper use of ARIA roles (`region`, `article`, `section`), `dl/dt/dd` lists, and skip links.

### 5. Google Services Integration
- **Gemini SDK**: Native integration with `@google/generative-ai` for both Vision and Text.
- **Firebase**: Secure token verification via Firebase Admin and Firestore-backed regional data.
- **YouTube & Maps**: Deep integration for procedural videos and geographic booth discovery.

