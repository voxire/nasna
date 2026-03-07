# Nasna v2.0 — Status & Implementation Plan

> Cross-reference of `NASNA_V2_TECH_SPEC.md` and `NASNA_V2_IDEATION.md` against the current codebase.
> Last updated: March 2026

---

## Summary

| Phase | What | Status |
|-------|------|--------|
| **Phase 0** | Critical Bug Fixes | ✅ Done |
| **Phase 1** | Dispatch Engine + Emergency Contacts | ✅ Done — ⚠️ Email delivery not wired |
| **Phase 2** | Housing Marketplace | ✅ Done |
| **Phase 3** | WhatsApp Bot | ❌ Not started |
| **Phase 4** | Impact Dashboard + Donations | ✅ Done |
| **Phase 5** | Operations Map | ✅ Done |
| **Cross-cutting** | i18n / UI bugs (from manual test) | ❌ 11 bugs pending fix |

---

## Phase 0 — Critical Bug Fixes

| Fix | Spec requirement | Status |
|-----|-----------------|--------|
| Fix 1: Pagination on all tables | `usePaginatedQuery` hook, replace `getDocs` with `limit()` | ✅ `usePaginatedQuery.ts` exists; `AdminSubmissions.tsx`, `Members.tsx`, `AgentSubmissions.tsx` all use it |
| Fix 2: `needs` / `specialNeeds` UI | Checkbox grid + chip input on `CreateSubmission` | ✅ `AidTypeCheckboxGrid` component built; wired into `CreateSubmission.tsx` |
| Fix 3: `consentGiven` defaults to `false` | Must default `false`, require explicit check | ✅ `consentGiven: false` in form defaults; `z.literal(true)` validation enforces it |
| Fix 4: `ageRanges` broken in admin edit | Render as number inputs keyed by age group | ✅ `AdminSubmissions.tsx` uses `ageRanges: Record<string, number>` in edit state |
| Fix 5: Phone dedup security hole | Move to Cloud Function, no raw DB read by unauthenticated users | ✅ `checkSubmissionDuplicates` Cloud Function exported from `functions/src/index.ts` |
| Fix 6: Replace `getDocs` with `onSnapshot` | Live listeners everywhere | ✅ `Dashboard.tsx`, `AgentSubmissions.tsx` use `onSnapshot`; admin tables use `usePaginatedQuery` |

**Phase 0: COMPLETE ✅**

---

## Phase 1 — Dispatch Engine + Emergency Contacts

### Frontend Screens

| Screen | Route | Status |
|--------|-------|--------|
| `DispatchCenter` | `/manage/dispatch` | ✅ Built |
| `EmergencyContactsManagement` | `/manage/emergency` | ✅ Built |
| `CaseDetail` | `/ngo/cases/:caseId` | ✅ Built |
| `Submissions` (NGO case feed) | `/ngo/submissions` | ✅ Built |
| `MyCases` | `/ngo/my-cases` | ✅ Built |
| `ProfileCoverage` | `/ngo/profile-coverage` | ✅ Built |

### Shared Components

| Component | Status |
|-----------|--------|
| `CaseStatusBadge` | ✅ Built |
| `CaseTimeline` | ✅ Built |
| `AidDeliveryForm` | ✅ Built |
| `AidTypeCheckboxGrid` | ✅ Built |

### Cloud Functions

| Function | Status |
|----------|--------|
| `onNewSubmission` — match + notify NGOs | ✅ Written in `dispatchEngine.ts` |
| `onCaseAssigned` — notify displaced person | ✅ Written in `dispatchEngine.ts` |
| `onCaseCompleted` — decrement caseload + update stats | ✅ Written in `dispatchEngine.ts` |
| `dailyStaleCaseCheck` — flag 24h+ stale cases | ✅ Written in `dispatchEngine.ts` |

### ⚠️ Gap: Email delivery not actually wired up

The dispatch engine writes notification records to Firestore (`channel: 'email'`) but **does not send actual emails**. There is no `@sendgrid/mail` import anywhere in the functions codebase. The architecture is correct — it just needs the SendGrid integration added.

**What needs to be done:**
1. Add `@sendgrid/mail` to `functions/package.json`
2. Set `SENDGRID_API_KEY` and `ADMIN_EMAIL` in Firebase Functions environment config
3. In `dispatchEngine.ts`, after writing the notification record, add the `sgMail.send()` call for:
   - `onNewSubmission` → email matched NGOs with case summary (no PII, just area + needs)
   - `dailyStaleCaseCheck` → email admin with list of stale case IDs

**Phase 1: MOSTLY COMPLETE — Email delivery is missing ⚠️**

---

## Phase 2 — Housing Marketplace

### Frontend Screens

| Screen | Route | Status |
|--------|-------|--------|
| `CenterManagement` | `/manage/centers` | ✅ Built |
| `HousingReview` | `/manage/housing` | ✅ Built |
| `Housing` (public directory) | `/housing` | ✅ Built |
| `OfferHousing` (public form) | `/offer-housing` | ✅ Built |

### Shared Components

| Component | Status |
|-----------|--------|
| `CenterPicker` | ✅ Built |
| `CapacityBar` | ✅ Built |
| `HousingCard` | ✅ Built |

### `CreateSubmission` — `locationType` redesign

| Item | Status |
|------|--------|
| `locationType` toggle (`with_family` / `center`) | ✅ Built |
| `CenterPicker` wired into form | ✅ Built |
| Conditional validation (`centerId` required when `locationType === 'center'`) | ✅ Built |

### Data Models

| Collection | Status |
|-----------|--------|
| `centers` — `CenterDocument` type | ✅ Defined in `src/types/index.ts` |
| `housing` — `HousingDocument` type | ✅ Defined in `src/types/index.ts` |

### Cloud Function Hooks

| Function | Status |
|----------|--------|
| `onHousingStatsChanged` — keeps global housing count live | ✅ Written in `dispatchEngine.ts` |

**Phase 2: COMPLETE ✅**

---

## Phase 3 — WhatsApp Bot

> ❌ **This phase has not been started.** No Twilio integration, no bot functions, no `wa_sessions` collection handling exists anywhere in the codebase.

### What needs to be built

**1. Twilio / WhatsApp Business setup (external, non-code)**
- Create Twilio account and activate WhatsApp Business Sandbox or production number
- Configure webhook URL to point to the `whatsappWebhook` Cloud Function
- Store credentials: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` in Firebase Functions config

**2. `wa_sessions` Firestore collection**
- Schema: `{ phone, step, data: { name?, area?, householdSize?, mainNeed? }, language, createdAt, updatedAt }`
- Firestore rule: **Cloud Functions service account only** — no client access

**3. `whatsappWebhook` Cloud Function**

File: `functions/src/whatsappWebhook.ts`

Steps to implement:
- HTTP `onRequest` endpoint — receives POST from Twilio webhook
- Parse `From` (phone), `Body` (message) from Twilio payload
- Load or create session from `wa_sessions/{phone}`
- State machine:
  - **`new`** → Reply: "Welcome. Type 1 to register, Type 2 to check case status." (Arabic)
  - **`awaiting_name`** → Save name, ask for area/governorate
  - **`awaiting_area`** → Save area, ask for household size
  - **`awaiting_household`** → Save size, ask for main need (food / shelter / medical / other)
  - **`awaiting_need`** → Save need, write submission to Firestore (`source: 'whatsapp'`), reply with case ID
  - **`status_check`** → User types case ID → query by `whatsappPhone` → return status string
- Language: default Arabic; detect if user types `EN` or `FR` and switch

**4. `onCaseAssigned` WhatsApp notification**

Currently `onCaseAssigned` in `dispatchEngine.ts` writes a notification to Firestore but does not send a WhatsApp message. Add Twilio `client.messages.create()` to send: *"Your case (#ID) has been assigned. [NGO Name] will contact you."*

**5. QR codes**
- Generate static QR codes pointing to `https://wa.me/[TWILIO_NUMBER]` for posting at centers
- These are static assets — generate once, store in `public/` or Firebase Storage

**Estimated: 3–4 weeks**

**Phase 3: NOT STARTED ❌**

---

## Phase 4 — Impact Dashboard + Donations

### Frontend Screens

| Screen | Route | Status |
|--------|-------|--------|
| `ImpactDashboard` (admin) | `/manage/impact` | ✅ Built |
| `Impact` (public) | `/impact` | ✅ Built |
| `Donate` (public) | `/donate` | ✅ Built |

### Data Models

| Collection | Status |
|-----------|--------|
| `GlobalStatsDocument` type | ✅ Defined in `src/types/index.ts` |
| `DonationDocument` type | ✅ Defined in `src/types/index.ts` |

### Cloud Functions

| Function | Status |
|----------|--------|
| `nightlyGlobalStatsRebuild` | ✅ Written in `dispatchEngine.ts` |
| `createDonationCheckoutSession` (Stripe) | ✅ Written in `functions/src/payments.ts` |
| `onMemberStatsChanged` | ✅ Written in `dispatchEngine.ts` |

**Phase 4: COMPLETE ✅**

---

## Phase 5 — Operations Map

### Frontend Screen

| Screen | Route | Status |
|--------|-------|--------|
| `OperationsMap` | `/manage/operations-map` | ✅ Built |

### Cloud Function / Service

| Item | Status |
|------|--------|
| `getOperationsMapData` Cloud Function | ✅ Built in `functions/src/operationsMapApi.ts` |
| `operationsMap.ts` frontend service | ✅ Built in `src/services/operationsMap.ts` |

**Phase 5: COMPLETE ✅**

---

## Outstanding Issues — Cross-Cutting

These are separate from the phase work but must be resolved before launch.

### i18n / UI Bugs (from manual browser testing)

| # | Page | Bug | Priority |
|---|------|-----|----------|
| 1 | `/submit` | "Current living situation" label + dropdown options in English | MEDIUM |
| 3 | `/emergency` | Entire page rendered in English | CRITICAL |
| 4 | `/about` | Body text all English (headings Arabic) + wrong CTA button label | HIGH |
| 5 | `/terms` | Page is completely blank — no content at all | CRITICAL |
| 7 | `/404` | "NotFound" and "Go Back" text in English | LOW |
| 8 | `/auth/login` | "OR" divider between login and Google sign-in in English | MEDIUM |
| 9 | `/auth/agent` | Entire agent registration page in English | CRITICAL |
| 10 | `/auth/login` | "Close" button on forgot-password modal in English | LOW |

### Security / UX Bugs

| # | Issue | Priority |
|---|-------|----------|
| 11 | Admin layout redirects to `/` instead of `/auth/login` when unauthenticated | MEDIUM |
| 2 | `/offer-housing` — no validation error feedback on empty submit | MEDIUM |
| 6 | `/login` returns 404 (correct URL is `/auth/login`) — no redirect | MEDIUM |

### Tech Debt

| Item | File |
|------|------|
| `enableIndexedDbPersistence()` deprecated — fires 30× per page load — migrate to `FirestoreSettings.cache` | `src/firebase.ts` |

---

## Recommended Next Steps (in order)

### 1. Fix the 11 bugs now (1–2 days)
These are all in the existing codebase. Most are i18n keys missing from locale files and a few component-level fixes. A single Claude Code session can knock all of them out. The test report at `docs/MANUAL_TEST_REPORT.md` has a ready-to-paste prompt.

### 2. Wire up SendGrid email (0.5 days)
- Install `@sendgrid/mail` in `functions/package.json`
- Add `sgMail.send()` calls inside `onNewSubmission` (to matched NGOs) and `dailyStaleCaseCheck` (to admin)
- Set env vars in Firebase Functions config
- This completes Phase 1 fully

### 3. Complete and test Phase 3 — WhatsApp Bot (3–4 weeks)
This is the only phase with zero work done. It's also the most impactful for the displaced people the platform serves — it removes the dependency on having a field agent available. Build order:
1. `wa_sessions` Firestore collection + security rules
2. `whatsappWebhook` Cloud Function (state machine)
3. Bot responses in Arabic, English, French
4. Wire WhatsApp notification into `onCaseAssigned`
5. Generate and deploy QR codes for centers

### 4. End-to-end testing of authenticated screens
Sections 3–5 of the `TESTING_PLAN.md` (Agent, NGO, Admin dashboards) have not been manually tested yet. Create Firebase test accounts and run through all flows.

### 5. Fix Firestore deprecation warning
Migrate `enableIndexedDbPersistence()` to the new `FirestoreSettings.cache` API. Low effort, removes console noise.

---

*Nasna Team — Generated March 2026*
