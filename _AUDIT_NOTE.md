# Audit Apply Notes — AIDigitalcasemanager

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 1314-1360).

## Original audit recommendations

### Existing AI features (8 endpoints)
ai.js: generate-action-plan, generate-summary, generate-risk-assessment,
summarize-notes, summaries/:beneficiary_id.
aiNew.js: referral-matcher, caseload-analyzer, progress-report.

### Missing AI counterparts
- `beneficiaries.js`, `goals.js`, `referrals.js` lack AI endpoints for risk
  prediction, goal optimization, referral recommendations (note:
  `referral-matcher` exists but is beneficiary-id driven).
- `communications.js` lacks `/generate-communication-plan`.

### Missing non-AI features
- Social-service database integration.
- Eligibility-determination automation.
- Compliance tracking (FERPA, HIPAA).
- Mobile app for field case managers.

### Custom feature suggestions
- Predictive risk escalation.
- Optimal service matching.
- Caseworker workload balancing.
- Goal achievement prediction.
- Early intervention targeting.

## Implemented in this pass (mechanical)

1. `POST /api/ai/predict-risk-escalation` — closes audit gap for stateless
   risk-escalation prediction.
2. `POST /api/ai/recommend-services` — closes audit gap for stateless service
   recommendation (parallel to but distinct from the ID-driven
   `referral-matcher`).

Both stateless, follow the existing `callAI` + `auth` + `aiRateLimiter`
pattern. No DB writes, no schema changes. Verified with `node --check`.

## Backlog (not implemented this pass)

### Mechanical, low-risk
- `/api/ai/generate-communication-plan` — closes audit gap for
  `communications.js`.
- `/api/ai/predict-goal-achievement` — likelihood scoring per goal.
- `/api/ai/balance-caseworker-workload` — recommend reassignments.

### Needs product decision
- Eligibility-determination rules (jurisdiction-specific).
- HIPAA/FERPA compliance posture.

### Needs credentials / external SDK
- Social-service DBs (211 networks, state systems).
- SMS/email channels (Twilio, SendGrid).

### Too risky / large refactor
- Mobile app (frontend constraint).
- Full case-management interoperability (HL7 FHIR).

## Apply pass 3 (frontend)

Verified the React (CRA) frontend already wires the pass-2 endpoints:

- `/ai-new-tools` → `AINewTools.js` exposes "Risk Escalation Predictor" and "Service Recommender" tabs:
  - `predictRiskEscalation: api.post('/ai/predict-risk-escalation', data)`
  - `recommendServices: api.post('/ai/recommend-services', data)`
- `/ai-tools` → `AITools.js` covers existing AI helpers (action plans, summaries, risk assessment).
- `/ai-summaries` → `AISummaries.js` shows persisted AI outputs.

All routed in `frontend/src/App.js`. Backend `routes/ai` and `routes/aiNew` both registered at `/api/ai` in `server.js`. **Action: LEFT-AS-IS — FE already wired.**

## Apply pass 4 (mechanical backlog)

Implemented all 3 mechanical-low-risk backlog items end-to-end (BE + FE).

### Backend — appended to `backend/routes/aiNew.js`
- `POST /api/ai/generate-communication-plan` — outreach plan generator (closes `communications.js` AI gap).
- `POST /api/ai/predict-goal-achievement` — goal-likelihood scoring.
- `POST /api/ai/balance-caseworker-workload` — stateless reassignment recommendations.

Each new endpoint uses `auth` + `aiRateLimiter`, reuses the existing `callAI` helper, and returns **HTTP 503** when `OPENROUTER_API_KEY` is missing. `node --check` passed.

### Frontend — `frontend/src/pages/AINewTools.js`
Added 3 new tabs to the same page using identical card/button styling and shared loading/error state:
- "Communication Plan" → `POST /ai/generate-communication-plan`
- "Goal Achievement Predictor" → `POST /ai/predict-goal-achievement`
- "Workload Balancer" → `POST /ai/balance-caseworker-workload`

JWT bearer via existing `api` axios instance. `handle503` helper surfaces a friendly message on 503. JSX syntax-checked with `@babel/parser`.

### Smoke test (verified)
1. `pkill` existing node servers, restart `backend/server.js` on `BACKEND_PORT=3801`.
2. `POST /api/auth/login` (admin@casemanager.org / password123) → JWT.
3. `POST /api/ai/generate-communication-plan` with valid key → **HTTP 200** with `{"plan": ...}`.
4. Restart with empty `OPENROUTER_API_KEY` → same call → **HTTP 503** with `{"error":"AI service unavailable: OPENROUTER_API_KEY not configured"}`.
5. Cleanup: ports freed.

## Apply pass 5 (all backlog)

Closed all remaining backlog items (PRODUCT-DECISION + NEEDS-CREDS).

### Backend — appended to `backend/routes/aiNew.js`
- `POST /api/ai/eligibility-determination` — PRODUCT-DECISION: advisory-only screening across SNAP / Medicaid / TANF / Section 8 / LIHEAP / WIC; final eligibility must be confirmed by a caseworker.
- `POST /api/ai/compliance-check` — PRODUCT-DECISION: HIPAA + FERPA review of a workflow description (frameworks selectable).
- `POST /api/ai/notify-sms` — NEEDS-CREDS: Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`).
- `POST /api/ai/notify-email` — NEEDS-CREDS: SendGrid (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`).
- `POST /api/ai/service-directory-211` — NEEDS-CREDS: 211 directory (`OPEN211_API_KEY`).

All NEEDS-CREDS endpoints return HTTP 503 with `{"error": "...", "missing": "<ENV_VAR>"}` when the relevant variable is unset. AI endpoints reuse `callAI` + `auth` + `aiRateLimiter`.

### Frontend — `frontend/src/pages/AINewTools.js`
Added 5 new tabs (Eligibility, HIPAA/FERPA Check, SMS, Email, 211 Directory) with the existing card/button styling and shared loading/error state. JWT bearer via existing `api` axios instance. 503s surfaced via `handle503` helper.

### Smoke test (verified)
- `BACKEND_PORT=3801 node server.js` boots cleanly.
- `POST /api/auth/login` (admin@casemanager.org / password123) → JWT.
- `POST /api/ai/notify-sms` (no creds) → HTTP 503 `{"missing":"TWILIO_FROM_NUMBER"}`.
- `POST /api/ai/notify-email` (no creds) → HTTP 503 `{"missing":"SENDGRID_API_KEY"}`.
- `POST /api/ai/service-directory-211` (no creds) → HTTP 503 `{"missing":"OPEN211_API_KEY"}`.

`node --check aiNew.js` passes; `@babel/parser` parses `AINewTools.js` clean.
