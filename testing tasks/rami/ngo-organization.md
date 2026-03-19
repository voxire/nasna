# Persona: NGO / Organization

**Tester:** Rami
**Environment:** [nasna.world](https://nasna.world)
**Login required:** Yes
**Credentials:** _(get from Abed)_
**Estimated time:** ~1.5 hours
**Test in:** Arabic first, then English

---

## Who is this persona?

An NGO or initiative that has registered on Nasna. They log in to their dashboard to review cases submitted by families, filtered to match their coverage area and aid type, and take action on them.

---

## Scenario 1 — NGO Registration (New Account)

**Goal:** Can a new NGO create an account on the platform?

### Happy Path
- [ ] Navigate to `nasna.world` and find the NGO registration link (check footer and header)
- [ ] Fill in: Organization Name, Contact Person Name, Email, Password, Confirm Password, Phone Number
- [ ] Check the consent checkbox
- [ ] Click **Register** — does a success message appear?
- [ ] Does it redirect to login or show a "pending verification" notice?
- [ ] Try logging in immediately with those credentials — does it say the account is under review?

### Edge Cases
- [ ] Register with an **email already used** by another NGO — is there a clear duplicate error?
- [ ] Enter **passwords that don't match** — does it show a mismatch error before submitting?
- [ ] Leave **Organization Name blank** — is submission blocked?
- [ ] Enter a **short password** (e.g., `123`) — is there a minimum length requirement shown?
- [ ] Submit **without checking consent** — is it blocked with a visible message?
- [ ] Enter an **invalid phone number format** — is it caught before submit?
- [ ] Use a **personal email domain** (e.g., `@gmail.com`) — is it accepted or flagged?

### Mobile Check
- [ ] Open the registration form on your phone
- [ ] Are all fields full-width and tappable without zooming?
- [ ] Does the password show/hide toggle work correctly on mobile?
- [ ] Is the consent checkbox easy to tap on small screens?

### RTL / Arabic Check
- [ ] In Arabic mode, do all field labels align right?
- [ ] Do error/success toast messages appear correctly positioned in RTL?

---

## Scenario 2 — NGO Login

**Goal:** Can a verified NGO log in and reach their dashboard?

### Happy Path
- [ ] Navigate to `nasna.world/login`
- [ ] Enter valid NGO credentials
- [ ] Click Sign In — does it redirect to the NGO dashboard?
- [ ] Is the NGO's organization name visible somewhere on the screen?
- [ ] Is the view clearly for an NGO (not admin, not family)?

### Edge Cases
- [ ] **Wrong password** — is the error message clear and specific?
- [ ] **Email not found** — is the message different from "wrong password"?
- [ ] Leave **both fields empty** and click Sign In — does it validate before sending?
- [ ] Try logging in with an **unverified NGO account** — is the message clear that verification is pending?
- [ ] What happens after **session expiry** — are they redirected to login with an informative message?

---

## Scenario 3 — Submissions Feed

**Goal:** Does the NGO see only the cases relevant to their coverage area and aid type?

### Happy Path
- [ ] After login, navigate to the cases/submissions list
- [ ] Are submissions listed with: family name, location, urgency level, needs, submission date?
- [ ] Are cases filtered to match this NGO's registered area and aid type (not all cases)?
- [ ] Click a case — does a detail view open?
- [ ] Does the detail view show: household size, needs, location, urgency, date?
- [ ] **Privacy check:** Is the family's phone number hidden or masked? It should NOT be directly visible

### Edge Cases
- [ ] What if there are **zero cases** matching this NGO's area? Is there a useful empty state?
- [ ] What if a case has **missing fields** (no address, no email)? Does it display without crashing?
- [ ] Filter by **governorate** — do results narrow correctly to that region only?
- [ ] Filter by **urgency = High** — do only urgent cases appear?
- [ ] Filter by **aid type** (e.g., Food) — do only matching cases show?
- [ ] Try manually editing the URL to access a case from a different governorate — are you blocked?
- [ ] What happens if you open the same case in two browser tabs and take different actions?

### Mobile Check
- [ ] Is the case list scrollable on mobile without horizontal overflow?
- [ ] Does the detail view fit in a phone screen without needing to scroll left/right?
- [ ] Are filter controls accessible on mobile (not hidden behind a broken dropdown)?

### RTL / Arabic Check
- [ ] Are urgency labels (High / Medium / Low) translated in Arabic?
- [ ] Are governorate names shown in Arabic?
- [ ] Does the filter bar align correctly right-to-left?

---

## Scenario 4 — Case Actions

**Goal:** Can the NGO update the status of a case (contacted, in progress, resolved)?

### Happy Path
- [ ] Open a case from the feed
- [ ] Is there a way to mark the case (contacted / in progress / resolved)?
- [ ] After marking — does the case status update immediately in the list?
- [ ] Refresh the page — does the updated status persist?

### Edge Cases
- [ ] Can an NGO mark a case that doesn't match their coverage area? (should be blocked)
- [ ] Mark a case as resolved, then try to revert it — is that allowed?
- [ ] Mark a case while offline — does it fail gracefully and retry when back online?

---

## Scenario 5 — Operations Map

**Goal:** Can the NGO view the live map of Lebanon with displacement sites and coverage?

### Happy Path
- [ ] Navigate to the map page (check nav for Centers Map, Operations Map, or similar)
- [ ] Does the map load with Lebanon in view?
- [ ] Are location markers or clusters visible on the map?
- [ ] Click a marker — does a popup appear with center or site details?

### Edge Cases
- [ ] On a slow connection — is there a loading indicator instead of a blank map?
- [ ] Zoom out to the maximum — do markers cluster correctly without overlapping?
- [ ] Zoom in to a single street — do individual markers show clearly?

### Mobile Check
- [ ] Pinch-zoom and pan work on a touchscreen?
- [ ] Do popups display fully without going off the edge of the screen?

### RTL / Arabic Check
- [ ] Are map popup labels in Arabic when Arabic mode is active?

---

## Bug Report Template

```
Bug #[number]
Persona: NGO / Organization
Scenario: [e.g., Scenario 3 — Submissions Feed]
Steps to reproduce:
1.
2.
3.
Expected:
Actual:
Device / Browser: [e.g., MacBook Air M2, Chrome 124]
Language: [Arabic / English]
Severity: [Critical / High / Medium / Low]
Screenshot: [attach]
```

### Severity Guide
| Level | When to use |
|---|---|
| **Critical** | Blocks core functionality — can't log in, can't see cases, data loss |
| **High** | Wrong data shown, major UX broken, privacy issue |
| **Medium** | Feature partially broken but workaround exists |
| **Low** | Visual glitch, minor text issue, cosmetic |
