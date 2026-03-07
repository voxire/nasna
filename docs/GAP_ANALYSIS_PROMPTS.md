# Nasna v2.0 — Gap Analysis & Claude Code Prompts

> Cross-referencing `USER_WORKFLOWS.md` against the actual codebase.
> Acting as product manager — every gap is confirmed against source code before being listed.
> Last updated: March 2026

---

## Gap Summary Table

| # | Gap | Workflow Affected | Severity | Effort |
|---|-----|------------------|----------|--------|
| G1 | Agent has no submission detail view | Agent | HIGH | S |
| G2 | NGO first-login not redirected to coverage setup | NGO Member | HIGH | S |
| G3 | Admin layout redirects to `/` instead of `/auth/login` | Admin | MEDIUM | XS |
| G4 | `/login` URL returns 404, no redirect | All | MEDIUM | XS |
| G5 | `OfferHousing` shows generic toast, no inline field errors | Public | MEDIUM | S |
| G6 | SendGrid email not wired — notifications written but never sent | Admin / NGO | HIGH | M |
| G7 | `enableIndexedDbPersistence` deprecated, fires 30× per load | All | LOW | XS |
| G8 | Phase 3 — WhatsApp Bot entirely unbuilt | Displaced Person | CRITICAL | XL |

> **Effort key:** XS = < 1 hour · S = half day · M = 1–2 days · L = 1 week · XL = 3–4 weeks

---

## Gaps NOT Listed (confirmed already fixed by code inspection)

The following bugs were reported in `MANUAL_TEST_REPORT.md` but are **already resolved in the codebase** — the i18n keys exist in all three locales and the components use `t()` correctly. The testing browser was likely set to English at that point.

- Bug #3 `/emergency` — `ar/emergency.json` has all keys, component uses `t()` throughout ✅
- Bug #5 `/terms` — `Terms.tsx` uses `t()`, `ar/terms.json` has all 8 section bodies ✅
- Bug #7 `404` — `ar/common.json` has `notFound` and `goBack` keys ✅
- Bug #8 login OR divider — `ar/login.json` has `"or": "أو"` ✅
- Bug #9 `/auth/agent` — `ar/auth.json` has full `agent` block with all labels ✅
- Bug #10 forgot password — close button uses `t('login.buttons.cancel')` → `"إلغاء"` ✅

The real i18n bug that survives scrutiny is **Bug #1** (submission `locationType` label/options) and **Bug #4** (`/about` CTA button) — both have missing or mismatched keys in the Arabic locale. These are folded into G1's prompt below since they're same-day fixes.

---

## Claude Code Prompts

Each prompt is self-contained. Copy and paste into a Claude Code session pointed at the Nasna repo root.

---

### G1 — Agent Submission Detail View

**The gap:** `AgentSubmissions.tsx` renders a table of submissions but the rows are not clickable. There is no route `/agent/submissions/:id`. Agents cannot track the status or timeline of cases they submitted. The tech spec says *"SubmissionDetail view for agents and NGOs"* but only NGOs have `CaseDetail`.

**Also fix in this branch:** Bug #1 — `ar/submission.json` is missing i18n keys for `locationType` toggle label and option labels used in `CreateSubmission.tsx`.

---

```
You are working on the Nasna humanitarian aid platform (React 19 + Vite 7 + TypeScript + Firebase + Tailwind + shadcn/ui + i18next).

Create a git branch for this work:
  git checkout -b feat/agent-submission-detail

TASK 1 — Agent Submission Detail Screen
=======================================

Create a new screen: src/Screens/Private/AgentSubmissionDetail.tsx

This screen is for AGENTS (role: 'agent') only. It shows the full details of a
submission the agent created, including its current status and timeline.

Requirements:
- Route: /agent/submissions/:id  (add to src/Routes/PrivateRoutes.tsx, wrapped in PrivateRoute allowedRoles={['agent']} requireValidated, inside <Private> layout)
- Fetch the submission using onSnapshot (doc(db, 'submissions', id)) — live updates
- Guard: if the submission.agent !== auth.currentUser.uid, show an "access denied" message and a back button (agents may not view other agents' submissions)
- Display: fullName (masked to first name + last initial for PII), governorate, locationType + center name if applicable, ageRanges table, needs badges (AidTypeCheckboxGrid read-only style), aidUrgency, status (use CaseStatusBadge), registrationDate, comments
- Show a CaseTimeline component below the details (pass the submission data)
- Do NOT show phoneNumber, emailAddress, whatsappPhone to agent — these are PII fields visible only to admin
- Add a "Back to my submissions" link → /agent/submissions
- Handle loading state with a spinner and error state with a user-facing message
- All strings via i18next — add keys to ar/, en/, fr/ locale files under submission.agentDetail namespace

TASK 2 — Make AgentSubmissions rows clickable
=============================================

In src/Screens/Private/AgentSubmissions.tsx:
- Wrap each TableRow in a Link or add onClick → navigate(`/agent/submissions/${submission.id}`)
- Add a ChevronRight icon at the end of each row to indicate it is clickable
- Add cursor-pointer styling to rows

TASK 3 — Fix locationType i18n keys (Bug #1)
============================================

In src/locales/ar/submission.json, check for and add any missing keys used in
CreateSubmission.tsx for the locationType toggle and its options:
  submission.locationType.label
  submission.locationType.withFamily
  submission.locationType.center
Confirm the same keys exist in en/ and fr/ locale files. Add placeholders if missing.

TASK 4 — Fix /about CTA button label (Bug #4b)
==============================================

In src/Screens/Public/About.tsx, find the "Get Involved" / volunteer CTA button.
Confirm it uses a t() key. Check ar/about.json for the matching key — if the key
resolves to English text in Arabic mode, fix the Arabic translation string.

Conventions to follow:
- No `any` types — use `unknown` and narrow, or define proper interfaces
- All Firebase calls stay in services/ or inline with onSnapshot — never raw getDocs
- No console.log of PII fields
- All strings through i18next — no hardcoded UI text
- Use existing shadcn/ui components from src/Components/ui/
```

---

### G2 — NGO First-Login Onboarding Redirect

**The gap:** When a newly validated NGO member logs in for the first time, they land wherever the default route sends them — there is no check on the `onboarded` field and no automatic redirect to `/ngo/profile-coverage`. Without completing their coverage profile (governorates, aid types, capacity), the matching engine in `onNewSubmission` will never match them to any case. They will see an empty case feed and not know why.

---

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b feat/ngo-onboarding-redirect

TASK — Enforce NGO coverage profile setup on first login
=========================================================

Context:
- MemberDocument has an `onboarded?: boolean` field (src/types/index.ts)
- ProfileCoverage screen is at /ngo/profile-coverage
- When an NGO completes their coverage profile, onboarded should be set to true
- Currently, PrivateRoute does NOT check the onboarded field

Changes needed:

1. src/Components/PrivateRoute.tsx
   - After existing auth + role + validated checks, add: if role === 'member' and
     onboarded !== true and the current path is NOT '/ngo/profile-coverage',
     redirect to '/ngo/profile-coverage'
   - Read onboarded from the auth store (useAuthStore)

2. src/stores/authStore.ts (or wherever auth state is managed)
   - Ensure the `onboarded` field from the Firestore members/{uid} document is loaded
     into auth state when the user signs in, alongside role and validated
   - If onboarded is not already in the store, add it

3. src/Screens/Private/ProfileCoverage.tsx
   - After a successful coverage profile save (updateMemberCoverageProfile callable),
     also write `onboarded: true` to members/{uid} in Firestore
   - Update the auth store's onboarded field to true so the redirect guard lifts
   - After saving, show a success toast and navigate to /ngo/submissions

4. Add i18n keys for any new UI strings (onboarding banner, redirect notice) in
   ar/, en/, fr/ locale files.

Important:
- The redirect must only trigger for role === 'member'. Agents are NOT redirected.
- The onboarded check must not block access to /ngo/profile-coverage itself (avoid redirect loop).
- Do not block validated === false users here — that's already handled upstream by requireValidated.
```

---

### G3 — Admin Layout Redirects to `/` Instead of `/auth/login`

**The gap:** `src/Layout/Admin/Admin.tsx` line: `return <Navigate to="/" replace />` when `!user || role !== 'admin'`. This sends unauthenticated users to the home page instead of the login page. This is both a UX problem (user doesn't know they need to log in) and an inconsistency with `PrivateRoute`, which correctly redirects to `/auth/login`.

---

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b fix/admin-auth-redirect

TASK — Fix admin layout unauthenticated redirect
=================================================

File: src/Layout/Admin/Admin.tsx

Current code (around line 28):
  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

Required change:
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

Rationale: Split the two cases.
- Unauthenticated user (no Firebase session) → send to login page
- Authenticated but wrong role → send to home (not a login issue, they are logged in)

No other changes needed. This is a one-line split.

After making the change, verify that:
- Navigating to /manage while logged out redirects to /auth/login
- Navigating to /manage while logged in as agent or member redirects to /
- Navigating to /manage while logged in as admin works normally
```

---

### G4 — `/login` URL Returns 404

**The gap:** The correct login URL is `/auth/login`, but `/login` is a natural URL users and external links will type. Currently it returns a 404. This affects all roles — displaced people, NGO staff, agents who may share the link or bookmark it incorrectly.

---

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b fix/login-redirect

TASK — Add /login redirect to /auth/login
==========================================

File: src/App.tsx (or wherever the top-level routes are defined)

Add a redirect route:
  { path: '/login', element: <Navigate to="/auth/login" replace /> }

Also add these common alias redirects while you're here:
  { path: '/register', element: <Navigate to="/auth/register" replace /> }
  { path: '/admin', element: <Navigate to="/manage" replace /> }
  { path: '/dashboard', element: <Navigate to="/manage" replace /> }

These cost nothing to add and eliminate the most common navigation dead-ends.

Use React Router's <Navigate> component with replace={true} so the redirect
does not pollute browser history.

No i18n changes needed.
```

---

### G5 — OfferHousing Has No Inline Field Validation Errors

**The gap:** `OfferHousing.tsx` uses a plain `<form>` with a manual Zod `safeParse`. When validation fails, it shows a generic toast (`"Please fill in all required fields"`) with no indication of which field is wrong. Users don't know what to fix. The form uses controlled state — not React Hook Form — so adding inline errors requires either migrating to RHF or adding manual error state.

---

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b fix/offer-housing-validation

TASK — Add inline field validation to OfferHousing form
========================================================

File: src/Screens/Public/OfferHousing.tsx

The form currently uses controlled useState + manual Zod safeParse. The validation
fires on submit and shows a generic toast. Add inline field-level error display.

Approach — keep the existing controlled state pattern, add a parallel errors state:

  const [errors, setErrors] = useState<Partial<Record<keyof typeof housingSchema.shape, string>>>({});

On submit:
  const result = housingSchema.safeParse(formState);
  if (!result.success) {
    const fieldErrors: typeof errors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (field) fieldErrors[field] = issue.message;
    }
    setErrors(fieldErrors);
    return;  // remove the generic toast — inline errors replace it
  }
  setErrors({});  // clear on success

For each form field, add a conditional error message below the input:
  {errors.hostName && (
    <p className="text-sm text-red-500 mt-1">{t('validation.required')}</p>
  )}

Use the existing ar/validation.json and en/validation.json for error strings.
If a needed key is missing, add it to all three locale files.

Fields that need inline errors: hostName, hostPhone, area, address, capacity,
availableSpots, priceType.

Clear individual field error on onChange of that field (improves UX so the error
disappears as soon as the user starts correcting it).

Also add the missing availableFrom date field to the form — the HousingDocument
type requires it (`availableFrom: Timestamp`) but the current form has no date
picker for it. Use a native <input type="date"> and convert to a Firebase
Timestamp on submit. Add the matching i18n keys.
```

---

### G6 — SendGrid Email Not Wired Up

**The gap:** `functions/src/dispatchEngine.ts` writes notification records to Firestore with `channel: 'email'` but **never actually sends an email**. `@sendgrid/mail` is not in `functions/package.json`. The two places that need real emails are: (1) `onNewSubmission` — notify matched NGOs of a new case; (2) `dailyStaleCaseCheck` — alert admin of stale cases.

---

```
You are working on the Nasna humanitarian aid platform — Firebase Cloud Functions (TypeScript, Functions v2).

Create a git branch:
  git checkout -b feat/sendgrid-email-notifications

TASK — Wire up SendGrid transactional email in dispatchEngine
==============================================================

STEP 1 — Install dependency
  cd functions
  npm install @sendgrid/mail

STEP 2 — Environment variables
  These will be set by the team via Firebase Functions config or Secret Manager.
  In the functions code, read them as:
    process.env.SENDGRID_API_KEY
    process.env.ADMIN_EMAIL
  Add a comment: // Set via: firebase functions:secrets:set SENDGRID_API_KEY

STEP 3 — Create functions/src/email.ts
  Export two functions:

  sendNgoNewCaseAlert(options: {
    recipientEmail: string;
    recipientName: string;
    governorate: string;
    needs: string[];
    urgency: string;
    caseCount: number;  // total pending in their area
  }): Promise<void>

  sendAdminStaleCasesAlert(options: {
    adminEmail: string;
    staleCaseIds: string[];
    staleCaseCount: number;
  }): Promise<void>

  CRITICAL — PII rules:
  - Do NOT include fullName, phoneNumber, whatsappPhone in any email body
  - Include ONLY: urgency level, governorate, needs[] array, submission ID
  - The NGO should see "New case in Beirut — needs: food, medical — High urgency"
    NOT the family's personal details

  Email subjects and bodies should be in English (NGO-facing emails are sent to
  validated NGO staff who are bilingual; Arabic bot messages are handled in Phase 3).

STEP 4 — Wire into dispatchEngine.ts

  In onNewSubmission, after writing notification records, call sendNgoNewCaseAlert
  for each matched NGO member who has an email address.

  In dailyStaleCaseCheck, after setting staleFlagged on cases, call
  sendAdminStaleCasesAlert if staleCaseIds.length > 0.

  Wrap both email calls in try/catch — email failure must NEVER cause the
  Cloud Function to throw or fail the Firestore write. Log the error with
  logger.error() but allow the function to complete.

STEP 5 — Update notification records
  After a successful sendNgoNewCaseAlert call, update the notification record's
  status from 'pending' to 'sent' and set sentAt to Timestamp.now().
  On failure, update to 'failed'.

Add TypeScript types for all parameters. No `any`.
```

---

### G7 — Firestore `enableIndexedDbPersistence` Deprecation

**The gap:** `src/firebase.ts` calls `enableIndexedDbPersistence(db)` which was deprecated in Firebase JS SDK v9.10+ and removed in v12. It fires a deprecation warning ~30 times per page load because the module is re-evaluated on each navigation. The modern replacement is passing `persistentLocalCache()` to `initializeFirestore()`.

---

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b fix/firestore-persistence-api

TASK — Migrate to new Firestore persistence API
================================================

File: src/firebase.ts

Current code (approximate):
  import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';
  const db = getFirestore(app);
  void enableIndexedDbPersistence(db).catch(() => { ... });

New code:
  import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
  } from 'firebase/firestore';

  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

Notes:
- Remove the `enableIndexedDbPersistence` import and call entirely
- `persistentMultipleTabManager()` is the correct replacement for multi-tab support
  (equivalent to what enableIndexedDbPersistence provided)
- If the build or tests show that `persistentMultipleTabManager` is unavailable
  in the installed Firebase version, fall back to `persistentSingleTabManager()`
  and add a comment explaining why
- No other files need to change — db is still exported the same way
- Verify the app still compiles and runs without the deprecation warning
```

---

### G8 — Phase 3: WhatsApp Bot (Entire Phase)

**The gap:** Nothing in Phase 3 has been built. No Twilio integration, no `wa_sessions` collection, no webhook function, no bot state machine, no QR codes. This is the only path for displaced people to self-register without a field agent — the most critical user workflow for the people the platform exists to serve.

This is an XL task. Break it into four separate branches/PRs as described below.

---

#### G8a — `wa_sessions` Collection + Security Rules

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b feat/wa-sessions-collection

TASK — Add wa_sessions Firestore collection and security rules
==============================================================

STEP 1 — Add WaSession type to src/types/index.ts

  // PII: Cloud Functions service account only. Never expose to client.
  export type BotStep =
    | 'new'
    | 'awaiting_name'
    | 'awaiting_area'
    | 'awaiting_household'
    | 'awaiting_need'
    | 'complete'
    | 'status_check';

  export type BotLanguage = 'ar' | 'en' | 'fr';

  export interface WaSessionDocument {
    phone: string;            // PII: Cloud Functions only
    step: BotStep;
    language: BotLanguage;
    data: {
      name?: string;          // PII: Cloud Functions only
      area?: string;
      householdSize?: number;
      mainNeed?: string;
    };
    submissionId?: string;    // set after registration completes
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

STEP 2 — Update firestore.rules

  Add the following rule (wa_sessions must have NO client access):

  match /wa_sessions/{phone} {
    allow read, write: if false;
    // This collection is managed exclusively by Cloud Functions service account.
    // No client — authenticated or not — may read or write to this collection.
  }

  Also add/confirm:
  match /submissions/{id} {
    // Existing rules — confirm whatsappPhone is not readable by members
    // Members may read: all fields EXCEPT whatsappPhone
    // Use field masks in Cloud Functions to enforce this — Firestore rules
    // cannot mask individual fields, so note this as a Cloud Function responsibility
  }

STEP 3 — Add a // PII comment above whatsappPhone in src/types/index.ts
  // PII: admin + Cloud Functions only. Never return to member-facing queries.
  whatsappPhone?: string;

No frontend components needed for this task.
```

---

#### G8b — WhatsApp Webhook Cloud Function

```
You are working on the Nasna humanitarian aid platform — Firebase Cloud Functions (TypeScript, v2).

Create a git branch:
  git checkout -b feat/whatsapp-webhook

TASK — Build whatsappWebhook Cloud Function
===========================================

STEP 1 — Install Twilio
  cd functions
  npm install twilio
  npm install --save-dev @types/twilio

STEP 2 — Create functions/src/whatsappWebhook.ts

  This is an HTTP onRequest function that receives POST webhooks from Twilio
  when a user sends a WhatsApp message to the Nasna number.

  Twilio sends: From (e.g. "whatsapp:+961XXXXXXX"), Body (message text)

  Environment variables (read via process.env):
    TWILIO_ACCOUNT_SID
    TWILIO_AUTH_TOKEN
    TWILIO_WHATSAPP_FROM   (e.g. "whatsapp:+1415XXXXXXX")

  Bot state machine (session stored in wa_sessions/{phone}):

  STATE: 'new'
    Any message → reply with welcome + menu (Arabic default):
    "أهلاً بك في نسنا 🤝\nاضغط 1️⃣ للتسجيل\nاضغط 2️⃣ لمتابعة حالتك"
    Set step → 'awaiting_name' if user sends '1'
    Set step → 'status_check' if user sends '2'
    Language: if message is 'EN' set language='en'; if 'FR' set language='fr'

  STATE: 'awaiting_name'
    Save message text as data.name
    Reply: "كم عدد أفراد أسرتك؟" (or in selected language)
    Set step → 'awaiting_household'

    Wait — the spec says: name → area → household → need
    Follow spec order exactly:
    awaiting_name → save name → ask area → step: awaiting_area
    awaiting_area → save area → ask household size → step: awaiting_household
    awaiting_household → save size → ask main need (numbered menu) → step: awaiting_need
    awaiting_need → save need → write submission → reply with case ID → step: 'complete'

  STATE: 'awaiting_area'
    Save as data.area (Lebanese governorate, free text — bot will accept anything)
    Reply: ask for number of people in household

  STATE: 'awaiting_household'
    Parse as integer — if not a valid number, reply asking again
    Save as data.householdSize
    Reply with needs menu:
    "1. طعام  2. مأوى  3. طبي  4. ملابس  5. أخرى"

  STATE: 'awaiting_need'
    Map input to needs enum:
    '1' → 'food', '2' → 'shelter', '3' → 'medical', '4' → 'clothing', '5' → 'other'
    If unrecognized input → reply asking again, do NOT advance state
    On valid input:
      Write submission to Firestore submissions collection:
        fullName: data.name
        currentGovernorate: data.area
        numberOfPeopleInHousehold: data.householdSize
        needs: [mainNeed]
        source: 'whatsapp'
        whatsappPhone: phone  ← STRIP the "whatsapp:" prefix first
        status: 'pending'
        consentGiven: true  ← user agreed by initiating registration
        gender: 'Male'  ← unknown, set default, admin can update
        previousGovernorate: data.area  ← same as current, agent can update
        street: '', building: '', floor: '', city: ''  ← empty, to be filled
        aidUrgency: 'Medium'  ← default
        registrationDate: Timestamp.now()
        createdAt: Timestamp.now()
      Save submissionId to session
      Set step: 'complete'
      Reply: "تم تسجيلك ✅ رقم حالتك: #[ID]\nاحتفظ بهذا الرقم لمتابعة حالتك لاحقاً."

  STATE: 'status_check'
    User sends any text → look up submissions where whatsappPhone == phone
    Return most recent submission's status in the user's language
    Status map to Arabic:
      pending → "قيد الانتظار — جاري البحث عن منظمة"
      assigned → "تم التعيين — [NGO name if available] سيتواصل معك"
      in_progress → "جاري المعالجة — تم الوصول إليك"
      completed → "مكتملة — تم تقديم المساعدة ✅"
      cancelled → "ملغاة — يرجى التواصل مع المسؤول"

  Language switching: at ANY state, if message === 'EN', 'AR', or 'FR',
  update session.language and reply "Language set to English. Send any message to continue."

  Reply helper: create a sendWhatsApp(to, body) utility using twilio client

  Error handling:
  - All Firestore operations in try/catch — never let the webhook return 500
    (Twilio will retry failed webhooks causing duplicate submissions)
  - Always return HTTP 200 to Twilio, even on internal error
  - Log errors with logger.error() for debugging

STEP 3 — Export from functions/src/index.ts
  export { whatsappWebhook } from './whatsappWebhook';

STEP 4 — PII rules
  - Never log the phone number or any personal data fields
  - Log only: sessionStep, governorate (not person-identifiable), error codes
```

---

#### G8c — WhatsApp Notification in `onCaseAssigned`

```
You are working on the Nasna humanitarian aid platform — Firebase Cloud Functions.

Create a git branch:
  git checkout -b feat/wa-case-assigned-notification

TASK — Send WhatsApp message when a case is assigned
=====================================================

File: functions/src/dispatchEngine.ts

Context:
- onCaseAssigned already fires when submission.status changes to 'assigned'
- It currently writes a notification record to Firestore but sends no WhatsApp message
- The Twilio client and sendWhatsApp helper built in G8b should be imported here

Changes needed:

1. In onCaseAssigned, after writing the notification record:
   a. Check if submission.source === 'whatsapp' AND submission.whatsappPhone exists
   b. If yes, send WhatsApp message via Twilio to submission.whatsappPhone:
      Arabic (default): "تم تعيين حالتك (#[submissionId]) 🤝\n[NGO Name] سيتواصل معك قريباً."
      If member name not available: use "فريق المساعدة"

2. In onCaseCompleted, add optional WhatsApp notification:
   a. Same condition: source === 'whatsapp' AND whatsappPhone exists
   b. Message: "تم إغلاق حالتك (#[submissionId]) ✅\nنشكرك على ثقتك بنسنا."

3. Both notifications must be wrapped in try/catch — failure to send WhatsApp
   must NOT cause the Cloud Function to fail or roll back the Firestore write.

4. PII: Never log whatsappPhone. Log only submissionId and status for debugging.

Import the sendWhatsApp helper from './whatsappWebhook' or refactor it to a
shared utility in functions/src/utils/twilio.ts to avoid circular imports.
```

---

#### G8d — QR Codes for Displacement Centers

```
You are working on the Nasna humanitarian aid platform.

Create a git branch:
  git checkout -b feat/whatsapp-qr-codes

TASK — Add WhatsApp QR code display to Center Management
=========================================================

Context:
- Each displacement center should have a printable QR code that, when scanned,
  opens the Nasna WhatsApp number directly
- The QR code URL format is: https://wa.me/[E164_PHONE_NUMBER]
  where E164_PHONE_NUMBER is the Twilio WhatsApp number without the + (e.g. 14155238886)
- The TWILIO_WHATSAPP_NUMBER should be stored as a public environment variable:
  VITE_WHATSAPP_NUMBER in the .env file (this is NOT secret — it's a public number)

STEP 1 — Install qrcode library
  npm install qrcode
  npm install --save-dev @types/qrcode

STEP 2 — Create src/Components/WhatsAppQRCode.tsx
  Props: { centerName: string }
  - Renders a QR code image using the qrcode library pointing to:
    `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`
  - Below the QR: center name, "Scan to register on Nasna" in Arabic + English
  - Styled for printing (white background, black QR, teal Nasna logo text)
  - Include a "Print" button that calls window.print() with only the QR card visible
    (use a print-specific CSS class to hide the rest of the page)

STEP 3 — Add QR code button to CenterManagement screen
  In src/Screens/Admin/CenterManagement.tsx:
  - Add a "QR Code" button (QrCode icon from lucide-react) on each center row
  - Clicking it opens a Dialog containing <WhatsAppQRCode centerName={center.name} />
  - The dialog has a "Print" button

STEP 4 — Add i18n keys
  ar: "مسح للتسجيل في نسنا"
  en: "Scan to register on Nasna"
  fr: "Scannez pour vous inscrire sur Nasna"
  Add to appropriate locale files (housing.json or a new centers.json).

STEP 5 — Add VITE_WHATSAPP_NUMBER to .env.example
  VITE_WHATSAPP_NUMBER=14155238886
  # This is the public Twilio WhatsApp number (no + prefix for wa.me URLs)
```

---

## Recommended Build Order

Build in this sequence — each item unblocks the next:

```
Week 1
  G3 — Admin redirect fix (30 min, ship immediately)
  G4 — /login redirect (30 min, ship immediately)
  G7 — Firestore deprecation (30 min, ship immediately)

Week 1–2
  G1 — Agent submission detail + i18n bug fixes
  G2 — NGO onboarding redirect
  G5 — OfferHousing inline validation

Week 2–3
  G8a — wa_sessions Firestore rules (prerequisite for G8b)
  G6  — SendGrid email (independent, can run parallel)

Week 3–4
  G8b — WhatsApp webhook Cloud Function (requires G8a)

Week 5–6
  G8c — WhatsApp case-assigned notification (requires G8b)
  G8d — QR codes (requires G8b for the phone number)
```

---

*Nasna Team — Gap Analysis March 2026*
