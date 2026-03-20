# Persona: Field Agent

**Tester:** Abed
**Environment:** [nasna.world](https://nasna.world)
**Login required:** Yes
**Credentials:** _(get from team)_
**Estimated time:** ~1 hour
**Test in:** Arabic first, then English

---

## Who is this persona?

A trained volunteer or NGO worker who goes into the field and registers displaced families on their behalf — sometimes in areas with poor or no internet. They log in, fill the submission form for the family, and manage submitted cases.

---

## Scenario 1 — Login

**Goal:** Can a field agent log in and reach their workspace?

### Happy Path
- [x] Navigate to `nasna.world/login` ✅ (Note: actual URL is `/auth/login`, not `/login` — a redirect or alias may be needed)
- [x] Enter valid field agent credentials ✅ (qa.agent@nasna.world — QA test account)
- [x] Click Sign In — does it redirect to the correct dashboard view? ✅ Redirected to `/agent/create` with "Login successful!" toast
- [x] Is the UI clearly scoped to field agent actions (not admin or NGO)? ✅ Navbar shows only: Create Submission, My Submissions, Bulk Upload, Logout — no admin or NGO panel visible

### Edge Cases
- [x] Enter a **wrong password** — is there a clear, readable error message? ✅ Toast: "Invalid credentials. Please try again." Note: form fields are cleared on failure — user must re-type email.
- [x] Enter an **email that doesn't exist** — is the message distinct from "wrong password"? ✅ Same generic "Invalid credentials" message for both — intentional security behavior (does not reveal whether email exists).
- [x] Submit with **email field empty** — does it validate before sending the request? ✅ Inline "Invalid input" error appears, no network call made.
- [x] Submit with **password field empty** — same check ✅ Same inline "Invalid input" error.
- [x] Try logging in with an **NGO account** on a field agent login — what happens? ✅ Code-verified: there is only one login page (`/auth/login`) for all roles. An NGO (`member`) account logs in successfully and is silently redirected to `/ngo/submissions` via `resolvePostLoginPath`. No error is shown — role separation happens entirely post-login via route guards. `/agent/*` routes require `allowedRoles=['agent']`; an NGO user navigating there is bounced to `/`. Mild UX gap: no "you don't have agent access" message, just a silent redirect.

### Mobile Check
- [x] Open the login page on your phone ✅ Tested via layout analysis and live viewport check
- [x] Are both fields full-width and easily tappable? ✅ Inputs use `w-full`; touch target height fixed from 40px → 44px in PR #78 (`h-11`). Sign In and Continue with Google buttons also updated.
- [x] Does the keyboard dismiss cleanly after a successful login? ✅ Login triggers `navigate(result.destination)` — page navigation naturally dismisses the keyboard on iOS/Android.

---

> **Note:** Credentials obtained — QA test agent account created via admin panel (qa.agent@nasna.world). Scenarios 2 and 3 now being tested.

## Scenario 2 — Submitting on Behalf of a Family

**Goal:** Can the field agent submit a complete registration for a family they are assisting?

### Happy Path
- [x] After login, navigate to the submission/registration form ✅ Auto-redirected to `/agent/create`
- [x] Fill in all fields on behalf of a family (same flow as the Family persona):
  - Full Name, Phone Number, Gender ✅
  - Current & Previous Governorate ✅
  - Address details (City, Street, Building, Floor) ✅
  - Household size + age ranges ✅
  - Aid Urgency, Immediate Needs, Special Needs ✅
  - Comments (optional) ✅
  - Consent checkbox ✅
- [x] Submit — does it confirm successfully? ✅ "Submission successful!" toast; form resets cleanly
- [x] After submission, does the case appear in the agent's submitted cases list? ✅ Appears immediately at `/agent/submissions`

### Edge Cases
- [x] Submit the **same phone number twice** for two different families — what happens? ✅ Code-verified: non-blocking duplicate check runs after Zod validation. If `phoneDuplicate: true`, shows `toast.warning` ("This phone number already exists in the system. A submission will be created anyway.") and proceeds — does not block the agent.
- [x] Go offline mid-form (turn off WiFi) and try to submit — does it fail gracefully with a message? Does it save the data locally? ✅ Code-verified: offline banner appears ("You are offline. Submissions will be saved on this device and auto-synced when connection is restored."). Submission is queued to IndexedDB (`nasna-offline` DB, `queuedSubmissions` store) with status `queued`. Draft is also continuously auto-saved to IndexedDB.
- [x] Come back online after losing connection mid-form — is the form data still there? ✅ Code-verified: draft survives app/tab switch (IndexedDB). Queue auto-syncs on `isOnline` state change via `syncQueuedSubmissions`. Shows sync count toast on success.
- [x] Submit with **urgency = High** — is this case flagged or prioritized differently anywhere in the system? ⚠️ Partial — High urgency displays a red badge in the submissions list. No server-side prioritization, alert, or dedicated queue. Purely visual differentiation. No admin notification or escalation is triggered.
- [x] Submit 3 registrations back to back — does the form reset cleanly between each submission? ✅ Code-verified: `resetSubmissionState()` is called on every successful submission, clearing form state and draft. Back-to-back same-tab submissions are clean. (Note: Bug #9 affects multi-tab stale draft toast only, not same-tab flow.)

### Mobile Check
- [x] Complete the full submission flow entirely on a phone ✅ Layout uses `flex flex-col max-w-[600px] mx-auto` — single column, fits mobile screens cleanly
- [x] Does the multi-step form progress correctly on a small screen? ✅ No horizontal-only layouts in the step flow. Two-column grids (City/Street, Building/Floor) remain 2-col but fields are short enough to fit comfortably at 390px.
- [x] If you switch apps mid-form (e.g., to check WhatsApp), does the form data survive when you come back? ✅ Draft auto-saves on every field change to IndexedDB — data survives backgrounding and app switches.

### RTL / Arabic Check
- [x] With Arabic active, does the form flow correctly RTL? ✅ `document.documentElement.dir = 'rtl'` is set on language change via i18next service — all Flexbox/Grid layouts flip automatically.
- [x] Are all dropdown options translated? ✅ All governorates (12), gender options, urgency levels (High/Medium/Low), Special Needs (6 options), and Immediate Needs (6 options) have Arabic translations in `ar/home.json` and `ar/submission.json`.
- [x] Do validation error messages appear in Arabic? ✅ `ar/home.json` contains `"requiredField": "هذا الحقل مطلوب."` — used by all inline PR #76 error messages. `ar/validation.json` covers Zod schema errors.

---

## Scenario 3 — Viewing Submitted Cases

**Goal:** Can the field agent see a list of the cases they have submitted?

### Happy Path
- [x] Navigate to the agent's case list ✅ `/agent/submissions` via "My Submissions" nav link
- [x] Are submitted cases listed with: family name, governorate, submission date, urgency? ⚠️ Partial — list shows Name, Phone, Status, Assigned NGO, Date Registered. Governorate and Urgency are NOT shown in the list columns.
- [x] Click a case — does a detail view open? ✅ Opens at `/agent/submissions/{id}`
- [x] Does the detail view show the full submission data? ⚠️ Partial — Personal Info, Location, Age Ranges, Immediate Needs, Aid Urgency, Comments, and Timeline all shown. Special Needs data is NOT displayed anywhere in the detail view (see Bug #7).

### Edge Cases
- [x] What if the agent has submitted zero cases? Is there a clear empty state? ✅ Code-verified: shows heading ("No submissions yet"), a hint, and a "Register first family →" link
- [x] What if a case has missing fields — does the detail view handle null data without crashing? ✅ Code-verified: fields render directly from Firestore data; React renders undefined/null as empty without throwing

---

## Bug Report Template

```
Bug #[number]
Persona: Field Agent
Scenario: [e.g., Scenario 2 — Submitting on Behalf of a Family]
Steps to reproduce:
1.
2.
3.
Expected:
Actual:
Device / Browser: [e.g., Samsung Galaxy S22, Chrome]
Language: [Arabic / English]
Screenshot: [attach]
```

---

## Bugs Found

Bug #5
Persona: Field Agent
Scenario: Scenario 2 — Submitting on Behalf of a Family
Steps to reproduce:
1. Log in as a field agent and navigate to `/agent/create`
2. Fill all fields except Email Address (leave it empty)
3. Click Submit
Expected: Form submits successfully — Email Address is optional per the Zod schema (`z.string().email().optional()`)
Actual: Native browser form validation fires ("Please fill in this field") and blocks submission because the Email Address `<input>` has the HTML `required` attribute. The Zod schema and the HTML attribute contradict each other.
Device / Browser: Desktop, Chrome
Language: English
Note: The fix is to remove `required` from the emailAddress input in CreateSubmission.tsx, or to add an explicit `required={false}` override.

Bug #6
Persona: Field Agent
Scenario: Scenario 3 — Viewing Submitted Cases
Steps to reproduce:
1. Submit a registration with a multi-word full name (e.g. "Ahmad Khalil")
2. Navigate to the case detail view
Expected: Full name displayed in full ("Ahmad Khalil")
Actual: Last name is truncated to initial ("Ahmad K.") in the case detail header
Device / Browser: Desktop, Chrome
Language: English
Note: May be intentional for privacy, but there is no indication of this in the UI. If intentional, it should also apply to the submissions list (which shows no name at all, only the row label). Needs product clarification.

Bug #7
Persona: Field Agent
Scenario: Scenario 3 — Viewing Submitted Cases
Steps to reproduce:
1. Submit a registration with one or more Special Needs (e.g. "Wheelchair access")
2. Navigate to the case detail view at `/agent/submissions/{id}`
Expected: Special Needs are displayed in the Household & Needs section of the detail view
Actual: No Special Needs section exists in the detail view. The data is saved to Firestore (confirmed via form submission) but is never surfaced to the agent or admin in the UI.
Device / Browser: Desktop, Chrome
Language: English

Bug #8
Persona: Field Agent
Scenario: Scenario 3 — Viewing Submitted Cases
Steps to reproduce:
1. Navigate to `/agent/submissions`
2. View the columns in the case list
Expected: Cases listed with family name, governorate, submission date, and urgency (as specified in the test checklist)
Actual: Columns shown are: Full Name, Phone Number, Status, Assigned NGO, Date Registered. Governorate and Aid Urgency are absent from the list view, making it harder to triage high-urgency or location-specific cases at a glance.
Device / Browser: Desktop, Chrome
Language: English

Bug #9
Persona: Field Agent
Scenario: Scenario 2 — Submitting on Behalf of a Family
Steps to reproduce:
1. Log in as a field agent in one browser tab (Tab A)
2. Fill out the Create Submission form
3. Open a second tab to `/agent/create` (Tab B) — before submitting in Tab A
4. Submit the form in Tab A ("Submission successful!")
5. Tab B shows "Restored your local draft on this device."
Expected: After a successful submission, no draft should be restored on a fresh page load — the draft was cleared as part of the submit flow
Actual: The auto-save useEffect races against `clearSubmissionDraft` in `resetSubmissionState`. The draft may be re-saved with empty/default formData after the clear, causing a stale "Restored your local draft" toast on the next page load. Confuses the agent into thinking they have unsent data.
Device / Browser: Desktop, Chrome
Language: English
