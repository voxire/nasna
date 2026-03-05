# ⚙️ Nasna 2.0 — Technical Specification

> **Audience:** Developers
> **Purpose:** Full specification for the Nasna v2.0 upgrade — data models, component structure, Cloud Functions, security rules, and phased implementation plan.

---

## Table of Contents

1. [Overview & Stack](#1-overview--stack)
2. [Phase 0 — Critical Bug Fixes](#2-phase-0--critical-bug-fixes)
3. [New Data Models](#3-new-data-models)
4. [Component & Screen Structure](#4-component--screen-structure)
5. [Firebase Cloud Functions](#5-firebase-cloud-functions)
6. [Implementation Phases](#6-implementation-phases)
7. [Security & Firestore Rules](#7-security--firestore-rules)
8. [New Dependencies](#8-new-dependencies)
9. [Offline Support for Agents](#9-offline-support-for-agents)

---

## 1. Overview & Stack

Nasna is a multi-sided humanitarian aid coordination platform. v2 extends the existing codebase with a matching engine, housing marketplace, WhatsApp bot, and live operations tooling.

### Current Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 + TypeScript 5.9 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Backend | Firebase (Firestore, Auth, Hosting) |
| State | Redux Toolkit + redux-persist |
| i18n | i18next — Arabic, English, French |
| Maps | react-leaflet (Leaflet 1.9) |
| CI/CD | GitHub Actions → Firebase Hosting |
| **New (v2)** | **Firebase Cloud Functions + WhatsApp Business API (Twilio/360dialog)** |

### User Types

| Role | Description |
|------|-------------|
| **Admin** | Full platform control, dispatch management, data oversight |
| **Member (NGO)** | Validated organizations that claim and fulfill cases |
| **Agent** | Field workers who register displaced families |
| **Public** | Anonymous visitors — offer help, housing, view emergency resources |
| **Displaced Person** | Interacts via WhatsApp bot (no account required) |

---

## 2. Phase 0 — Critical Bug Fixes

> ⚠️ **All fixes below are required before any new feature work begins.** Deploying new features on top of these issues creates compounding technical debt.

---

### Fix 1 — Pagination on All Data Tables

**Affected files:** `AdminSubmissions.tsx`, `Members.tsx`, `Agents.tsx`

**Problem:** All three screens call `getDocs()` on entire collections with no limit. At 500+ records Firestore will timeout and the admin panel becomes unusable during peak crisis usage.

**Fix:** Replace `getDocs()` with cursor-based Firestore pagination. Implement a shared `usePaginatedQuery` hook.

```ts
// ❌ Before
getDocs(collection(db, 'submissions'))

// ✅ After
query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(25))
// Use startAfter(lastDoc) for next page
```

---

### Fix 2 — `needs` and `specialNeeds` Have No UI

**Affected file:** `CreateSubmission.tsx`

**Problem:** `needs[]` and `specialNeeds[]` default to empty arrays with no UI. Every submission in the database has blank needs arrays — the most important operational data field is missing entirely.

**Fix:** Add a two-section checkbox grid to the submission form.

- **`needs` enum values:** `food` `water` `shelter` `medical` `clothing` `baby_supplies` `psychosocial` `legal_docs`
- **`specialNeeds`:** free-text chip input for conditions (wheelchair, chronic medication, pregnancy, elderly, infant, etc.)

---

### Fix 3 — `consentGiven` Defaults to `true`

**Affected file:** `CreateSubmission.tsx` line 48

**Problem:** `consentGiven: true` in `defaultFormData` pre-checks consent, making it meaningless as a privacy control.

**Fix:** Change default to `false`. Add `required` validation so the form cannot be submitted without the agent explicitly checking it.

---

### Fix 4 — AgeRanges Broken in Admin Edit

**Affected file:** `AdminSubmissions.tsx`

**Problem:** `ageRanges` is stored in Firestore as `{ '0-3': 0, '4-12': 0, ... }` but the edit dialog renders it as `string[]`, corrupting the field on any admin save.

**Fix:** Render `ageRanges` as individual number inputs keyed by age group in the edit modal, matching the pattern in `CreateSubmission.tsx`.

---

### Fix 5 — Phone Deduplication Security Hole

**Affected file:** `firestore.rules`

**Problem:** A comment in the rules acknowledges that unauthenticated users have read access to submissions to check for duplicate phone numbers. This exposes the entire displaced persons database to any internet user.

**Fix:** Remove the unauthenticated read rule. Move the check to a Cloud Function:

```ts
exports.checkDuplicatePhone = onCall(async (data) => {
  const { phone } = data;
  const q = query(collection(db, 'submissions'), where('phoneNumber', '==', phone));
  const snap = await getDocs(q);
  return { isDuplicate: !snap.empty, existingCount: snap.size };
});
// Returns { isDuplicate: boolean } only — no raw submission data exposed
```

---

### Fix 6 — Replace `getDocs` with `onSnapshot`

**Affected files:** `Dashboard.tsx`, `AdminSubmissions.tsx`, `AgentSubmissions.tsx`, `Members.tsx`

**Problem:** All data fetches use `getDocs()` which fires once and stales. Admin sees outdated data until manual page refresh — operationally dangerous during an active crisis.

**Fix:** Replace with `onSnapshot` listeners in all dashboard and list views. Use `useEffect` cleanup to unsubscribe on unmount.

---

## 3. New Data Models

> All existing fields are preserved. Fields marked **Required** must pass validation at both the client (Zod) and Firestore rules level.

---

### 3.1 Updated: `submissions`

New fields added to existing collection:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `status` | `string` | `"pending"` \| `"assigned"` \| `"in_progress"` \| `"completed"` \| `"cancelled"` | ✅ |
| `locationType` | `string` | `"center"` \| `"with_family"` | ✅ |
| `centerId` | `string` | Ref to `centers` collection. Only when `locationType === "center"` | — |
| `assignedTo` | `string` | Member UID of the NGO assigned to this case | — |
| `assignedAt` | `Timestamp` | When the case was assigned | — |
| `aidDelivered` | `array` | `{ type, date: Timestamp, deliveredBy, notes }[]` | — |
| `lastUpdatedBy` | `string` | UID of last user to update the record | — |
| `staleFlagged` | `boolean` | `true` if assigned 48h+ with no update | — |
| `source` | `string` | `"web"` \| `"whatsapp"` | ✅ |
| `whatsappPhone` | `string` | Phone used for WhatsApp registration | — |
| `needs` | `string[]` | `food \| water \| shelter \| medical \| clothing \| baby_supplies \| psychosocial \| legal_docs` | ✅ |
| `specialNeeds` | `string[]` | Freeform special conditions | — |

---

### 3.2 Updated: `members`

New fields added to existing collection:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `coverageType` | `string` | `"area"` \| `"centers"` \| `"both"` | ✅ |
| `coverageGovernorates` | `string[]` | Lebanese governorates covered | — |
| `coverageCenterIds` | `string[]` | IDs of displacement centers served | — |
| `aidTypes` | `string[]` | What this NGO provides (same enum as `needs`) | ✅ |
| `currentCaseLoad` | `number` | Active assigned cases (auto-maintained by Cloud Functions) | — |
| `maxCaseLoad` | `number` | Self-reported max simultaneous cases. `0` = unlimited | — |
| `deliveryMode` | `string` | `"in_person"` \| `"remote"` \| `"both"` | ✅ |

---

### 3.3 New Collection: `centers`

Admin-managed list of official displacement centers.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | `string` | Full official name e.g. `"Rafiq Hariri University — Beirut"` | ✅ |
| `type` | `string` | `"school"` \| `"university"` \| `"community_hall"` \| `"sports_facility"` \| `"other"` | ✅ |
| `governorate` | `string` | Lebanese governorate | ✅ |
| `district` | `string` | Sub-district or municipality | — |
| `address` | `string` | Street address | — |
| `coordinates` | `GeoPoint` | Lat/lng for map display | — |
| `totalCapacity` | `number` | Maximum people the center can host | ✅ |
| `currentOccupancy` | `number` | Current registered occupancy | ✅ |
| `facilities` | `string[]` | `generator \| water \| kitchen \| medical_room \| bathrooms \| internet` | — |
| `managerName` | `string` | Contact person at the center | — |
| `managerPhone` | `string` | Contact phone for center manager | — |
| `isActive` | `boolean` | Whether the center is open and accepting people | ✅ |
| `createdBy` | `string` | Admin UID | ✅ |
| `updatedAt` | `Timestamp` | Last modification timestamp | ✅ |

---

### 3.4 New Collection: `housing`

Listings by individuals or organizations offering housing.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `listerId` | `string` | UID of creator (`"anonymous"` for public) | ✅ |
| `listerName` | `string` | Name of person/org offering the space | ✅ |
| `listerPhone` | `string` | WhatsApp-preferred contact number | ✅ |
| `type` | `string` | `"apartment"` \| `"room"` \| `"house"` \| `"floor"` | ✅ |
| `governorate` | `string` | Lebanese governorate | ✅ |
| `district` | `string` | Town or municipality | — |
| `capacity` | `number` | Max number of people accommodated | ✅ |
| `priceType` | `string` | `"free"` \| `"subsidized"` \| `"market_rate"` | ✅ |
| `pricePerMonth` | `number` | Monthly price in USD. `0` for free | — |
| `availableFrom` | `Timestamp` | Date space becomes available | ✅ |
| `availableUntil` | `Timestamp` | Date availability ends (`null` = indefinite) | — |
| `amenities` | `string[]` | `generator \| water \| internet \| washing_machine \| furnished \| private_bathroom` | — |
| `description` | `string` | Free-text description by lister | — |
| `status` | `string` | `"pending_review"` \| `"available"` \| `"reserved"` \| `"filled"` | ✅ |
| `approvedBy` | `string` | Admin UID who approved listing | — |
| `createdAt` | `Timestamp` | Submission timestamp | ✅ |

---

### 3.5 New Collection: `emergencyContacts`

Admin-managed directory of emergency contacts and hotlines.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | `string` | Organization or service name | ✅ |
| `category` | `string` | `"government"` \| `"health"` \| `"ngo"` \| `"security"` \| `"legal"` \| `"utilities"` | ✅ |
| `phone` | `string` | Primary phone number | ✅ |
| `phoneAlt` | `string` | Secondary/WhatsApp number | — |
| `scope` | `string` | `"national"` or specific governorate name | ✅ |
| `description` | `string` | What this contact can help with | ✅ |
| `isVerified` | `boolean` | Admin confirmed number is currently active | ✅ |
| `lastVerifiedAt` | `Timestamp` | When admin last confirmed it works | — |
| `order` | `number` | Display sort order within category | — |

---

### 3.6 New Collection: `notifications`

Tracks all outbound notifications for audit and deduplication.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `recipientUid` | `string` | UID of recipient or phone number for WhatsApp | ✅ |
| `type` | `string` | `"new_case_match"` \| `"case_assigned"` \| `"stale_case_alert"` \| `"wa_status_update"` | ✅ |
| `channel` | `string` | `"email"` \| `"whatsapp"` \| `"push"` | ✅ |
| `submissionId` | `string` | Related submission ID | — |
| `sentAt` | `Timestamp` | When notification was dispatched | ✅ |
| `status` | `string` | `"sent"` \| `"delivered"` \| `"failed"` | ✅ |

---

## 4. Component & Screen Structure

### 4.1 New Admin Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| `DispatchCenter` | `/admin/dispatch` | Main ops hub — pending cases with NGO matching suggestions and one-click assignment |
| `CenterManagement` | `/admin/centers` | CRUD for displacement centers with real-time occupancy |
| `HousingReview` | `/admin/housing` | Approve/reject housing listings submitted by public |
| `EmergencyContacts` | `/admin/emergency-contacts` | CRUD for emergency contacts directory |
| `OperationsMap` | `/admin/map` | Leaflet map with submission pins, NGO zones, center markers |
| `ImpactDashboard` | `/admin/impact` | Real-time stats, charts, CSV export |

### 4.2 New Member (NGO) Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| `CaseFeed` | `/member/cases` | Live feed of cases matching NGO coverage area and aid types |
| `CaseDetail` | `/member/cases/:id` | Full case info, claim button, timeline, aid delivery recording |
| `MyCases` | `/member/my-cases` | Cases claimed by this NGO with status management |
| `ProfileCoverage` | `/member/profile` | Edit coverage areas, centers, aid types, capacity |

### 4.3 New Agent Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| `CreateSubmission` (v2) | `/agent/submit` | Redesigned form: `locationType` toggle, center picker, needs checkboxes, offline support |
| `SubmissionDetail` | `/agent/submissions/:id` | Full case view with current status and timeline |

### 4.4 New Public Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| `EmergencyContacts` | `/emergency` | Public emergency directory — no login, filterable by category/area |
| `HousingDirectory` | `/housing` | Browse approved housing listings, filter by area/capacity/price |
| `OfferHousing` | `/offer-housing` | Public form to list a spare room or apartment |
| `ImpactPage` | `/impact` | Public-facing live stats and displacement heatmap |

### 4.5 Shared Components

| Component | Description |
|-----------|-------------|
| `CaseStatusBadge` | Colored chip: Pending / Assigned / In Progress / Completed |
| `AidTypeCheckboxGrid` | Reusable needs selection grid for `CreateSubmission` and `ProfileCoverage` |
| `CenterPicker` | Searchable dropdown from `centers` collection, grouped by governorate |
| `AidDeliveryForm` | Inline form for NGOs to record what was delivered (type, date, notes) |
| `CaseTimeline` | Vertical timeline of all status changes and aid delivery events |
| `CapacityBar` | Visual bar showing occupancy % for displacement centers |
| `HousingCard` | Listing card with availability badge, capacity, price type, WhatsApp CTA |
| `usePaginatedQuery` | Custom hook wrapping Firestore cursor pagination + `onSnapshot` |

---

## 5. Firebase Cloud Functions

> All functions written in TypeScript using Firebase Functions v2. Deployed to the same Firebase project as the frontend.

---

### 5.1 `onNewSubmission`

**Trigger:** `onCreate` — `/submissions/{submissionId}`

When a new submission is created, find all matching NGOs and notify them.

| Step | Action |
|------|--------|
| 1 | Read `submission.locationType`, `centerId`, `currentGovernorate`, `needs[]` |
| 2 | Query `members` where `validated === true` AND `coverageGovernorates` contains governorate OR `coverageCenterIds` contains `centerId` |
| 3 | Filter: `aidTypes` must intersect with `submission.needs`. Filter out NGOs at `maxCaseLoad` |
| 4 | For each matched NGO: create notification record, send email via SendGrid with case summary **(no PII — only urgency, governorate, needs)** |
| 5 | If zero NGOs matched: create admin alert notification |

---

### 5.2 `onCaseAssigned`

**Trigger:** `onUpdate` — where `new.status === "assigned"` and `old.status !== "assigned"`

| Step | Action |
|------|--------|
| 1 | Read `submission.phoneNumber` (or `whatsappPhone` if `source === "whatsapp"`) |
| 2 | Send WhatsApp via Twilio: *"Your case (#ID) has been assigned. [NGO Name] will contact you."* |
| 3 | Increment `member.currentCaseLoad` by 1 using `increment()` |
| 4 | Write notification record |

---

### 5.3 `dailyStaleCaseCheck` — Scheduled

**Trigger:** Cloud Scheduler — every day at 08:00 UTC

| Step | Action |
|------|--------|
| 1 | Query submissions where `status === "assigned"` AND `assignedAt < (now − 48h)` |
| 2 | Set `staleFlagged = true` on each |
| 3 | Email admin with list of stale case IDs |
| 4 | WhatsApp reminder to assigned NGO: *"Case #ID has had no update in 48 hours. Please update the status."* |

---

### 5.4 `whatsappWebhook` — Self-Registration Bot

**Trigger:** HTTP `onRequest` — receives POST from Twilio on incoming WhatsApp message

Session state stored in `/wa_sessions/{phone}`.

| State | Bot behavior |
|-------|-------------|
| **New user** | *"Welcome to Nasna. Reply 1 to register, Reply 2 to check case status."* |
| **Registering** | Collect name → area → household size → main need (one question per message) |
| **On complete** | Write submission to Firestore (`source: "whatsapp"`). Reply: *"Registered. Your case ID is #XXXX."* |
| **Status check** | User texts case ID → bot queries by `whatsappPhone` → returns current status in Arabic |
| **Language** | Default Arabic. User types `EN` or `FR` at any point to switch |

---

### 5.5 `checkDuplicatePhone` — Replaces Security Hole

**Trigger:** Callable function — called from `CreateSubmission` before submit

```ts
// Input
{ phone: string }

// Logic
query submissions for matching phoneNumber → return count only

// Output
{ isDuplicate: boolean, existingCount: number }

// Auth: requires Firebase Auth token (agent or member must be logged in)
```

---

### 5.6 `onCaseCompleted`

**Trigger:** `onUpdate` — where `new.status === "completed"` and `old.status !== "completed"`

| Step | Action |
|------|--------|
| 1 | Decrement `assignedTo` member's `currentCaseLoad` by 1 |
| 2 | Increment `/stats/global`: `totalCompleted`, `totalPeopleHelped` (by `numberOfPeopleInHousehold`) |
| 3 | Optional: WhatsApp to displaced person: *"Your case has been marked as helped. Thank you for trusting Nasna."* |

---

## 6. Implementation Phases

> Each phase is independently deployable. The platform is valuable after Phase 1 and gains capability with each subsequent phase.

### Phase 0 — Critical Fixes `1–2 weeks`
- [ ] Pagination on all admin tables (`usePaginatedQuery` hook)
- [ ] Add `needs` / `specialNeeds` UI to `CreateSubmission`
- [ ] Fix `consentGiven` default to `false`
- [ ] Fix `ageRanges` edit in admin modal
- [ ] Move phone dedup to Cloud Function (`checkDuplicatePhone`)
- [ ] Replace `getDocs` with `onSnapshot` everywhere

### Phase 1 — Dispatch Engine + Emergency Contacts `3–4 weeks`
- [ ] New Firestore fields on `submissions` and `members`
- [ ] `onNewSubmission` Cloud Function with email notifications
- [ ] `DispatchCenter` admin screen
- [ ] Case status tracking (`CaseStatusBadge`, `CaseTimeline`)
- [ ] `SubmissionDetail` view for agents and NGOs
- [ ] `CaseFeed` and `MyCases` screens for NGO members
- [ ] `onCaseAssigned`, `dailyStaleCaseCheck`, `onCaseCompleted` Cloud Functions
- [ ] `EmergencyContacts` admin CRUD + public screen

### Phase 2 — Housing Marketplace `3–4 weeks`
- [ ] `centers` collection + admin `CenterManagement` screen
- [ ] Redesign `CreateSubmission` with `locationType` toggle and `CenterPicker`
- [ ] `housing` collection + `OfferHousing` public form
- [ ] Admin `HousingReview` approval workflow
- [ ] Public `HousingDirectory` with filters
- [ ] `CapacityBar` component + real-time occupancy updates

### Phase 3 — WhatsApp Bot `3–4 weeks`
- [ ] Set up Twilio WhatsApp Business Account or 360dialog
- [ ] `wa_sessions` collection for bot state management
- [ ] `whatsappWebhook` Cloud Function with full registration + status check flow
- [ ] Arabic, English, French bot responses
- [ ] `onCaseAssigned` WhatsApp notification to displaced person
- [ ] QR codes for posting at displacement centers

### Phase 4 — Impact Dashboard + Donations `2–3 weeks`
- [ ] `/stats/global` document maintained by Cloud Functions
- [ ] Public `ImpactPage` with live stats and charts
- [ ] Admin `ImpactDashboard` with CSV export
- [ ] Donation flow (Stripe) — fund a family / fund a center / fund an NGO

### Phase 5 — Operations Map `1–2 weeks`
- [ ] `OperationsMap` admin screen with Leaflet
- [ ] Submission pins (color by urgency, clustered by zoom)
- [ ] NGO coverage polygon overlays
- [ ] Center markers with capacity indicator
- [ ] Housing listing pins
- [ ] Filter panel by date, urgency, status, needs type

---

## 7. Security & Firestore Rules

Required changes to `firestore.rules` alongside feature development:

- **Remove** unauthenticated read access to `submissions` (see Fix 5)
- `centers` — read: all authenticated users; write: admin only
- `housing` — read: all; create: all (public submissions); update/delete: admin only
- `emergencyContacts` — read: all; write: admin only
- `notifications` — read: own records only (`recipientUid === request.auth.uid`); write: Cloud Functions service account only
- `wa_sessions` — no client access; Cloud Functions service account only
- `submissions` (updated) — NGO members may only read submissions where `assignedTo === their UID` **OR** where their `coverageGovernorates`/`centerIds` match AND `status === "pending"`

### WhatsApp Number Privacy

When a submission is created via WhatsApp, `whatsappPhone` stores the full number. This field must be excluded from member-facing reads using Firestore field masks — NGOs should not be able to harvest displaced persons' WhatsApp numbers directly from the database.

---

## 8. New Dependencies

### Frontend (add to `package.json`)

No new frontend dependencies required for Phases 0–1. Leaflet is already installed.

### Backend (Cloud Functions `package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `twilio` | `^5.x` | WhatsApp Business API for bot and notifications |
| `@sendgrid/mail` | `^8.x` | Transactional email for NGO notifications and alerts |
| `stripe` | `^14.x` | Payment processing for donation feature *(Phase 4 only)* |
| `firebase-admin` | `^12.x` | Already available in Functions environment |
| `firebase-functions` | `^6.x` | Functions v2 runtime |

### Environment Variables

Store all secrets in Firebase Functions environment config or Secret Manager (v2 functions):

```bash
# Required for Phase 1
SENDGRID_API_KEY=...
ADMIN_EMAIL=...

# Required for Phase 3
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+1415XXXXXXX

# Required for Phase 4
STRIPE_SECRET_KEY=...
```

---

## 9. Offline Support for Agents

Firebase SDK includes built-in Firestore offline persistence. Enable it once at app initialization:

```ts
// src/firebase.ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Offline persistence unavailable:', err);
});
```

With this single addition, agents can fill and submit the `CreateSubmission` form with no internet connection. Firestore queues the write locally and syncs automatically when connectivity is restored.

**Additional UX changes needed:**
- Add an offline indicator banner in the agent layout (detect `navigator.onLine`)
- Show "Syncing..." indicator when queued writes are being flushed
- Warn agents not to close the browser tab until sync is complete

---

*Nasna Team — Technical Specification v2.0 — March 2026*
