# Persona: Center Agent

**Tester:** Rami
**Environment:** [nasna.world](https://nasna.world)
**Login required:** Yes
**Credentials:** _(get from Abed)_
**Estimated time:** ~1 hour
**Test in:** Arabic first, then English

---

## Who is this persona?

A person responsible for managing a specific displacement center (shelter or collective housing site). They update the center's capacity, current occupancy, and status. Their view is scoped only to their assigned center — they cannot see other centers.

---

## Scenario 1 — Login & Dashboard Access

**Goal:** Can a center agent log in and see only their assigned center?

### Happy Path
- [x] Navigate to `nasna.world/login`
- [x] Log in with center agent credentials
- [x] After login — does the dashboard show only their specific center?
- [x] Is the center's name and location clearly displayed at the top?
- [x] Is there no access to other centers' data anywhere in the UI?

### Edge Cases
- [x] Copy the URL of another center's dashboard page — paste it while logged in as this agent → should be blocked or show an access denied screen
- [x] What if the agent's assigned center has **no data yet** (no families, no capacity set)? Is there a clear empty state rather than a crash?
- [x] What happens after the session expires — is there a clean redirect to login?
- yes


---

## Scenario 2 — Updating Center Capacity & Occupancy

**Goal:** Can the center agent accurately update how full their center is?

### Happy Path
- [x] Find the capacity and occupancy inputs in the dashboard
- [x] Enter a **total capacity** value (e.g., 80) and save — does it update immediately?
- [x] Enter a **current occupancy** value (e.g., 45) and save — does it update?
- [x] Does the system correctly calculate and display **available spots** (capacity − occupancy)?
- [x] Refresh the page — do the entered values persist?
- [x] Does the updated data reflect on the public-facing map? (check map to verify)

### Edge Cases
- [x] Enter **occupancy greater than capacity** (e.g., capacity = 80, occupancy = 100) — does the system warn or block this?
- [x] Enter **0 for capacity** — does the center show as full/closed on the map?
- [x] Enter a **negative number** (e.g., -5) — is there input validation blocking this?
- [x] Leave the capacity field **blank** and save — does it default to 0 or show an error?
- [x] Enter a **decimal number** (e.g., 12.5) — is this accepted or does it round/reject?
- [x] Enter **extremely large number** (e.g., 999999) — does the UI display it correctly?

### Mobile Check
- [ ] Open the capacity update form on a phone
- [ ] Does the numeric keyboard open automatically on number fields?
- [ ] Is the Save button reachable without scrolling off-screen?

### RTL / Arabic Check
- [x] Are field labels (Capacity, Occupancy, Available) in Arabic when Arabic mode is on?
- [x] Do number inputs still accept input correctly in RTL layout (no reversed typing)?

---

## Scenario 3 — Viewing Families at the Center

**Goal:** Can the agent see which families are registered at their center?

### Happy Path
- [x] Navigate to the families or registrations list within the center dashboard
- [x] Are families listed with: name, registration date, household size?
- [x] Click a family entry — does a detail view open?
- [x] Is the family's contact information appropriately visible (or masked per privacy rules)?

### Edge Cases
- [x] What if **no families are registered** at this center yet? Is there a clear empty state?
- [x] What if a family record has **missing fields** (no name, no date)? Does it display without crashing?
- [ ] If there are 50+ families — does the list paginate or infinite scroll without breaking?
- [x] Can the agent search for a family by name? If yes, does it work correctly?

### Mobile Check
- [ ] Is the families list scrollable on a phone without horizontal overflow?
- [ ] Does the detail view fit a phone screen without needing to scroll sideways?

---

## Scenario 4 — Center Status on the Public Map

**Goal:** Does what the agent enters reflect accurately on the public-facing map?

### Happy Path
- [ ] Set capacity to 100 and occupancy to 50 → open the public map → does the center show 50 available spots?
- [ ] Set occupancy to 100 (full) → check the map → does the center display as full?
- [ ] Update occupancy to 0 (empty) → check the map → does it reflect as fully available?

### Edge Cases
- [ ] How long does it take for the map to reflect a change? Is there a noticeable delay?
- [ ] If you update and immediately open the map — does it show stale data or fresh data?

---

## Bug Report Template

```
Bug #[number]
Persona: Center Agent
Scenario: [e.g., Scenario 2 — Updating Capacity]
Steps to reproduce:
1.
2.
3.
Expected:
Actual:
Device / Browser: [e.g., iPad Air, Safari]
Language: [Arabic / English]
Severity: [Critical / High / Medium / Low]
Screenshot: [attach]
```

### Severity Guide
| Level | When to use |
|---|---|
| **Critical** | Can't log in, wrong center shown, data not saving |
| **High** | Capacity mismatch on map, privacy breach, access to wrong center |
| **Medium** | UI broken but data is still correct |
| **Low** | Visual glitch, label typo, minor alignment |
