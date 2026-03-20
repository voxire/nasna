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
- [ ] Navigate to `nasna.world/login`
- [ ] Enter valid field agent credentials ⚠️ Credentials needed from team — not tested
- [ ] Click Sign In — does it redirect to the correct dashboard view? ⚠️ Needs credentials
- [ ] Is the UI clearly scoped to field agent actions (not admin or NGO)? ⚠️ Needs credentials

### Edge Cases
- [x] Enter a **wrong password** — is there a clear, readable error message? ✅ Toast: "Invalid credentials. Please try again." Note: form fields are cleared on failure — user must re-type email.
- [x] Enter an **email that doesn't exist** — is the message distinct from "wrong password"? ✅ Same generic "Invalid credentials" message for both — intentional security behavior (does not reveal whether email exists).
- [x] Submit with **email field empty** — does it validate before sending the request? ✅ Inline "Invalid input" error appears, no network call made.
- [x] Submit with **password field empty** — same check ✅ Same inline "Invalid input" error.
- [ ] Try logging in with an **NGO account** on a field agent login — what happens? ⚠️ Needs credentials

### Mobile Check
- [ ] Open the login page on your phone
- [ ] Are both fields full-width and easily tappable?
- [ ] Does the keyboard dismiss cleanly after a successful login?

---

> **Note:** Scenarios 2 and 3 require valid field agent credentials. All items below are pending until credentials are provided by the team.

## Scenario 2 — Submitting on Behalf of a Family

**Goal:** Can the field agent submit a complete registration for a family they are assisting?

### Happy Path
- [ ] After login, navigate to the submission/registration form
- [ ] Fill in all fields on behalf of a family (same flow as the Family persona):
  - Full Name, Phone Number, Gender
  - Current & Previous Governorate
  - Address details (City, Street, Building, Floor)
  - Household size + age ranges
  - Aid Urgency, Immediate Needs, Special Needs
  - Comments (optional)
  - Consent checkbox
- [ ] Submit — does it confirm successfully?
- [ ] After submission, does the case appear in the agent's submitted cases list?

### Edge Cases
- [ ] Submit the **same phone number twice** for two different families — what happens?
- [ ] Go offline mid-form (turn off WiFi) and try to submit — does it fail gracefully with a message? Does it save the data locally?
- [ ] Come back online after losing connection mid-form — is the form data still there?
- [ ] Submit with **urgency = High** — is this case flagged or prioritized differently anywhere in the system?
- [ ] Submit 3 registrations back to back — does the form reset cleanly between each submission?

### Mobile Check
- [ ] Complete the full submission flow entirely on a phone
- [ ] Does the multi-step form progress correctly on a small screen?
- [ ] If you switch apps mid-form (e.g., to check WhatsApp), does the form data survive when you come back?

### RTL / Arabic Check
- [ ] With Arabic active, does the form flow correctly RTL?
- [ ] Are all dropdown options translated?
- [ ] Do validation error messages appear in Arabic?

---

## Scenario 3 — Viewing Submitted Cases

**Goal:** Can the field agent see a list of the cases they have submitted?

### Happy Path
- [ ] Navigate to the agent's case list
- [ ] Are submitted cases listed with: family name, governorate, submission date, urgency?
- [ ] Click a case — does a detail view open?
- [ ] Does the detail view show the full submission data?

### Edge Cases
- [ ] What if the agent has submitted zero cases? Is there a clear empty state?
- [ ] What if a case has missing fields — does the detail view handle null data without crashing?

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
