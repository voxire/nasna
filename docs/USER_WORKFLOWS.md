# Nasna v2.0 — User Workflows by Role

> **Audience:** Dev team
> **Scope:** Full v2 vision — current features marked ✅, planned/in-progress marked 🔜 (Phase 3)
> Last updated: March 2026

---

## Table of Contents

1. [Displaced Person — WhatsApp Bot](#1-displaced-person--whatsapp-bot)
2. [Field Agent — Web Registration](#2-field-agent--web-registration)
3. [NGO Member — Case Matching & Fulfillment](#3-ngo-member--case-matching--fulfillment)
4. [Admin — Dispatch & Oversight](#4-admin--dispatch--oversight)
5. [Public Visitor — Housing, Emergency, Donate](#5-public-visitor--housing-emergency-donate)

---

## 1. Displaced Person — WhatsApp Bot

> 🔜 Phase 3 — Not yet built. No Twilio integration exists yet.

This is the most accessible registration path — works on any phone with mobile data, no app or account required.

### Entry Points

- QR code posted at a displacement center (links to `https://wa.me/[TWILIO_NUMBER]`)
- Shared link via social media or word of mouth

### Registration Flow

```
Person texts the Nasna WhatsApp number
          │
          ▼
[wa_sessions/{phone}] checked — new session created
          │
Bot replies (Arabic default):
"أهلاً بك في نسنا. اضغط 1 للتسجيل، اضغط 2 لمتابعة حالتك."
          │
     ┌────┴────┐
     1          2
     ▼          ▼
[Register]   [Status Check — see below]
     │
     ▼
Step 1: "ما اسمك الكامل؟"
  → save to wa_sessions.data.name
     │
     ▼
Step 2: "في أي محافظة أنت الآن؟"
  → save to wa_sessions.data.area
     │
     ▼
Step 3: "كم عدد أفراد عائلتك معك؟"
  → save to wa_sessions.data.householdSize
     │
     ▼
Step 4: "ما أكثر شيء تحتاجه الآن؟
  1. طعام  2. مأوى  3. طبي  4. ملابس  5. أخرى"
  → save to wa_sessions.data.mainNeed
     │
     ▼
Cloud Function writes submission to Firestore:
  source: 'whatsapp'
  whatsappPhone: phone  ← PII: admin + Cloud Functions only
  status: 'pending'
  needs: [mainNeed]
  currentGovernorate: area
  numberOfPeopleInHousehold: householdSize
     │
     ▼
Bot replies:
"تم تسجيلك بنجاح. رقم حالتك هو #XXXX.
احتفظ بهذا الرقم — يمكنك إرساله لاحقاً لمعرفة آخر المستجدات."
     │
     ▼
[onNewSubmission Cloud Function triggers → NGOs notified]
```

**Firestore collections touched:**
- `wa_sessions/{phone}` — write (bot state, Cloud Functions only)
- `submissions` — write (new document)

**Language switching:** At any point the person types `EN` or `FR` → session language updates → all subsequent replies switch language.

---

### Status Check Flow

```
Person texts case ID (e.g. "ABC123") or presses 2
          │
          ▼
Cloud Function queries submissions where whatsappPhone == phone
          │
     ┌────┴────────────────┐
  Found                 Not found
     │                      │
     ▼                      ▼
Returns status:        "لم نتمكن من إيجاد
"حالتك (#ID)           سجل بهذا الرقم."
بتاريخ [date]
الحالة: قيد الانتظار /
تم التعيين لـ [NGO Name] /
مكتملة"
```

---

### Case Assigned Notification (triggered automatically)

When an admin or NGO claims the case:

```
[onCaseAssigned Cloud Function fires]
          │
          ▼
Twilio sends WhatsApp to submission.whatsappPhone:
"تم تعيين حالتك (#ID) إلى [NGO Name].
سيتواصلون معك قريباً."
```

---

## 2. Field Agent — Web Registration

> ✅ Current state — fully built

Agents are authenticated field workers who register displaced families on their behalf, typically on-site at a center or in the field.

### Entry Points

- Login at `/auth/login` → redirected to `/agent/create` after auth
- Direct navigation to `/agent/create` (protected by `PrivateRoute allowedRoles={['agent']} requireValidated`)

### Registration Flow

```
Agent logs in → /auth/login
          │
          ▼
[AuthContext] — Firebase Auth session established
Redux store hydrated (redux-persist)
          │
          ▼
/agent/create — CreateSubmission screen
          │
          ▼
Step 1: Personal info
  fullName, phoneNumber, emailAddress (optional), gender
          │
          ▼
Step 2: Location
  locationType toggle:
  ┌──────────────────┬──────────────────────┐
  │  "with_family"   │      "center"         │
  │                  │                       │
  │ currentGovernorate│  CenterPicker        │
  │ previousGovernorate│  (dropdown from     │
  │ street, building, │   centers collection,│
  │ floor, city       │   grouped by         │
  │                  │   governorate)        │
  └──────────────────┴──────────────────────┘
          │
          ▼
Step 3: Household
  numberOfPeopleInHousehold
  ageRanges (number inputs per group: 0-3, 4-12, 13-18, 19-60, 60+)
          │
          ▼
Step 4: Needs
  AidTypeCheckboxGrid:
  ☐ food  ☐ water  ☐ shelter  ☐ medical
  ☐ clothing  ☐ baby_supplies  ☐ psychosocial  ☐ legal_docs
  specialNeeds: chip input (freeform conditions)
  aidUrgency: High / Medium / Low
          │
          ▼
Step 5: Consent + Submit
  ☐ consentGiven (required, defaults false, z.literal(true))
  comments (optional)
          │
          ▼
On submit:
  1. checkSubmissionDuplicates callable → { isDuplicate, existingCount }
     └─ if duplicate: toast warning, agent confirms to proceed
  2. Zod validation runs client-side
  3. addDoc to submissions collection
     source: 'agent', agent: uid, status: 'pending'
  4. Success toast + redirect to /agent/submissions
          │
          ▼
[onNewSubmission Cloud Function triggers]
```

**Offline support:**
- Agent loses connectivity mid-form → form saves draft to `offlineSubmissionQueue` (IndexedDB)
- Offline banner shown via `navigator.onLine` listener
- On reconnect → `syncQueuedSubmissions()` flushes queue to Firestore
- "Syncing..." indicator shown until flush complete

**Firestore collections touched:**
- `submissions` — write (new document)
- `centers` — read (CenterPicker dropdown)

---

### Submission History

```
/agent/submissions — AgentSubmissions screen
          │
          ▼
onSnapshot query:
  submissions where agent == uid
  orderBy createdAt desc
  limit(25) — paginated via usePaginatedQuery
          │
          ▼
Table rows with: name, governorate, status badge, date
Click row → /agent/submissions/:id — SubmissionDetail screen
  Shows: full case info, current status, CaseTimeline
```

---

## 3. NGO Member — Case Matching & Fulfillment

> ✅ Screens built — ⚠️ Email notifications not yet wired (SendGrid missing)

NGO members are validated organizations. They see only cases that match their declared coverage area and aid types.

### Onboarding Flow

```
Register at /auth/register
          │
          ▼
Admin validates account in /manage/ngo
(sets validated: true)
          │
          ▼
First login → /ngo/profile-coverage — ProfileCoverage screen
  Set coverage profile:
  - coverageType: 'governorate' | 'center' | 'hybrid'
  - coverageGovernorates: string[] (Lebanese governorates)
  - coverageCenterIds: string[] (from centers collection)
  - aidTypes: string[] (same enum as submission needs)
  - maxCaseLoad: number (0 = unlimited)
  - deliveryMode: 'delivery' | 'pickup' | 'both'
          │
          ▼
updateMemberCoverageProfile callable Cloud Function
Updates members/{uid} in Firestore
```

---

### Case Feed Flow

```
/ngo/submissions — Submissions screen (CaseFeed)
          │
          ▼
listMemberPendingCases callable Cloud Function:
  Query submissions where:
    status == 'pending'
    AND (currentGovernorate in member.coverageGovernorates
         OR centerId in member.coverageCenterIds)
    AND needs intersects member.aidTypes
    AND member.currentCaseLoad < member.maxCaseLoad (if set)
  Returns: case summaries (no whatsappPhone — field masked)
          │
          ▼
Case cards shown with: area, household size, needs badges, urgency, age breakdown
          │
          ▼
Click case → /ngo/cases/:caseId — CaseDetail screen
  getMemberCaseDetail callable returns full case (still no whatsappPhone)
          │
          ▼
"Claim this case" button
          │
          ▼
claimMemberCase callable:
  Atomically:
  - submission.status → 'assigned'
  - submission.assignedTo → member uid
  - submission.assignedAt → now
  - member.currentCaseLoad += 1
  Returns success/conflict (if another NGO claimed first)
          │
          ▼
[onCaseAssigned Cloud Function fires]:
  - WhatsApp to displaced person: "Your case has been assigned..." 🔜
  - Notification record written to notifications collection
```

---

### Case Management Flow

```
/ngo/my-cases — MyCases screen
          │
          ▼
listMemberClaimedCases callable:
  submissions where assignedTo == uid
  ordered by assignedAt desc
          │
          ▼
Status pipeline: Assigned → In Progress → Completed
          │
          ▼
updateMemberCaseStatus callable:
  NGO moves case through statuses
  lastUpdatedBy: uid, updatedAt: now
  staleFlagged reset to false on any update
          │
          ▼
Record aid delivered — AidDeliveryForm inline:
  { type, date, deliveredBy, notes }
recordMemberAidDelivery callable:
  Appends to aidDelivered[] array
          │
          ▼
Mark case Completed:
[onCaseCompleted Cloud Function fires]:
  - member.currentCaseLoad -= 1
  - /stats/global: totalCompleted++, peopleHelped += numberOfPeopleInHousehold
  - Optional WhatsApp to displaced person: "Your case has been helped." 🔜
```

**Firestore collections touched:**
- `submissions` — read (filtered), update
- `members/{uid}` — read, update (via Cloud Functions)
- `notifications` — write (via Cloud Functions)

---

## 4. Admin — Dispatch & Oversight

> ✅ All screens built

Admins have full access to all collections and all screens. The main workflow is the dispatch hub.

### Entry Point

```
Login at /auth/login → redirect to /manage (Dashboard)
Protected by Admin layout component
(⚠️ Bug #11: currently redirects to / instead of /auth/login when unauthenticated — pending fix)
```

---

### Dispatch Workflow

```
/manage/dispatch — DispatchCenter screen
          │
          ▼
onSnapshot: submissions where status == 'pending'
  Shows: pending case queue, urgency indicators, time since created
  Stale cases (staleFlagged: true) highlighted
          │
          ▼
Admin reviews case → sees matched NGO suggestions
(based on coverageGovernorates / coverageCenterIds / aidTypes)
          │
          ▼
Admin manually assigns case if auto-claim hasn't happened:
  updates status → 'assigned', assignedTo → member uid
  [onCaseAssigned fires]
```

---

### Centers Management

```
/manage/centers — CenterManagement screen
          │
          ▼
onSnapshot: centers collection (all)
Table: name, governorate, capacity, occupiedCapacity, CapacityBar, active toggle
          │
CRUD:
  Add center → Dialog form → Zod validation → addDoc to centers
  Edit → updateDoc
  Deactivate → active: false (hides from CenterPicker for new submissions)
          │
          ▼
Occupancy update:
  Admin or NGO records aid delivered at center
  occupiedCapacity updated manually or via Cloud Function hook
  CapacityBar turns yellow at 90%, center removed from public listings at 100%
```

---

### Housing Review Workflow

```
/manage/housing — HousingReview screen
          │
          ▼
onSnapshot: housing where status == 'pending_review'
          │
          ▼
Admin reviews listing: lister name, area, capacity, price type, notes
          │
     ┌────┴────┐
  Approve     Reject
     │            │
     ▼            ▼
status →      status →
'approved'    'rejected'
approvedBy → uid
[onHousingStatsChanged fires → /stats/global.housingAvailable updated]
```

---

### NGO Validation Workflow

```
/manage/ngo — Members screen (NGO tab)
          │
          ▼
usePaginatedQuery: members where role == 'member'
Table: name, org, email, validated status, caseLoad
          │
          ▼
Admin clicks row → Edit dialog
  Toggle validated: true/false
  View coverage profile, aidTypes, capacity
```

---

### Emergency Contacts Management

```
/manage/emergency — EmergencyContactsManagement screen
          │
          ▼
CRUD on emergencyContacts collection:
  Fields: name, phoneNumber, category, coverage, verified, lastVerifiedAt
  Admin verifies numbers are still active → verified: true, lastVerifiedAt: now
  Order field controls display sequence on public /emergency page
```

---

### Stale Case Alerts

```
[dailyStaleCaseCheck — Cloud Scheduler, daily 08:00 UTC]
          │
          ▼
Query: submissions where status == 'assigned'
  AND assignedAt < (now - 24h)
          │
          ▼
staleFlagged: true set on each
          │
          ▼
Email sent to ADMIN_EMAIL with stale case IDs 🔜 (SendGrid pending)
          │
          ▼
WhatsApp to assigned NGO: "Case #ID has had no update." 🔜 (Phase 3)
```

---

### Operations Map

```
/manage/operations-map — OperationsMap screen
          │
          ▼
getOperationsMapData callable:
  Returns:
  - Submission pins (lat/lng, urgency color, status)
  - Center markers (name, capacity %, isActive)
  - Housing pins (approved listings)
  - NGO coverage polygons (based on coverageGovernorates)
          │
          ▼
Leaflet map renders:
  🔴 High urgency pending cases
  🟡 Medium urgency / stale cases
  🟢 Assigned / in-progress cases
  🏫 Center markers with CapacityBar
  🏠 Approved housing pins
  Filter panel: date, status, urgency, needs type
```

---

### Impact Dashboard

```
/manage/impact — ImpactDashboard screen (admin)
          │
          ▼
onSnapshot: /stats/global document
  Maintained by:
  - onCaseCompleted (increments totalCompleted, peopleHelped)
  - nightlyGlobalStatsRebuild (full rebuild at midnight)
  - onHousingStatsChanged / onMemberStatsChanged (live counters)
          │
          ▼
Charts: cases over time, breakdown by governorate, needs distribution
CSV export button → downloads raw submissions data
```

---

## 5. Public Visitor — Housing, Emergency, Donate

> ✅ All screens built — ⚠️ i18n bugs pending fix on /emergency

No login required for any of these flows.

---

### Browse Housing Listings

```
/housing — Housing screen
          │
          ▼
getDocs: housing where status == 'approved'
  (paginated, limit 25)
          │
          ▼
HousingCard grid:
  - Type (apartment / room / house / floor)
  - Area + district
  - Capacity, available spots
  - Price type badge (Free / Subsidized / Paid)
  - Available from date
  - Amenities icons
  - "Contact via WhatsApp" button → opens wa.me/[listerPhone]
          │
          ▼
Filters: governorate, capacity range, priceType, availability
```

---

### Offer Housing

```
/offer-housing — OfferHousing screen
          │
          ▼
Public form (no login):
  hostName, hostPhone, area, address
  capacity, availableSpots, priceType, pricePerMonth (if not free)
  amenities checkboxes, availableFrom date, notes
          │
          ▼
Zod validation → addDoc to housing:
  status: 'pending_review'
  createdAt: now
          │
          ▼
Success message: "شكراً! سيتم مراجعة إعلانك."
Listing appears in /manage/housing queue for admin approval
```

---

### Emergency Contacts

```
/emergency — Emergency screen
(⚠️ Bug #3: currently renders in English — i18n fix pending)
          │
          ▼
getDocs: emergencyContacts (all, no auth required)
  Filtered by: category, coverage/governorate
          │
          ▼
Directory display:
  Government | Health | NGO | Security | Legal | Utilities
  Each card: name, phone (tap-to-call), description, verified badge
          │
          ▼
Admin keeps numbers current via /manage/emergency
```

---

### Submit a Help Request (Public Self-Register)

```
/submit — public form (no agent account needed)
          │
          ▼
Same form as CreateSubmission but unauthenticated
  source: 'web'
  No agent field
          │
          ▼
Zod validation → addDoc to submissions
  status: 'pending'
          │
          ▼
[onNewSubmission fires → NGOs notified]
```

---

### Donations

```
/donate — Donate screen
          │
          ▼
Visitor selects donation target:
  Fund a family | Fund a center | Fund an NGO
  Enters: donorName, donorPhone, amountUsd, reason
          │
          ▼
createDonationCheckoutSession callable (Stripe):
  Creates Stripe Checkout session
  Returns: { sessionUrl }
          │
          ▼
Redirect to Stripe hosted checkout page
  On success → Stripe webhook updates donation.status → 'paid'
  On failure → donation.status → 'failed'
```

---

### Impact Page (Public)

```
/impact — Impact screen
          │
          ▼
onSnapshot: /stats/global
  totalFamiliesRegistered
  totalFamiliesHelped
  activeNgoCount
  housingAvailable
          │
          ▼
Live counters + charts:
  Displacement heatmap (anonymized, governorate-level only — no PII)
  Breakdown by needs category
  Active NGOs list and their coverage areas
```

---

## Summary — Trigger Map

| User action | Firestore write | Cloud Function triggered |
|-------------|----------------|--------------------------|
| Agent submits registration | `submissions` (new) | `onNewSubmission` |
| WhatsApp self-register completes | `submissions` (new) | `onNewSubmission` |
| `onNewSubmission` runs | `notifications` (new) | — (sends email to matched NGOs 🔜) |
| NGO claims case | `submissions` (update status→assigned) | `onCaseAssigned` |
| `onCaseAssigned` runs | `members.currentCaseLoad++` | — (WhatsApp to displaced 🔜) |
| NGO marks case complete | `submissions` (update status→completed) | `onCaseCompleted` |
| `onCaseCompleted` runs | `members.currentCaseLoad--`, `stats/global` | — |
| Housing listing submitted | `housing` (new, pending_review) | `onHousingStatsChanged` |
| Admin approves housing | `housing` (update status→approved) | `onHousingStatsChanged` |
| Daily scheduler fires | `submissions` (staleFlagged) | — (email to admin 🔜) |
| Nightly scheduler fires | `stats/global` (full rebuild) | — |

---

*Nasna Team — User Workflows v2.0 — March 2026*
