# Nasna v2 — Claude Code Prompts by Phase

> Copy-paste these prompts directly into Claude Code. Each is self-contained and includes all the context needed to implement that phase without prior conversation history.

---

## Phase 0 — Critical Bug Fixes

```
You are working on Nasna, a humanitarian aid coordination platform built with React 19 + Vite 7 + TypeScript, Tailwind CSS v4 + shadcn/ui, Firebase (Firestore + Auth + Cloud Functions v2), Redux Toolkit, and i18next (Arabic primary, English, French). The project root has a CLAUDE.md with hard rules — read it before doing anything.

Before writing a single line of code, set up your branch:
  git checkout main
  git pull origin main
  git checkout -b fix/phase-0-critical-bugs
This branch name groups all 6 bug fixes into one reviewable PR. Do not commit to main directly.

Your job is to fix 6 critical bugs. Complete all 6 before considering this task done. After every file change, run `pnpm format` and then `pnpm tsc` — both must exit 0 before moving on.

---

BUG 1 — Pagination on admin tables
Files: src/Screens/Admin/AdminSubmissions.tsx, src/Screens/Admin/Members.tsx, src/Screens/Admin/Agents.tsx
Problem: All three call getDocs() on entire collections with no limit(). This will timeout at 500+ records.
Fix:
- Create a reusable hook at src/hooks/usePaginatedQuery.ts
- The hook should accept a Firestore Query, a page size (default 25), and return { data, loading, error, hasMore, loadMore }
- Use cursor-based pagination: orderBy('createdAt', 'desc'), limit(25), then startAfter(lastDoc) for subsequent pages
- Replace getDocs() in all three admin screens with this hook
- Add "Load more" / pagination controls to each screen using existing shadcn/ui Button components
- No getDocs() without limit() anywhere — this is a hard rule in CLAUDE.md

---

BUG 2 — needs[] and specialNeeds[] have no UI
File: src/Screens/Private/CreateSubmission.tsx (and the matching agent submission form if it exists)
Problem: needs[] and specialNeeds[] default to empty arrays and are never collected. This is the most operationally important data field.
Fix:
- Add a checkbox grid for `needs` using these enum values: food | water | shelter | medical | clothing | baby_supplies | psychosocial | legal_docs
- Add a chip/tag input for `specialNeeds` (freeform text — conditions like wheelchair, pregnancy, chronic medication, elderly, infant)
- Both fields are already in the Zod schema and SubmissionDocument type — just wire the UI
- Build a reusable AidTypeCheckboxGrid component at src/Components/AidTypeCheckboxGrid.tsx (it will be reused in ProfileCoverage)
- Add translation keys for all need labels to src/locales/ar/, en/, fr/ — Arabic is required, others can be placeholder
- RTL layout must work correctly for Arabic (the primary language)

---

BUG 3 — consentGiven defaults to true
File: src/Screens/Private/CreateSubmission.tsx
Problem: consentGiven: true in defaultFormData pre-checks consent, making it legally meaningless.
Fix:
- Change default to false
- Add required: true Zod validation — form cannot be submitted without explicit check
- The checkbox must be visibly unchecked on form load
- CLAUDE.md says: "Never remove consentGiven or make it optional. Must always default to false and be required." This fix enforces that rule.

---

BUG 4 — ageRanges broken in admin edit modal
File: src/Screens/Admin/AdminSubmissions.tsx (the edit dialog/modal)
Problem: ageRanges is stored as { '0-3': 0, '4-12': 0, '13-17': 0, '18-59': 0, '60+': 0 } in Firestore but the edit modal renders it as a plain string input, corrupting the data structure on save.
Fix:
- In the edit modal, replace the string input for ageRanges with individual number inputs for each age group key
- Match the pattern already used in CreateSubmission.tsx for consistency
- Validate each value is a non-negative integer
- On save, write back as the correct object shape, not a string

---

BUG 5 — Phone deduplication security hole
Files: firestore.rules, functions/src/index.ts, functions/src/checkDuplicatePhone.ts (new), src/Screens/Private/CreateSubmission.tsx
Problem: A comment in firestore.rules acknowledges that unauthenticated users have read access to submissions to check for duplicate phone numbers. This exposes the displaced persons database to any internet user.
Fix:
Step 1 — Create Cloud Function at functions/src/checkDuplicatePhone.ts:
  - Callable function (onCall) requiring Firebase Auth
  - Input: { phone: string }
  - Logic: query submissions where phoneNumber === phone, return count only
  - Output: { isDuplicate: boolean, existingCount: number }
  - NEVER return any submission data, only the boolean
  - Export it from functions/src/index.ts
Step 2 — Update CreateSubmission.tsx:
  - Replace the current client-side getDocs() phone check with a call to this Cloud Function using httpsCallable()
  - Keep the same UX (show warning if duplicate found)
Step 3 — Remove the unauthenticated read exception from firestore.rules
  - submissions collection must require authentication for ALL reads
  - No exceptions for phone checking — that path is now handled by the Cloud Function

---

BUG 6 — getDocs instead of onSnapshot in dashboards
Files: src/Screens/Admin/Dashboard.tsx, src/Screens/Admin/AdminSubmissions.tsx, src/Screens/Admin/Members.tsx, src/Screens/Private/AgentSubmissions.tsx
Problem: All of these use getDocs() (one-shot fetch), so admins and agents see stale data until they refresh. During an active crisis, stale data is operationally dangerous.
Fix:
- Replace getDocs() with onSnapshot() listeners in all four screens
- Use useEffect with cleanup: return () => unsubscribe() to avoid memory leaks — this is required by CLAUDE.md
- Combine with the pagination from Bug 1 where the data set is large: use onSnapshot on the first page cursor, not the full collection
- Loading and error states must be handled correctly for all three states

---

COMPLETION CHECKLIST — do not mark done until all pass:
- [ ] pnpm format exits 0
- [ ] pnpm tsc exits 0
- [ ] No getDocs() without limit() anywhere in the codebase (grep to verify)
- [ ] consentGiven defaults to false in CreateSubmission.tsx
- [ ] needs[] has working checkbox UI
- [ ] ageRanges edit modal shows number inputs, not a string field
- [ ] checkDuplicatePhone Cloud Function exported and used from CreateSubmission
- [ ] Unauthenticated submissions read rule removed from firestore.rules
- [ ] All new UI strings have keys in ar/, en/, fr/ locale files
- [ ] onSnapshot listeners all have useEffect cleanup
```

---

## Phase 1 — Dispatch Engine + Emergency Contacts

```
You are working on Nasna, a humanitarian aid coordination platform. Stack: React 19 + Vite 7 + TypeScript, Tailwind CSS v4 + shadcn/ui, Firebase (Firestore + Auth + Cloud Functions v2 at europe-west1), Redux Toolkit, i18next (Arabic primary, English, French). Read CLAUDE.md before starting — it has hard rules about PII, i18n, and no getDocs without limit.

Before writing a single line of code, set up your branch:
  git checkout main
  git pull origin main
  git checkout -b feat/phase-1-dispatch-engine-emergency-contacts
This branch covers the full dispatch engine (Cloud Functions, DispatchCenter admin screen, NGO case feed) and the emergency contacts directory. Do not commit to main directly.

Phase 0 bugs are already fixed. Your task is Phase 1: the full dispatch engine plus the emergency contacts directory. This is the core of the platform — when done, NGOs can discover cases, claim them, deliver aid, and close them out.

---

PART A — New Firestore fields

Add these fields to the SubmissionDocument type in src/types/index.ts (they may already exist partially — check first, add what's missing):
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'  // already exists
  locationType: 'center' | 'with_family'  // already exists
  centerId?: string  // ref to centers collection, only when locationType === 'center'
  assignedTo?: string  // member UID
  assignedToOrgName?: string  // PII: admin + member via CF only. Never expose to agents
  assignedAt?: Timestamp
  aidDelivered?: { type: string; date: Timestamp; deliveredBy: string; notes?: string }[]
  lastUpdatedBy?: string
  staleFlagged?: boolean
  source: 'web' | 'whatsapp'
  needs: string[]   // food | water | shelter | medical | clothing | baby_supplies | psychosocial | legal_docs
  specialNeeds?: string[]

Add these fields to the MemberDocument type:
  coverageType: 'area' | 'centers' | 'both'
  coverageGovernorates?: string[]
  coverageCenterIds?: string[]
  aidTypes: string[]  // same enum as needs
  currentCaseLoad?: number
  maxCaseLoad?: number  // 0 = unlimited
  deliveryMode: 'in_person' | 'remote' | 'both'

Add new EmergencyContact type:
  id: string
  name: string
  category: 'government' | 'health' | 'ngo' | 'security' | 'legal' | 'utilities'
  phone: string
  phoneAlt?: string
  scope: string  // 'national' or a specific Lebanese governorate name
  description: string
  isVerified: boolean
  lastVerifiedAt?: Timestamp
  order?: number

---

PART B — Cloud Functions (functions/src/)

Create these four Cloud Functions. All in TypeScript, Functions v2, region europe-west1.

1. onNewSubmission (onCreate trigger on /submissions/{submissionId})
   - Read submission.locationType, centerId, currentGovernorate, needs[]
   - Query members where validated === true AND (coverageGovernorates contains governorate OR coverageCenterIds contains centerId)
   - Filter: aidTypes must intersect with submission.needs; filter out NGOs where currentCaseLoad >= maxCaseLoad (unless maxCaseLoad === 0)
   - For each matched NGO: create a record in notifications collection; send email via SendGrid (SENDGRID_API_KEY env var) with case summary — IMPORTANT: email must NOT contain PII, only: urgency, governorate, needs list, and case ID
   - If zero NGOs matched: create an admin alert notification record
   - Export from functions/src/index.ts

2. onCaseAssigned (onUpdate trigger where new.status === 'assigned' AND old.status !== 'assigned')
   - Increment assignedTo member's currentCaseLoad by 1 using FieldValue.increment(1)
   - Write notification record { type: 'case_assigned', channel: 'email', recipientUid: assignedTo, submissionId, sentAt, status: 'sent' }
   - Export from functions/src/index.ts

3. onCaseCompleted (onUpdate trigger where new.status === 'completed' AND old.status !== 'completed')
   - Decrement assignedTo member's currentCaseLoad by 1 using FieldValue.increment(-1)
   - Increment /stats/global document fields: totalCompleted += 1, totalPeopleHelped += submission.numberOfPeopleInHousehold
   - Create /stats/global document if it doesn't exist (use set with merge: true)
   - Export from functions/src/index.ts

4. dailyStaleCaseCheck (scheduled, every day at 08:00 UTC using onSchedule)
   - Query submissions where status === 'assigned' AND assignedAt < (now - 48h)
   - Set staleFlagged = true on each
   - Send email to ADMIN_EMAIL env var with list of stale case IDs (no PII in the email body)
   - Export from functions/src/index.ts

---

PART C — Admin screens

1. DispatchCenter screen at src/Screens/Admin/DispatchCenter.tsx, route /admin/dispatch
   - Two-column layout: left = pending cases feed, right = case detail panel (or empty state)
   - Pending cases list: shows case ID, governorate, needs badges, time since creation, staleFlagged indicator
   - Clicking a case loads the full detail in the right panel
   - Right panel shows: all submission fields (readable, not editable), a dropdown to manually assign to a validated member, and case status controls
   - Manual assignment: admin selects from a list of members whose coverage matches — dropdown shows member name, currentCaseLoad/maxCaseLoad, aidTypes
   - Use onSnapshot for both the cases list and the selected case detail — data must be live
   - All list queries must use limit(25) + cursor pagination
   - Add route to admin routes file and a nav link in the admin navbar

2. EmergencyContacts admin screen at src/Screens/Admin/EmergencyContacts.tsx, route /admin/emergency-contacts
   - Full CRUD: create, edit, delete emergency contacts
   - Table view with columns: name, category badge, phone, scope, isVerified toggle, order, actions
   - Create/Edit: use a Dialog (shadcn) with fields matching EmergencyContact type
   - isVerified toggle updates lastVerifiedAt timestamp automatically
   - Zod schema validation on all writes
   - Add route and nav link

---

PART D — Public EmergencyContacts screen

File: src/Screens/Public/EmergencyContacts.tsx, route /emergency
- No auth required
- Filterable by category and by scope (governorate)
- Display as cards grouped by category
- Each card shows: name, phone (tap-to-call link), phoneAlt if present, description, verified badge if isVerified
- Works in Arabic RTL layout (test this)
- Add to public routes and the public navbar/header

---

PART E — Firestore rules update

Add to firestore.rules:
  - emergencyContacts: read all (including unauthenticated); write admin only
  - notifications: read only by recipientUid === request.auth.uid; write Cloud Functions service account only

---

PART F — i18n

Add all new UI strings to src/locales/ar/, en/, fr/. Arabic is required — English and French can be placeholders if needed, but keys must exist in all three files. Suggested keys to add:
  - dispatch.title, dispatch.pendingCases, dispatch.assignTo, dispatch.staleWarning, dispatch.noMatch
  - emergency.title, emergency.filterByCategory, emergency.filterByArea, emergency.verified, emergency.callNow
  - notification.newCaseMatch (email subject line text)

---

COMPLETION CHECKLIST:
- [ ] pnpm format exits 0
- [ ] pnpm tsc exits 0 (including functions/)
- [ ] onNewSubmission CF: email contains no PII
- [ ] onCaseAssigned CF: increments currentCaseLoad correctly
- [ ] onCaseCompleted CF: decrements currentCaseLoad, updates /stats/global
- [ ] dailyStaleCaseCheck CF: exported and scheduled correctly
- [ ] DispatchCenter screen: uses onSnapshot, has pagination, manual assign works
- [ ] Admin EmergencyContacts: full CRUD, Zod-validated writes
- [ ] Public EmergencyContacts: no auth, filterable, RTL-compatible
- [ ] Firestore rules updated for emergencyContacts and notifications
- [ ] All new strings in ar/, en/, fr/
- [ ] No getDocs() without limit()
- [ ] All new PII-adjacent fields have // PII: comment
```

---

## Phase 2 — Housing Marketplace

```
You are working on Nasna, a humanitarian aid coordination platform. Stack: React 19 + Vite 7 + TypeScript, Tailwind CSS v4 + shadcn/ui, Firebase (Firestore + Auth + Cloud Functions v2), Redux Toolkit, i18next (ar/en/fr — Arabic primary). Read CLAUDE.md first. Phases 0 and 1 are complete.

Before writing a single line of code, set up your branch:
  git checkout main
  git pull origin main
  git checkout -b feat/phase-2-housing-marketplace
This branch covers displacement center management, the redesigned submission form with center picker, individual housing listings, admin review, and the public housing directory. Do not commit to main directly.

Your task is Phase 2: the housing marketplace. This has three distinct parts — displacement centers management (admin), individual housing listings (public), and the redesigned submission form with center selection.

---

PART A — centers collection and admin screen

New Firestore collection: centers
Type definition to add to src/types/index.ts:
  CenterDocument {
    id: string
    name: string  // e.g. "Rafiq Hariri University — Beirut"
    type: 'school' | 'university' | 'community_hall' | 'sports_facility' | 'other'
    governorate: string
    district?: string
    address?: string
    coordinates?: { lat: number; lng: number }
    totalCapacity: number
    currentOccupancy: number
    facilities?: ('generator' | 'water' | 'kitchen' | 'medical_room' | 'bathrooms' | 'internet')[]
    managerName?: string
    managerPhone?: string  // PII: admin only
    isActive: boolean
    createdBy: string
    updatedAt: Timestamp
  }

Admin screen at src/Screens/Admin/CenterManagement.tsx, route /admin/centers:
- Table of all centers with: name, type, governorate, currentOccupancy/totalCapacity (as "X/Y"), isActive toggle, actions
- Occupancy shown as a CapacityBar component (build at src/Components/CapacityBar.tsx):
  - Green when < 75% full, yellow when 75–90%, red when > 90%, greyed out when isActive === false
- Create/Edit dialog with all fields, Zod-validated
- Admins can update currentOccupancy directly (field workers call in numbers)
- Use onSnapshot for the table — occupancy changes must reflect live
- All list queries use limit(25) + cursor pagination
- Firestore rules: centers — read: all authenticated; write: admin only
- Add route and nav link

---

PART B — Redesign CreateSubmission with locationType and CenterPicker

File: src/Screens/Private/CreateSubmission.tsx
Current state: locationType field exists in Firestore but has no UI. centerId field exists but is never collected.

Changes:
1. Add a prominent toggle/segmented control near the top of the form: "At a displacement center" | "With family in a safe area"
2. When "At a displacement center" is selected:
   - Show a CenterPicker component (build at src/Components/CenterPicker.tsx)
   - CenterPicker: searchable select/combobox populated from the centers collection, grouped by governorate, shows name + occupancy status, only shows isActive === true centers
   - centerId is required when locationType === 'center'
   - Hide the currentGovernorate / currentDistrict free-text fields (center provides the location)
3. When "With family in a safe area" is selected:
   - Hide the CenterPicker
   - Show the existing governorate / area fields
   - centerId should be null/undefined
4. The AidTypeCheckboxGrid component (already built in Phase 0) should already be in this form for needs[]

---

PART C — housing collection, public form, and admin review

New Firestore collection: housing
Type definition to add to src/types/index.ts:
  HousingDocument {
    id: string
    listerId: string  // UID or 'anonymous'
    listerName: string  // PII: admin only for contact details
    listerPhone: string  // PII: admin only. Never shown publicly
    type: 'apartment' | 'room' | 'house' | 'floor'
    governorate: string
    district?: string
    capacity: number
    priceType: 'free' | 'subsidized' | 'market_rate'
    pricePerMonth?: number  // USD, 0 for free
    availableFrom: Timestamp
    availableUntil?: Timestamp
    amenities?: ('generator' | 'water' | 'internet' | 'washing_machine' | 'furnished' | 'private_bathroom')[]
    description?: string
    status: 'pending_review' | 'available' | 'reserved' | 'filled'
    approvedBy?: string
    createdAt: Timestamp
  }

Public form at src/Screens/Public/OfferHousing.tsx, route /offer-housing:
- No auth required
- Fields: listerName, listerPhone (WhatsApp preferred), type, governorate, district, capacity, priceType, pricePerMonth (only if priceType !== 'free'), availableFrom, availableUntil (optional), amenities checkboxes, description
- On submit: write to housing collection with status: 'pending_review'. No PII shown publicly — listerPhone is admin-only
- Zod validation, sonner toast on success/error
- RTL-compatible layout
- Add to public routes

Admin review screen at src/Screens/Admin/HousingReview.tsx, route /admin/housing:
- Two tabs: "Pending Review" and "Approved Listings"
- Pending tab: each listing shows all fields including listerPhone (admin can see this). Approve / Reject buttons
- Approved tab: table with status management (available → reserved → filled), delete option
- Approving sets status: 'available' and approvedBy: admin.uid
- Use onSnapshot, paginated
- Add route and nav link

Public directory at src/Screens/Public/HousingDirectory.tsx, route /housing:
- No auth required
- Shows only listings where status === 'available'
- Filter by: governorate, type, capacity (min), priceType
- Each listing shown as a HousingCard component (build at src/Components/HousingCard.tsx):
  - Shows: type, governorate, district, capacity ("Up to X people"), priceType badge, amenities icons, availableFrom
  - MUST NOT show listerName or listerPhone — these are PII. Contact button should direct to admin/Nasna as the intermediary, OR show a WhatsApp link if you decide on a specific approach
- Add to public routes

Firestore rules for housing:
  - create: all (including unauthenticated — anyone can list)
  - read: authenticated users can read approved listings; admin can read all
  - update/delete: admin only
  - listerPhone field must be masked in any read that is not admin — use field mask in Cloud Functions if needed, or enforce at Firestore rules level

---

PART D — i18n

All new strings in ar/, en/, fr/. Keys to add:
  - housing.offer.title, housing.offer.success
  - housing.directory.title, housing.directory.filters.*
  - housing.card.capacity, housing.card.free, housing.card.subsidized, housing.card.marketRate
  - housing.admin.pendingReview, housing.admin.approve, housing.admin.reject
  - centers.admin.title, centers.admin.occupancy, centers.capacity.full, centers.capacity.nearFull
  - submission.locationTypeCenter, submission.locationTypeFamily, submission.selectCenter

---

COMPLETION CHECKLIST:
- [ ] pnpm format exits 0
- [ ] pnpm tsc exits 0
- [ ] CenterManagement: CRUD, onSnapshot, CapacityBar shows correct colors
- [ ] CapacityBar component: green/yellow/red/grey states correct
- [ ] CreateSubmission: locationType toggle works, CenterPicker appears/hides, centerId required when center selected
- [ ] OfferHousing: public form, writes with status pending_review, no auth required
- [ ] HousingReview admin: pending/approved tabs, approve/reject works
- [ ] HousingDirectory: shows approved only, listerPhone NEVER shown publicly
- [ ] Firestore rules written for centers and housing
- [ ] All PII fields (listerName, listerPhone, managerPhone) have // PII: comments
- [ ] All new strings in ar/, en/, fr/
- [ ] No getDocs() without limit()
```

---

## Phase 3 — WhatsApp Self-Registration Bot

```
You are working on Nasna, a humanitarian aid coordination platform. Stack: React 19 + Vite 7 + TypeScript, Firebase Cloud Functions v2 (TypeScript, europe-west1), Firestore, i18next (ar/en/fr). Read CLAUDE.md — the wa_sessions collection is Cloud Functions only, never client-side. Phases 0–2 are complete.

Before writing a single line of code, set up your branch:
  git checkout main
  git pull origin main
  git checkout -b feat/phase-3-whatsapp-bot
This branch covers the Meta WhatsApp Cloud API webhook, the full bot state machine, wa_sessions collection, onCaseAssigned WhatsApp template notifications, and the small frontend CTA. Do not commit to main directly.

Your task is Phase 3: the WhatsApp self-registration bot using the Meta WhatsApp Cloud API (graph.facebook.com) directly — NOT Twilio. This is entirely backend (Cloud Functions). No new frontend screens are required, though there is one small frontend change.

---

SECRETS — DO NOT HARDCODE ANY OF THESE

All four secrets must be stored in Firebase Secret Manager. Add them with:
  firebase functions:secrets:set META_WA_PHONE_NUMBER_ID
  firebase functions:secrets:set META_WA_ACCESS_TOKEN
  firebase functions:secrets:set META_WA_APP_SECRET
  firebase functions:secrets:set META_WA_VERIFY_TOKEN

Then declare them in every Cloud Function that uses them:
  secrets: ['META_WA_PHONE_NUMBER_ID', 'META_WA_ACCESS_TOKEN', 'META_WA_APP_SECRET', 'META_WA_VERIFY_TOKEN']

Access at runtime via process.env.META_WA_PHONE_NUMBER_ID etc.
Leave placeholder comments where the actual values go — never commit real values. The developer will set the real values in Firebase console or via the CLI above.

Meta app context (do NOT hardcode these IDs — they are here for reference only):
  App name: Nasna
  App ID: 2722425708101931
  App type: Business, currently in Development mode
  WhatsApp product: already added to this app
  App URL: https://developers.facebook.com/apps/2722425708101931/whatsapp-business/wa-dev-console/

Secret meanings and where to get each value:
  META_WA_PHONE_NUMBER_ID  — visible in API Setup > Step 1 "Phone number ID" field once a phone number is added
  META_WA_ACCESS_TOKEN     — a permanent system user token (NOT the temporary token from the "Generate access token" button).
                             Create it via: Meta Business Settings > System Users > Add System User > assign WhatsApp permission > Generate token.
                             The Configuration page also has a "Learn how to create a permanent token" link.
  META_WA_APP_SECRET       — found in App Settings > Basic > "App secret" > click Show. This is for X-Hub-Signature-256 validation.
  META_WA_VERIFY_TOKEN     — any secure random string the developer chooses. This same string must be entered in the
                             WhatsApp > Configuration > "Verify token" field in the Meta console after the function is deployed.

---

PART A — wa_sessions collection

This collection stores bot session state. Client code MUST NEVER touch it.

Type (for Cloud Functions internal use only — do not add to src/types/index.ts):
  WaSession {
    phone: string         // E.164 format without '+' prefix (Meta sends it this way) — also the document ID
    state: 'start' | 'collecting_name' | 'collecting_area' | 'collecting_household' | 'collecting_need' | 'done' | 'checking_status'
    lang: 'ar' | 'en' | 'fr'
    data: {
      name?: string
      currentGovernorate?: string
      numberOfPeopleInHousehold?: number
      needs?: string[]
    }
    updatedAt: Timestamp
  }

Firestore rules: wa_sessions — NO client access at all. Only the Cloud Functions service account can read or write.

---

PART B — whatsappWebhook Cloud Function

File: functions/src/whatsappWebhook.ts
Trigger: onRequest (HTTP — handles both GET and POST from Meta)
Export from functions/src/index.ts as whatsappWebhook

This single function handles two request types:

IMPORTANT — Development mode limitation:
While the app is in Development mode (current state), Meta only delivers webhooks for test messages
sent directly from the API Setup dashboard. Real incoming WhatsApp messages from actual users will
NOT be delivered until the app is switched to Live mode. Build and test in dev mode, but the app
must be set to Live before real users can register. The developer switches this toggle in the app
header: App Mode: Development → Live.

--- GET: Webhook verification ---
Meta sends a GET request when you first register the webhook URL in the Meta console.
  Query params: hub.mode, hub.verify_token, hub.challenge
  Logic:
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.META_WA_VERIFY_TOKEN) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      res.sendStatus(403);
    }

--- POST: Incoming messages ---
Meta sends a POST for every incoming message. Respond 200 OK immediately (Meta will retry if it doesn't get a 200 fast), then process asynchronously.

STEP 1 — Validate X-Hub-Signature-256 header BEFORE processing any payload:
  - Header name: x-hub-signature-256
  - Format: "sha256=<hex>"
  - Compute: HMAC-SHA256 of the raw request body bytes using META_WA_APP_SECRET
  - Use crypto.timingSafeEqual to compare — never string equality
  - If invalid: respond 401 and return immediately, log the rejection (no PII in log)
  - IMPORTANT: To access the raw body, use rawBody from the Functions v2 request object.
    In Firebase Functions v2 onRequest, the raw body is available as req.rawBody (Buffer).
    Do not use express body-parser — it will consume the stream before you can hash it.

STEP 2 — Parse the Meta webhook payload:
  Meta payload structure (only handle 'messages' field type, silently ignore others):
    req.body.entry[0].changes[0].value.messages[0].from   → sender phone (E.164 without '+')
    req.body.entry[0].changes[0].value.messages[0].type   → 'text' | 'image' | etc.
    req.body.entry[0].changes[0].value.messages[0].text.body → message text (only when type === 'text')

  If type is not 'text': reply with "يرجى إرسال رسالة نصية فقط." and return.
  If the payload has no messages array (e.g. status update event): respond 200 and return silently.

STEP 3 — Respond 200 immediately, then run bot logic:
  res.sendStatus(200);
  // now process — Meta doesn't wait for your processing, just the 200

STEP 4 — Message sending helper:
  Create a sendWhatsAppText(to: string, body: string) helper in this file:
    POST https://graph.facebook.com/v19.0/${process.env.META_WA_PHONE_NUMBER_ID}/messages
    Headers: { Authorization: `Bearer ${process.env.META_WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
    Body: {
      messaging_product: 'whatsapp',
      to: to,          // E.164 without '+'
      type: 'text',
      text: { body: body }
    }
  Use node-fetch or the native fetch (Node 18+). Log errors but never log the 'to' field (PII).

--- Bot flow (all responses default to Arabic) ---

STATE: start (new user or no session)
  - Reply: "أهلاً بك في نسنا. اكتب 1 للتسجيل أو 2 للاستفسار عن حالتك.\n\nType EN for English. Tapez FR pour le français."
  - If user types "EN" → switch lang to en. If "FR" → switch to fr. Applies at any state.
  - Create wa_session with state: 'start'

If user replies "1" → move to state: 'collecting_name', ask for full name
If user replies "2" → move to state: 'checking_status', ask for case ID

STATE: collecting_name
  - Save name to session.data.name
  - Move to collecting_area
  - Ask: "في أي محافظة أنتم الآن؟" followed by a numbered list of all Lebanese governorates:
    1. بيروت  2. جبل لبنان  3. الشمال  4. عكار  5. البقاع  6. بعلبك-الهرمل  7. الجنوب  8. النبطية

STATE: collecting_area
  - Accept a number 1–8 mapping to the governorate list above
  - If input is not a valid number: re-send the same question with the list
  - Save governorate name (not number) to session.data.currentGovernorate
  - Move to collecting_household
  - Ask: "كم عدد أفراد الأسرة؟ (أرسل رقماً بين 1 و50)"

STATE: collecting_household
  - Validate input is a number between 1 and 50
  - If invalid: re-send the same question
  - Save to session.data.numberOfPeopleInHousehold
  - Move to collecting_need
  - Ask user to select their MOST urgent need with a numbered list:
    1. طعام  2. مياه  3. مأوى  4. رعاية طبية  5. ملابس  6. مستلزمات أطفال  7. دعم نفسي  8. وثائق قانونية
    (maps to: food, water, shelter, medical, clothing, baby_supplies, psychosocial, legal_docs)

STATE: collecting_need
  - Accept a number 1–8 mapping to the needs list above
  - If invalid: re-send the same question
  - Save need (English key, not Arabic label) to session.data.needs as a single-item array
  - Write a new submission to Firestore through Zod validation:
    {
      fullName: session.data.name,
      currentGovernorate: session.data.currentGovernorate,
      numberOfPeopleInHousehold: session.data.numberOfPeopleInHousehold,
      needs: session.data.needs,
      // PII: admin + Cloud Functions only. Never expose to members.
      whatsappPhone: phone,
      source: 'whatsapp',
      status: 'pending',
      // consentGiven: true — user initiating contact via WhatsApp constitutes consent per Nasna's
      // terms of service. This assumption must be reviewed with legal before production launch.
      consentGiven: true,
      createdAt: FieldValue.serverTimestamp(),
      locationType: 'with_family',  // safe default for WhatsApp registrations
      urgency: 'medium',            // safe default — agents can update
    }
  - Move session to state: 'done'
  - Reply: "تم تسجيلك بنجاح. رقم حالتك هو: {{submissionId}}. احتفظ بهذا الرقم — يمكنك إرساله في أي وقت للاستفسار عن حالتك."
  - Delete the wa_session document (cleanup)

STATE: checking_status
  - User sends a submission ID string
  - Query Firestore: submissions where document ID === provided ID AND whatsappPhone === phone
    (the whatsappPhone match prevents a user from checking someone else's case by guessing an ID)
  - If found: reply with the status in the user's language. Map status values:
      pending → "قيد الانتظار" / "Pending" / "En attente"
      assigned → "تم التعيين" / "Assigned" / "Assigné"
      completed → "مكتمل" / "Completed" / "Complété"
      cancelled → "ملغى" / "Cancelled" / "Annulé"
  - If not found: "لم يتم العثور على حالة بهذا الرقم. تأكد من الرقم وحاول مجدداً."

Language switching: at ANY state, if user sends "EN", "FR", or "AR":
  - Update session.lang
  - Re-send the current state's prompt in the new language
  - Do not advance the state

---

PART C — onCaseAssigned WhatsApp template notification

File: functions/src/dispatchEngine.ts (already exists — update the onCaseAssigned trigger)

IMPORTANT: This notification is outbound-initiated (the user did not message first within 24h).
Meta requires a pre-approved message template for this. The template must be created and approved
in Meta Business Manager before this code can run successfully.

Build the function template-ready with a placeholder template name. The developer will replace
the placeholder with the approved template name once it's approved in Meta.

When a case is assigned and submission.whatsappPhone is set:
  POST https://graph.facebook.com/v19.0/${process.env.META_WA_PHONE_NUMBER_ID}/messages
  Body: {
    messaging_product: 'whatsapp',
    // PII: whatsappPhone is the recipient — never log this value
    to: submission.whatsappPhone,
    type: 'template',
    template: {
      // PLACEHOLDER: replace 'nasna_case_assigned' with your approved Meta template name
      name: 'nasna_case_assigned',
      language: { code: session.lang === 'fr' ? 'fr' : session.lang === 'en' ? 'en' : 'ar' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: submissionId },         // {{1}} in template: case ID
          { type: 'text', text: assignedToOrgName },    // {{2}} in template: org name
        ]
      }]
    }
  }

The template body in Meta Business Manager should read (Arabic version):
  "تم تعيين حالتك ({{1}}) إلى {{2}}. سيتواصلون معك قريباً."
  (English: "Your case ({{1}}) has been assigned to {{2}}. They will contact you soon.")

Do NOT include phone numbers, addresses, or any other PII in template parameters.
Log errors from the API call but never log the whatsappPhone value.
After sending, write a notification record to the notifications collection as normal.

---

PART D — Small frontend change

File: src/Screens/Public/Home.tsx (or equivalent landing page)
Add a WhatsApp registration CTA section:
  - Shows the Nasna WhatsApp number. Store the number in src/config.ts as:
      export const NASNA_WHATSAPP_NUMBER = '961XXXXXXXX'; // developer fills this in
    Never hardcode it in the component.
  - Three short explanatory lines in ar/en/fr (see i18n keys below)
  - A "Register via WhatsApp" button/link: href="https://wa.me/${NASNA_WHATSAPP_NUMBER}", target="_blank"
  - Add all strings to ar/, en/, fr/ locales under the key namespace 'home.whatsappCta'

i18n keys to add (add to all three locale files):
  home.whatsappCta.title
  home.whatsappCta.description
  home.whatsappCta.buttonLabel

---

PART E — Firestore rules

Update firestore.rules:
  - wa_sessions: no client access at all:
      match /wa_sessions/{phone} {
        allow read, write: if false;
      }
  - whatsappPhone field on submissions: enforce field-level protection in the Cloud Function
    that serves member data (strip whatsappPhone before returning data to members), not via
    raw Firestore rules — Firestore rules cannot mask individual fields.

---

COMPLETION CHECKLIST:
- [ ] pnpm tsc exits 0 (including functions/)
- [ ] pnpm format exits 0
- [ ] All 4 secrets declared in functions and accessed via process.env — no hardcoded values
- [ ] After deploying: developer must paste the Cloud Function URL into WhatsApp > Configuration > Callback URL
      and enter their chosen META_WA_VERIFY_TOKEN string, then click "Verify and save"
- [ ] After webhook verified: subscribe to the "messages" webhook field in the Configuration page
- [ ] After template written: submit "nasna_case_assigned" template in WhatsApp Manager for approval
- [ ] Before real users: toggle App Mode from Development to Live in the Nasna app dashboard
- [ ] GET handler: returns hub.challenge when verify_token matches, 403 otherwise
- [ ] POST handler: X-Hub-Signature-256 validated using crypto.timingSafeEqual before any processing
- [ ] POST handler: responds 200 immediately before running bot logic
- [ ] Non-text message types handled gracefully (reply + return)
- [ ] Status update events (no messages array) handled silently (200 + return)
- [ ] All 5 bot states implemented with Arabic as default
- [ ] Governorate and need inputs validated — re-prompt on invalid input instead of crashing
- [ ] Language switching (EN/FR/AR) works at any state without advancing state
- [ ] Submission written through Zod validation with consentGiven: true + legal comment
- [ ] whatsappPhone field: // PII: comment on every access
- [ ] whatsappPhone field: never returned in any member-facing Cloud Function or query
- [ ] Status check requires whatsappPhone match (prevents fishing another user's case)
- [ ] onCaseAssigned: sends template message when whatsappPhone present
- [ ] Template name clearly marked as PLACEHOLDER with instruction comment
- [ ] wa_sessions: Firestore rule blocks all client access
- [ ] src/config.ts created with NASNA_WHATSAPP_NUMBER placeholder
- [ ] Frontend WhatsApp CTA added with ar/en/fr strings under home.whatsappCta
```

---

## Phase 4 — Impact Dashboard + Donations

```
You are working on Nasna, a humanitarian aid coordination platform. Stack: React 19 + Vite 7 + TypeScript, Tailwind CSS v4 + shadcn/ui, Firebase (Firestore + Cloud Functions v2), i18next (ar/en/fr — Arabic primary). Read CLAUDE.md. Phases 0–3 are complete.

Before writing a single line of code, set up your branch:
  git checkout main
  git pull origin main
  git checkout -b feat/phase-4-impact-dashboard
This branch covers the /stats/global document, Cloud Function stat maintenance, the public ImpactPage, the admin ImpactDashboard with CSV export, and optionally the Stripe donation flow. Do not commit to main directly.

Your task is Phase 4: the public impact dashboard and admin analytics view. The donation feature (Stripe) is optional and should only be implemented if explicitly requested — focus on the dashboard first.

---

PART A — /stats/global document (maintained by Cloud Functions)

This document at /stats/global in Firestore is the single source of truth for all impact numbers.

Fields:
  totalRegistered: number     // incremented by onNewSubmission (Phase 1)
  totalCompleted: number      // incremented by onCaseCompleted (Phase 1)
  totalPeopleHelped: number   // incremented by onCaseCompleted (sum of numberOfPeopleInHousehold)
  totalPending: number        // maintained by onNewSubmission (+1) and onCaseAssigned (-1)
  totalAssigned: number       // maintained by onCaseAssigned (+1) and onCaseCompleted (-1)
  activeNGOs: number          // count of members where validated === true AND currentCaseLoad > 0
  byGovernorate: { [governorate: string]: number }  // cases per governorate (totalRegistered breakdown)
  byNeed: { [need: string]: number }  // registrations per need type
  lastUpdatedAt: Timestamp

Update Cloud Functions from Phase 1 (onNewSubmission, onCaseAssigned, onCaseCompleted) to maintain all these fields using FieldValue.increment() and set with merge.

Add a new scheduled function dailyStatsSnapshot (daily at 00:00 UTC) that writes a snapshot of /stats/global to /stats/snapshots/{date} for historical charting.

---

PART B — Public ImpactPage

File: src/Screens/Public/ImpactPage.tsx, route /impact
No auth required. Uses onSnapshot on /stats/global for live updates.

Layout:
1. Hero row — 4 large stat cards:
   - Families Registered (totalRegistered)
   - Families Helped (totalCompleted)
   - People Reached (totalPeopleHelped)
   - Active NGOs (activeNGOs)
   All with live number animation on update (use a simple countUp effect or CSS transition)

2. Needs breakdown — horizontal bar chart or visual percentage bars showing byNeed distribution
   Use recharts (already available) or simple CSS bars — no new dependencies

3. Coverage map — simple choropleth or bar chart showing byGovernorate distribution
   Use recharts BarChart. A full Leaflet map is in Phase 5 — keep this simple here.

4. Status split — donut/pie showing pending vs assigned vs completed proportions
   Use recharts PieChart

All numbers must work in Arabic numeral formatting (use i18next's formatNumber or Intl.NumberFormat with locale). RTL layout required.

---

PART C — Admin ImpactDashboard

File: src/Screens/Admin/ImpactDashboard.tsx, route /admin/impact
Requires admin auth.

Shows everything in Part B plus:
- Time-series line chart of daily registrations (from /stats/snapshots/* collection)
- Breakdown table: each active NGO with their currentCaseLoad, total cases completed (query needed), governorates covered
- CSV export button: exports the snapshot data as a downloadable CSV file
  - CSV must be generated client-side (use the same native Blob + URL.createObjectURL approach from BulkUpload.tsx — no new library needed)
  - Filename: nasna_impact_export_{date}.csv
  - Columns: date, totalRegistered, totalCompleted, totalPeopleHelped, totalPending, totalAssigned
- Use onSnapshot on /stats/global for the live numbers section

Add route and nav link.

---

PART D — i18n

All strings in ar/, en/, fr/. Keys:
  - impact.title, impact.familiesRegistered, impact.familiesHelped, impact.peopleReached, impact.activeNGOs
  - impact.needsBreakdown, impact.coverageByArea, impact.statusSplit
  - impact.admin.export, impact.admin.downloadCsv, impact.admin.ngoBreakdown

---

PART E — Firestore rules

  - /stats/global: read all (including unauthenticated). Write Cloud Functions service account only.
  - /stats/snapshots/{date}: read all. Write Cloud Functions service account only.

---

OPTIONAL — Donation feature (implement ONLY if requested)

If the user asks for donations, implement after the dashboard above:
- Install stripe: ^14.x to functions/package.json
- STRIPE_SECRET_KEY must be set in Secret Manager
- Cloud Function createDonationSession (callable): creates a Stripe Checkout session and returns the session URL
- Frontend: DonationWidget component with three tiers (fund a family / fund a center / fund an NGO) that calls the CF and redirects to Stripe Checkout
- On Stripe success webhook: write donation record to /donations/{id} with amount, currency, tier, timestamp
- Public: show total donations on ImpactPage if this feature is live

---

COMPLETION CHECKLIST:
- [ ] pnpm format exits 0
- [ ] pnpm tsc exits 0 (including functions/)
- [ ] /stats/global maintained correctly by Phase 1 CFs (verify with manual test data)
- [ ] dailyStatsSnapshot scheduled function writes to /stats/snapshots/{date}
- [ ] Public ImpactPage: live via onSnapshot, all 4 stat cards correct
- [ ] Needs breakdown chart renders with Arabic labels
- [ ] Governorate chart renders
- [ ] Status donut renders
- [ ] RTL layout correct for Arabic
- [ ] Admin ImpactDashboard: time-series chart from snapshots
- [ ] CSV export: downloads correct data, no library needed
- [ ] Firestore rules for /stats/* collections
- [ ] All strings in ar/, en/, fr/
```

---

## Phase 5 — Operations Map + Public Centers Map

```
You are working on Nasna, a humanitarian aid coordination platform. Stack: React 19 + Vite 7 + TypeScript, Tailwind CSS v4 + shadcn/ui, Firebase (Firestore + Cloud Functions v2), i18next (ar/en/fr), react-leaflet (Leaflet 1.9 — already installed). Read CLAUDE.md. Phases 0–4 are complete.

Before writing a single line of code, set up your branch:
  git checkout main
  git pull origin main
  git checkout -b feat/phase-5-operations-map
This branch covers: (1) the full-screen admin Leaflet map, and (2) improvements to the public /centers-map page. Do not commit to main directly.

react-leaflet is already in package.json — do not install additional map libraries.

---

PART A — Data model fix: normalize `active` field + add coordinates and public fields to CenterDocument

This must be done first, before any UI work, as every other part depends on it.

1. In src/types/index.ts, update CenterDocument:
   - Rename `isActive: boolean` → `active: boolean`
   - The `coordinates?: { lat: number; lng: number }` field already exists — keep it
   - Add these optional public-facing fields (NOT PII — safe to show to all users):
       phone?: string;                    // public contact number for the center
       aidServices?: string[];            // e.g. ['food', 'medical', 'clothing']
       operatingHours?: string;           // e.g. "Mon–Fri 8:00–17:00"
       intakeOpen?: boolean;              // true = accepting new arrivals, false = full/closed

2. In src/Screens/Admin/CenterManagement.tsx:
   - Rename `isActive` → `active` in the Zod schema and all form refs/values
   - Add coordinate input fields (lat, lng) as optional number inputs — simple text inputs labeled
     "Latitude" / "Longitude" with a small helper text "Find coordinates at maps.google.com"
   - Add optional inputs for: phone, aidServices (multi-select checkboxes using the same
     pattern as facilities), operatingHours (text input), intakeOpen (boolean toggle)
   - aidServices options: ['food', 'water', 'medical', 'clothing', 'shelter', 'legal', 'psychosocial']
   - Update the Firestore write (addDoc / updateDoc) to spread the new fields — they are all optional
     so existing centers without them will still work
   - Update the Zod create/write rule in firestore.rules: the `allow write: if isAdmin()` rule on
     /centers already covers this — no rule change needed for the new fields

3. In src/services/operationsMap.ts, update getPublicCentersMapData:
   - CenterMarker interface: add phone?, aidServices?, operatingHours?, intakeOpen? fields
   - In the mapping function, use stored coordinates when available:
       lat: (d.coordinates as { lat: number; lng: number } | undefined)?.lat ?? getCoordinates(d.governorate as string).lat,
       lng: (d.coordinates as { lat: number; lng: number } | undefined)?.lng ?? getCoordinates(d.governorate as string).lng,
   - Map the new fields through (they are public — no PII concern):
       phone: (d.phone as string | undefined) ?? undefined,
       aidServices: (d.aidServices as string[] | undefined) ?? [],
       operatingHours: (d.operatingHours as string | undefined) ?? undefined,
       intakeOpen: (d.intakeOpen as boolean | undefined) ?? undefined,
   - Update the centers query to use `where('active', '==', true)` — this is already correct
     but note: the Firestore rule checks `resource.data.active` (NOT `isActive`) so the field
     name in data MUST be `active`. The CenterManagement fix above ensures new writes use `active`.

4. In src/Screens/Admin/OperationsMap.tsx (the admin map — Part B below):
   - Update the admin centers layer query from `where('isActive', '==', true)` to `where('active', '==', true)`

---

PART B — Admin OperationsMap screen

File: src/Screens/Admin/OperationsMap.tsx, route /manage/map

This is a full-screen (or near full-screen) admin view with a Leaflet map centered on Lebanon
(lat: 33.8547, lng: 35.8623, zoom: 8) and a collapsible filter panel.

Map layers to implement (all toggleable via the filter panel):

1. SUBMISSION PINS
   - Query submissions with status filter (see filter panel below)
   - Color by urgency derived from staleFlagged and status:
     - Red: staleFlagged === true
     - Orange: status === 'pending' AND createdAt older than 24h
     - Yellow: status === 'pending' AND createdAt within 24h
     - Blue: status === 'assigned' or 'in_progress'
     - Green: status === 'completed'
   - Use CircleMarker (not default icon) for performance
   - Cluster at zoom < 11: implement simple grid clustering using divIcon with a count label —
     do NOT install Leaflet.markercluster
   - Popup: case ID, governorate, needs badges, status, time since creation
     NO full name or phone number in any popup (PII rule — hard rule from CLAUDE.md)
   - Query must use limit(200). Show a dismissible banner if results are capped.

2. NGO COVERAGE ZONES (off by default)
   - Query members where validated === true AND coverageGovernorates is not empty, limit(50)
   - Draw semi-transparent Polygon per covered governorate
   - Hardcode simplified GeoJSON polygons for Lebanon's 8 governorates directly in the file
     (Akkar, North Lebanon, Baalbek-Hermel, Bekaa, Mount Lebanon, Beirut, South Lebanon, Nabatieh)
   - Hover shows NGO name and currentCaseLoad/maxCaseLoad

3. CENTER MARKERS
   - Query centers where active === true, limit(200)
   - Use stored coordinates (coordinates.lat / coordinates.lng) — fall back to governorate centroid
     only when coordinates are not set
   - DivIcon colored by occupancy: green < 75%, yellow 75–90%, red > 90%
   - Popup: name, type, currentOccupancy/totalCapacity, facilities, intakeOpen status

4. HOUSING PINS (off by default)
   - Query housing where status === 'available', limit(200)
   - Simple house divIcon
   - Popup: type, governorate, capacity, priceType, availableFrom
     NO listerName or listerPhone (PII)

---

PART C — Admin filter panel

Collapsible side panel (right side, slides in/out):
  - Date range: Last 24h / 48h / 7 days / All time
  - Status checkboxes: pending / assigned / in_progress / completed / cancelled
  - Needs filter: food / water / shelter / medical / clothing / legal / psychosocial
  - Stale only toggle
  - Layer toggles: one per layer

Filter changes re-run getDocs (not onSnapshot) — add a manual Refresh button.
Center and housing layers use onSnapshot since those collections are small.

---

PART D — Public CentersMap improvements (src/Screens/Public/CentersMap.tsx)

The /centers-map page already exists and now loads correctly after the Firestore rule fix
(active field, housing approved status). This part upgrades it for phone-first users.

The page is primarily used on phones by people in crisis. Design accordingly.

1. MOBILE-FIRST LAYOUT
   - On mobile (< lg breakpoint): the layer controls panel moves to a bottom sheet that slides
     up from the bottom of the screen. Use a drag handle or a "Layers ▲" button fixed at the
     bottom of the viewport to open/close it. The map takes the full viewport height on mobile.
   - On desktop (≥ lg): keep the current sidebar layout (left panel + right map)
   - The map container height: `h-[calc(100vh-4rem)]` on mobile (full minus navbar),
     `h-[580px]` on desktop — this makes the map the primary focus on phones

2. DISPLACEMENT SITE POPUP — get directions
   - In the CircleMarker popup for displacement sites, add a "Get Directions" link:
       <a href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`} target="_blank" rel="noopener noreferrer">
         {t('centersMap.getDirections')}
       </a>
   - Style it as a teal button (matching brand color #12a89d) inside the popup
   - Also make the phone number tappable: <a href={`tel:${site.phone_number}`}>{site.phone_number}</a>

3. CENTER POPUP — conditional rich info
   - Update the Marker popup for aid centers to show the new fields when available:
       - Phone: render as <a href={`tel:${center.phone}`}> if center.phone is set
       - Aid services: render as small badges (same style as needs badges elsewhere in the app)
         if center.aidServices has entries
       - Operating hours: plain text line if center.operatingHours is set
       - Intake status: show a green "Open" or red "Full / Closed" badge based on center.intakeOpen.
         If intakeOpen is undefined, derive it: intakeOpen = center.occupiedCapacity < center.capacity
   - Capacity: show a small inline progress bar (occupiedCapacity / capacity) — already shown as
     text, upgrade to a visual bar
   - Fallback gracefully: if a field is not set, do not render that row at all

4. STAT CARDS
   - The three stat cards at the top (Aid centers, Displacement sites, Available housing spots)
     take too much vertical space on mobile. On mobile (< sm), collapse them into a single
     horizontal scroll row of compact pill-shaped cards. On desktop keep the current 3-col grid.

5. I18N additions for Part D
   Add to src/locales/ar/centersMap.json, en/centersMap.json, fr/centersMap.json:
     centersMap.getDirections, centersMap.intakeOpen, centersMap.intakeClosed,
     centersMap.aidServices, centersMap.operatingHours, centersMap.phone,
     centersMap.layers (for the mobile bottom sheet button label)

---

PART E — Admin i18n

All admin map panel and popup strings in ar/, en/, fr/ under the `map` namespace:
  - map.title, map.refresh, map.filters.dateRange, map.filters.status, map.filters.needs
  - map.filters.staleOnly, map.layers.*
  - map.popup.caseId, map.popup.status, map.popup.needs, map.popup.stale, map.popup.timeSince
  - map.popup.center.name, map.popup.center.occupancy, map.popup.center.facilities
  - map.popup.center.intakeOpen, map.popup.center.intakeClosed
  - map.popup.housing.type, map.popup.housing.capacity, map.popup.housing.priceType
  - map.limitWarning

---

PART F — Routing and nav

- Admin map route: /manage/map (not /admin/map — follow existing admin route prefix)
- Add nav link to admin sidebar
- The admin map screen should use a full-bleed layout variant (no page padding wrapper)
- Public /centers-map route already exists — no routing changes needed there

---

COMPLETION CHECKLIST:
- [ ] pnpm format exits 0
- [ ] pnpm tsc exits 0
- [ ] CenterDocument: `active` field (not `isActive`), new optional public fields added to type
- [ ] CenterManagement: `active` toggle, lat/lng inputs, phone/aidServices/operatingHours/intakeOpen inputs
- [ ] getPublicCentersMapData: uses stored coordinates when available, falls back to centroid
- [ ] Admin map: centered on Lebanon, all 4 layers render
- [ ] Admin map: centers queried with `where('active', '==', true)`
- [ ] Submission pins: correct urgency colors, NO PII in popups
- [ ] Submission query uses limit(200), capped banner shown
- [ ] NGO zones: off by default, hover shows NGO name + caseload
- [ ] All 4 admin layers independently toggleable
- [ ] Admin filter panel: date range, status, needs, stale — all working
- [ ] getDocs for submissions, Refresh button present
- [ ] Public map: mobile bottom sheet for layer controls
- [ ] Public map: map fills full viewport height on mobile
- [ ] Public map: stat cards collapse to horizontal scroll row on mobile
- [ ] Public displacement popup: tappable Get Directions link, tappable tel: phone
- [ ] Public center popup: phone (tel:), aidServices badges, hours, intake badge — all conditional
- [ ] Public center popup: occupancy progress bar
- [ ] All new strings in ar/, en/, fr/
- [ ] RTL layout correct in Arabic for both admin panel and public bottom sheet
```
