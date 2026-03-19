# Persona: Admin

**Tester:** Mohammad
**Environment:** [nasna.world](https://nasna.world)
**Login required:** Yes
**Credentials:** _(get from Abed)_
**Estimated time:** ~1.5 hours
**Test in:** Arabic first, then English

> ⚠️ Do not delete real submissions or permanently deactivate real user accounts. Use test data where possible and confirm with Abed before taking any irreversible action.

---

## Who is this persona?

An admin has elevated access over the platform. They can view all submissions across every NGO and governorate, manage NGO verifications, oversee users, and monitor the operations map.

---

## Scenario 1 — Admin Login & Dashboard

**Goal:** Can an admin log in and reach the correct admin panel?

### Happy Path
- [ ] Navigate to `nasna.world/login`
- [ ] Enter admin credentials
- [ ] Does it redirect to the admin panel (not the NGO dashboard or public landing)?
- [ ] Is the panel clearly labeled with the admin's name or role?
- [ ] Does the navigation show admin-level sections not available to NGOs?

### Edge Cases
- [ ] Enter wrong password — is the error message clear?
- [ ] Try accessing the admin panel URL directly **while logged out** — does it redirect to login?
- [ ] Try accessing the admin panel URL **while logged in as an NGO** — is it blocked with an access denied message?
- [ ] After logging in, hard refresh the page — does the session persist correctly?

---

## Scenario 2 — Viewing All Submissions

**Goal:** Does the admin see all submitted registrations across all regions and NGOs — unfiltered?

### Happy Path
- [ ] Navigate to the submissions section in the admin panel
- [ ] Are submissions from **all** governorates visible (not just one)?
- [ ] Are submissions from **all** NGOs visible?
- [ ] Is each row showing: family name, governorate, urgency, submission date, status?
- [ ] Click a submission — does a full detail view open?
- [ ] Does the detail view show: household info, all needs, address, assigned NGO?

### Edge Cases
- [ ] Filter by **governorate** (e.g., Beirut only) — do only Beirut submissions appear?
- [ ] Filter by **urgency = High** — do only high-urgency cases show?
- [ ] Filter by **status = pending** — do only unmatched cases show?
- [ ] Search by **family name** — does it return the correct matching submission?
- [ ] Search by **phone number** — does it return the correct submission?
- [ ] What happens with **100+ submissions** — does the list paginate cleanly?
- [ ] Sort by **newest first** and **oldest first** — does the order change correctly?
- [ ] What if a submission has **all optional fields empty** — does it display without crashing?

### Mobile Check
- [ ] Can the admin browse and filter submissions on a phone?
- [ ] Does the submissions table scroll horizontally on small screens rather than breaking layout?

### RTL / Arabic Check
- [ ] Are column headers (Name, Governorate, Urgency, Date, Status) translated in Arabic?
- [ ] Are urgency and status badge labels in Arabic?
- [ ] Does the filter bar align correctly right-to-left?

---

## Scenario 3 — NGO Verification

**Goal:** Can the admin review and approve or reject pending NGO registrations?

### Happy Path
- [ ] Navigate to NGO management in the admin panel
- [ ] Is there a list of NGOs with their statuses (pending / verified / rejected)?
- [ ] Click a **pending** NGO — does a detail view show their registration info?
- [ ] Approve a test NGO — does the status change to "verified" immediately in the list?
- [ ] After approval, can that NGO now log in and access their dashboard?

### Edge Cases
- [ ] Is there a **confirmation dialog** before approving to prevent accidental clicks?
- [ ] Can you **reject** an NGO after approving them?
- [ ] What if you approve an NGO with **incomplete info** (missing phone number, etc.)?
- [ ] Can you **un-verify** an already verified NGO? What happens to their existing cases?
- [ ] What if two admins try to verify the same NGO at the same time?

### Mobile Check
- [ ] Is the NGO review and approval flow usable on a phone screen?

---

## Scenario 4 — Operations Map (Admin View)

**Goal:** Does the admin see the full operations map with all centers, coverage zones, and displacement sites?

### Happy Path
- [ ] Navigate to the operations/centers map
- [ ] Does the map load with all markers across Lebanon?
- [ ] Are displacement centers visible with their capacity and occupancy?
- [ ] Click a center marker — does the popup show: center name, capacity, occupancy, available spots?
- [ ] Are NGO coverage zones shown as overlays or colored areas?
- [ ] Click a displacement cluster — does it expand to individual markers on zoom?

### Edge Cases
- [ ] A center with **0 capacity** — does it appear as full or closed on the map?
- [ ] A center with **occupancy > capacity** — is it visually flagged (e.g., red indicator)?
- [ ] A center with **missing data** (no name or no capacity set) — does the popup handle nulls without crashing?
- [ ] **50+ centers in one area** (e.g., Beirut) — do they cluster properly without freezing the map?
- [ ] Toggle any map layers on/off (if controls exist) — does it work without breaking the map state?

### Mobile Check
- [ ] Does pinch-zoom and pan work on a touchscreen?
- [ ] Do popups display fully without going off the edge of the screen on mobile?

### RTL / Arabic Check
- [ ] Are popup labels translated in Arabic?
- [ ] Do map UI controls (zoom buttons, legend) align correctly in RTL mode?

---

## Scenario 5 — Role Access Enforcement

**Goal:** Are role boundaries enforced — can users only access what they're authorized for?

- [ ] Log in as a **field agent** → try navigating to the admin panel URL → should be blocked/redirected
- [ ] Log in as an **NGO** → try navigating to the admin panel URL → should be blocked
- [ ] Log in as a **center agent** → try navigating to a different center's page by changing the URL → should be blocked
- [ ] Log out completely → try navigating to `/dashboard` or any protected route → should redirect to login
- [ ] Log in as **NGO A** → try accessing NGO B's case list by modifying the URL → should be blocked

---

## Bug Report Template

```
Bug #[number]
Persona: Admin
Scenario: [e.g., Scenario 3 — NGO Verification]
Steps to reproduce:
1.
2.
3.
Expected:
Actual:
Device / Browser: [e.g., MacBook Pro, Firefox 124]
Language: [Arabic / English]
Severity: [Critical / High / Medium / Low]
Screenshot: [attach]
```

### Severity Guide
| Level | When to use |
|---|---|
| **Critical** | Data loss, wrong data shown to wrong user, security bypass, can't log in |
| **High** | Admin action fails silently, wrong count, privacy leak |
| **Medium** | Feature partially broken but data is intact |
| **Low** | Visual glitch, label issue, cosmetic misalignment |
