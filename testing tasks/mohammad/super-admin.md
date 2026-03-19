# Persona: Super Admin

**Tester:** Mohammad
**Environment:** [nasna.world](https://nasna.world)
**Login required:** Yes
**Credentials:** _(get from Abed)_
**Estimated time:** ~1.5 hours
**Test in:** Arabic first, then English

> ⚠️ Super admin has full destructive access. Do not delete real users, deactivate real NGOs, or change production settings without confirming with Abed first. Use test accounts for destructive actions.

---

## Who is this persona?

The super admin has unrestricted access to the entire platform. In addition to everything the admin can do, they can create and manage users (field agents, center agents), change roles, and access platform-wide analytics and settings.

---

## Scenario 1 — Super Admin Login & Panel

**Goal:** Is the super admin panel distinct and does it offer more controls than the regular admin?

### Happy Path
- [ ] Navigate to `nasna.world/login`
- [ ] Log in with super admin credentials
- [ ] Does it redirect to the super admin panel?
- [ ] Are there controls/sections visible that are **not available** to a regular admin?
- [ ] Is the role clearly labeled somewhere (e.g., "Super Admin" badge or label)?

### Edge Cases
- [ ] Try accessing the super admin panel URL while logged in as a **regular admin** — are extra features hidden or the route blocked?
- [ ] Hard refresh after login — does the session and panel state persist?

---

## Scenario 2 — User Management

**Goal:** Can the super admin create, assign, edit, and deactivate users?

### Happy Path
- [ ] Navigate to User Management
- [ ] Is the user list showing: name, email, role, assigned NGO/center, status (active/inactive)?
- [ ] Create a new **field agent** user with a test email — does it save successfully?
- [ ] Assign the new user to an NGO — does the assignment persist after save?
- [ ] Create a new **center agent** user — assign them to a specific center
- [ ] Deactivate a test user — does their status change to inactive immediately?
- [ ] Try logging in as the deactivated test user — are they blocked with a clear message?

### Edge Cases
- [ ] Create a user with an **email already in use** — is there a clear duplicate error?
- [ ] Create a user with **no role assigned** — is it blocked?
- [ ] Create a user with a **very long name** (100+ characters) — does it save and display correctly?
- [ ] Try to **deactivate your own super admin account** — is this blocked with a warning?
- [ ] Reactivate a previously deactivated user — can they log in again successfully?
- [ ] What happens to cases submitted by a field agent after they are deactivated?

### Mobile Check
- [ ] Is the user management list scrollable on mobile?
- [ ] Is the create user form usable on a phone?

### RTL / Arabic Check
- [ ] Are role labels (Field Agent, Center Agent, Admin) translated in Arabic?
- [ ] Are status labels (Active, Inactive) translated?

---

## Scenario 3 — Analytics & Impact

**Goal:** Does the super admin have visibility into platform-wide statistics?

### Happy Path
- [ ] Navigate to the analytics or impact section
- [ ] Are key platform metrics displayed: total registrations, total NGOs, cases matched, active centers?
- [ ] Are there any charts or graphs? Do they render without errors?
- [ ] If there's a date range filter — does changing the range update the numbers?

### Edge Cases
- [ ] Set a date range with **no submissions** in it — does the chart show an empty state instead of 0 or crashing?
- [ ] Set a date range to **today only** — does it show today's data accurately?
- [ ] If a metric widget fails to load — is there an error state shown instead of a blank card?

### Mobile Check
- [ ] Do analytics charts render and are they readable on a phone screen?
- [ ] Is there a horizontal scroll or zoom for charts that are too wide?

---

## Scenario 4 — Platform Settings (if available)

**Goal:** Can the super admin change platform-wide settings?

### Happy Path
- [ ] Navigate to Settings in the super admin panel
- [ ] What settings are available? (List them)
- [ ] Change one non-destructive setting and save — does it persist after refresh?

### Edge Cases
- [ ] Are there any settings that could break the platform if set incorrectly? Is there a warning?
- [ ] Can a regular admin access this settings page? (should be blocked)

---

## Scenario 5 — Language Switching (Full Platform Check)

**Goal:** Does the entire admin/super admin panel support both Arabic and English properly?

- [ ] While logged in as super admin, switch language to **English** — does the entire panel update?
- [ ] Switch back to **Arabic** — does everything revert correctly including RTL layout?
- [ ] Look for any hardcoded strings that don't change with the language switch
- [ ] Does the language preference persist after a full page refresh?
- [ ] Does it persist after logging out and logging back in?

---

## Scenario 6 — Full Role Isolation Audit

**Goal:** Confirm that no role can access data or actions outside their permissions.

Run each check, note pass or fail:

| Check | Expected | Pass/Fail |
|---|---|---|
| Field agent visits `/admin` | Blocked / redirected | |
| NGO visits super admin panel URL | Blocked / redirected | |
| Center agent visits a different center's URL | Blocked / redirected | |
| NGO A visits NGO B's case list via URL | Blocked / redirected | |
| Logged-out user visits `/dashboard` | Redirected to login | |
| Regular admin visits super admin-only settings | Blocked / hidden | |

---

## Bug Report Template

```
Bug #[number]
Persona: Super Admin
Scenario: [e.g., Scenario 2 — User Management]
Steps to reproduce:
1.
2.
3.
Expected:
Actual:
Device / Browser: [e.g., Windows 11, Edge 123]
Language: [Arabic / English]
Severity: [Critical / High / Medium / Low]
Screenshot: [attach]
```

### Severity Guide
| Level | When to use |
|---|---|
| **Critical** | Security bypass, data deletion without confirmation, role boundaries broken |
| **High** | User creation fails, analytics show wrong data, setting change doesn't save |
| **Medium** | UI partially broken, workaround exists |
| **Low** | Label typo, cosmetic misalignment, minor visual bug |
