# Nasna — Manual Testing Plan
**Live URL:** `https://btrajek-se3dni.web.app`
**Date:** March 2026
**Tester:** Abed El-Fattah Amouneh

---

## Setup — Test Accounts

Before testing, create these accounts. Steps are manual via Firebase Console + the app.

### 1. Admin Account (via Firebase Console)
1. Go to [Firebase Console](https://console.firebase.google.com) → `btrajek-se3dni` → Authentication → Add user
2. Email: `admin@nasna.test` | Password: `Test1234!`
3. Copy the generated UID
4. In Firestore → `members` collection → New document (ID = the UID above):
```json
{
  "uid": "<paste uid>",
  "name": "Test Admin",
  "email": "admin@nasna.test",
  "phoneNumber": "+96170000001",
  "role": "admin",
  "isAdmin": true,
  "validated": true,
  "onboarded": true,
  "consentGiven": true,
  "createdAt": "<now>",
  "updatedAt": "<now>"
}
```

### 2. NGO (Member) Account
1. Go to `/auth/register` in the app and fill the form
2. Email: `ngo@nasna.test` | Password: `Test1234!`
3. After registering, go to Firestore → `members` → find the document → set `validated: true`

### 3. Agent Account
1. Go to `/auth/agent` in the app and fill the form
2. Email: `agent@nasna.test` | Password: `Test1234!`
3. After registering, go to Firestore → `members` → find the document → set `validated: true`

### 4. Unvalidated Account (for testing the validation wall)
1. Go to `/auth/register` in the app
2. Email: `pending@nasna.test` | Password: `Test1234!`
3. Leave `validated` as `false` — do not change it

---

## Test Status Legend
- ✅ Pass
- ❌ Fail — describe what happened
- ⚠️ Partial — works but has issues
- ⬜ Not tested yet

---

## SECTION 1 — Public Routes (No Login Required)

### 1.1 Landing Page `/`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 1 | Page loads without errors | Hero section renders, no console errors | ⬜ | |
| 2 | Language switcher works | Switching to AR renders Arabic RTL layout | ⬜ | |
| 3 | Language switcher — FR | French text renders correctly | ⬜ | |
| 4 | Navigation links work | All header links navigate correctly | ⬜ | |
| 5 | CTA buttons navigate | "Submit a case" / "Offer help" buttons go to correct routes | ⬜ | |
| 6 | RTL layout in Arabic | Text, buttons, and layout flip correctly for AR | ⬜ | |

### 1.2 Submit a Case `/submit`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 7 | Form loads | All fields visible and in Arabic by default | ⬜ | |
| 8 | Submit with empty fields | Validation errors shown, form does not submit | ⬜ | |
| 9 | Phone duplicate check | Enter an existing phone number → error shown | ⬜ | |
| 10 | Email duplicate check | Enter an existing email → error shown | ⬜ | |
| 11 | consentGiven unchecked | Cannot submit without checking consent checkbox | ⬜ | |
| 12 | Valid submission | Fill all fields, check consent → submits → redirects to /confirmation | ⬜ | |
| 13 | Needs checkboxes | All 6 aid types appear (food, water, shelter, hygiene, medical, clothing) | ⬜ | |
| 14 | Age ranges | Can fill in numbers for each age range | ⬜ | |
| 15 | Location type toggle | Switching between "with family" and "center" shows/hides center selector | ⬜ | |
| 16 | Offline mode | Disable network → submit → queued message shown → re-enable → syncs | ⬜ | |
| 17 | Invalid phone format | Enter "abcde" as phone → validation error | ⬜ | |

### 1.3 Housing Directory `/housing`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 18 | Page loads | Housing listings and centers sections visible | ⬜ | |
| 19 | Empty state | If no approved housing, empty state message shows | ⬜ | |
| 20 | Area filter | Typing an area filters both housing and centers | ⬜ | |
| 21 | Price type filter | Selecting "Free" shows only free housing | ⬜ | |
| 22 | Minimum spots filter | Entering 2 hides listings with < 2 spots | ⬜ | |
| 23 | Capacity bar renders | Centers show capacity bar correctly | ⬜ | |

### 1.4 Offer Housing `/offer-housing`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 24 | Form loads | All fields visible | ⬜ | |
| 25 | Submit empty form | Validation errors shown | ⬜ | |
| 26 | availableSpots > capacity | Error: "Available spots cannot exceed total capacity" | ⬜ | |
| 27 | Valid submission | Submits → success toast → form resets → document in Firestore with `status: pending_review` | ⬜ | |

### 1.5 Donate `/donate`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 28 | Form loads | All fields visible | ⬜ | |
| 29 | Submit empty form | Validation errors shown (Zod) | ⬜ | |
| 30 | Invalid phone | Enter letters → validation error | ⬜ | |
| 31 | Amount below 1 | Button stays disabled | ⬜ | |
| 32 | "Other" reason | Selecting "Other" shows custom reason text field | ⬜ | |
| 33 | Valid submission | Fills all fields → redirects to Stripe checkout | ⬜ | |

### 1.6 Impact Page `/impact`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 34 | Stats load | Numbers display (may be 0 on fresh DB) | ⬜ | |
| 35 | No crash on zero data | Page renders without errors when stats are all 0 | ⬜ | |
| 36 | Rates calculate correctly | 0 registered → assignment rate = 0% (not NaN or Infinity) | ⬜ | |

### 1.7 Emergency Contacts `/emergency`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 37 | Page loads | Contacts visible or empty state shown | ⬜ | |
| 38 | Public access | No login required to view | ⬜ | |

### 1.8 Other Public Pages
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 39 | `/about` loads | Content renders | ⬜ | |
| 40 | `/resources` loads | Content renders | ⬜ | |
| 41 | `/feedback` loads | Feedback form visible | ⬜ | |
| 42 | Submit feedback | Fill form → success toast | ⬜ | |
| 43 | `/offer-help` loads | Aid offer form visible | ⬜ | |
| 44 | Submit offer | Fill form → success toast | ⬜ | |
| 45 | `/terms` loads | Content renders | ⬜ | |
| 46 | `/confirmation` loads | Renders without crashing (may need to come from a submission) | ⬜ | |

---

## SECTION 2 — Auth Flows

### 2.1 Login `/auth/login`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 47 | Page loads | Login form visible | ⬜ | |
| 48 | Wrong credentials | Error message shown | ⬜ | |
| 49 | Valid admin login | Redirects to `/manage` | ⬜ | |
| 50 | Valid NGO login | Redirects to `/ngo/submissions` | ⬜ | |
| 51 | Valid agent login | Redirects to `/agent/create` | ⬜ | |
| 52 | Unvalidated login | Redirects to correct screen with "account under review" message | ⬜ | |
| 53 | Google login | Popup opens → logs in → redirects correctly by role | ⬜ | |
| 54 | Forgot password | Opens dialog → enter email → success message | ⬜ | |
| 55 | Already logged in | Visiting `/auth/login` redirects away | ⬜ | |

### 2.2 NGO Registration `/auth/register`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 56 | Form loads | All fields visible | ⬜ | |
| 57 | Submit empty | Validation errors | ⬜ | |
| 58 | Valid registration | Creates account → goes to onboarding or submissions | ⬜ | |
| 59 | Duplicate email | Error shown | ⬜ | |

### 2.3 Agent Registration `/auth/agent`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 60 | Form loads | All fields visible | ⬜ | |
| 61 | Valid registration | Creates account → awaits validation | ⬜ | |

### 2.4 Session & Security
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 62 | Idle timeout | Leave logged in with no activity → auto logout after timeout | ⬜ | |
| 63 | Access `/manage` unauthenticated | Redirects to login | ⬜ | |
| 64 | Access `/agent/create` as NGO | Redirected away | ⬜ | |
| 65 | Access `/ngo/submissions` as agent | Redirected away | ⬜ | |
| 66 | Logout | Clears session, redirects to landing | ⬜ | |

---

## SECTION 3 — Agent Screens

> Login as: `agent@nasna.test`

### 3.1 Create Submission `/agent/create`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 67 | Form loads | All fields visible | ⬜ | |
| 68 | Required field validation | Submit empty → errors shown | ⬜ | |
| 69 | Phone duplicate blocked | Existing phone → error | ⬜ | |
| 70 | Needs checkboxes | 6 aid types selectable | ⬜ | |
| 71 | Age ranges | All 5 ranges fillable (0-3, 4-12, 13-18, 19-60, 60+) | ⬜ | |
| 72 | consentGiven required | Cannot submit without checking | ⬜ | |
| 73 | Location: center | Selecting center shows center dropdown | ⬜ | |
| 74 | Location: with family | Selecting "with family" shows address fields | ⬜ | |
| 75 | Valid submission | Submits → success → form resets | ⬜ | |
| 76 | Offline draft save | Fill form → go offline → draft is saved | ⬜ | |
| 77 | Offline submit | Go offline → submit → queued banner shows | ⬜ | |
| 78 | Sync on reconnect | Come back online → queued submission syncs automatically | ⬜ | |

### 3.2 My Submissions `/agent/submissions`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 79 | List loads | Agent sees only their own submissions | ⬜ | |
| 80 | Pagination | If > 20 submissions, pagination controls appear | ⬜ | |
| 81 | Search works | Searching by name filters correctly | ⬜ | |
| 82 | Status badge | Each submission shows correct status color | ⬜ | |

---

## SECTION 4 — NGO (Member) Screens

> Login as: `ngo@nasna.test`

### 4.1 Case Feed `/ngo/submissions`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 83 | List loads | Pending cases matching coverage area visible | ⬜ | |
| 84 | Phone NOT visible in cards | Cards show name + governorate only, no phone number | ⬜ | |
| 85 | Search works | Filtering by name or governorate works | ⬜ | |
| 86 | Claim a case | Click claim → case disappears from feed → appears in My Cases | ⬜ | |
| 87 | Claim fails gracefully | If claim fails → toast error shown (not silent) | ⬜ | |

### 4.2 My Cases `/ngo/my-cases`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 88 | Claimed cases load | Previously claimed cases visible | ⬜ | |
| 89 | Phone NOT in card | Cards do not show phone number | ⬜ | |
| 90 | "Start work" button | Status updates → toast confirmation | ⬜ | |
| 91 | "Complete" button | Status updates → toast confirmation | ⬜ | |
| 92 | "Cancel" button | Status updates → toast confirmation | ⬜ | |
| 93 | Status change failure | If update fails → toast error shown (not silent) | ⬜ | |
| 94 | "Open case" link | Navigates to `/ngo/cases/:caseId` | ⬜ | |

### 4.3 Case Detail `/ngo/cases/:caseId`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 95 | Page loads | Full case detail visible | ⬜ | |
| 96 | Phone visible here | Phone number shown in case detail (appropriate for claimed case) | ⬜ | |
| 97 | Age ranges readable | Shows "0-3: 2, 4-12: 1" format (not JSON) | ⬜ | |
| 98 | Needs display | Aid types shown as readable labels | ⬜ | |
| 99 | Status update from detail | Can update status from within the detail view | ⬜ | |

### 4.4 Coverage Profile `/ngo/profile-coverage`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 100 | Page loads | Coverage settings visible | ⬜ | |
| 101 | Save coverage | Update governorates → saves → persists on refresh | ⬜ | |

---

## SECTION 5 — Admin Screens

> Login as: `admin@nasna.test`

### 5.1 Dashboard `/manage`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 102 | Loads without crash | Stats cards visible | ⬜ | |
| 103 | Stats are live | Numbers update when data changes | ⬜ | |
| 104 | Unread feedback count | Shows correct badge count | ⬜ | |

### 5.2 Dispatch Center `/manage/dispatch`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 105 | Submissions load | Paginated list of cases visible | ⬜ | |
| 106 | Pagination works | Next/Previous buttons navigate correctly | ⬜ | |
| 107 | Status filter | Filtering by status works | ⬜ | |
| 108 | Assign a case | Select NGO → assign → status changes to "assigned" | ⬜ | |
| 109 | Case timeline | Opening a case shows timeline of status changes | ⬜ | |
| 110 | Aid delivery form | Can mark aid as delivered | ⬜ | |

### 5.3 Operations Map `/manage/operations-map`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 111 | Map loads | Leaflet map renders (no broken tiles) | ⬜ | |
| 112 | Loading spinner | Spinner shows while data fetches | ⬜ | |
| 113 | Error state | If data fails → error card shown (not blank map) | ⬜ | |
| 114 | Markers use local icons | No broken image markers (not from unpkg) | ⬜ | |
| 115 | Submission clusters | Orange/red circles on governorates with cases | ⬜ | |
| 116 | Centers layer | Center markers toggleable | ⬜ | |
| 117 | Housing layer | Housing area markers toggleable | ⬜ | |
| 118 | NGO coverage layer | NGO coverage toggleable | ⬜ | |
| 119 | Displacement sites layer | 37 Beirut sites render as orange markers | ⬜ | |
| 120 | Layer toggles work | Unchecking a layer hides its markers | ⬜ | |
| 121 | Summary cards | Mapped governorates / pending / urgent / housing numbers correct | ⬜ | |

### 5.4 NGO Members `/manage/ngo`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 122 | List loads | Members listed with pagination | ⬜ | |
| 123 | Search works | Filter by name or email | ⬜ | |
| 124 | Validate member | Click validate → `validated: true` in Firestore | ⬜ | |
| 125 | Delete member | Prompts confirmation → deletes | ⬜ | |
| 126 | Edit member | Can update member details | ⬜ | |

### 5.5 Agents `/manage/agents`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 127 | List loads | Agents listed | ⬜ | |
| 128 | Validate agent | Click validate → agent can now log in | ⬜ | |
| 129 | Delete agent | Works as expected | ⬜ | |

### 5.6 Housing Review `/manage/housing`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 130 | List loads | Pending housing submissions visible | ⬜ | |
| 131 | Approve housing | Status changes to `approved` → appears in public `/housing` | ⬜ | |
| 132 | Reject housing | Status changes to `rejected` → disappears from public view | ⬜ | |

### 5.7 Impact Dashboard `/manage/impact`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 133 | Page loads | Stats visible | ⬜ | |
| 134 | Numbers match public page | Same stats as `/impact` | ⬜ | |

### 5.8 Center Management `/manage/centers`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 135 | List loads | Centers visible | ⬜ | |
| 136 | Add center | Fill form → center created → appears in list | ⬜ | |
| 137 | Edit center | Update capacity → saves | ⬜ | |
| 138 | Center appears in submission form | New center available in agent's location dropdown | ⬜ | |

### 5.9 Emergency Contacts `/manage/emergency`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 139 | List loads | Contacts visible | ⬜ | |
| 140 | Add contact | Creates new emergency contact | ⬜ | |
| 141 | Edit contact | Updates correctly | ⬜ | |
| 142 | Delete contact | Removed from list and public page | ⬜ | |

### 5.10 Feedback Management `/manage/feedback`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 143 | List loads | Feedback submissions visible | ⬜ | |
| 144 | Mark as read | Changes read state | ⬜ | |
| 145 | Delete feedback | Removes from list | ⬜ | |
| 146 | Search/filter works | Filtering by read/unread works | ⬜ | |

### 5.11 Aid Offers `/manage/offers`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 147 | List loads | Offers visible | ⬜ | |
| 148 | Search works | Filter by type | ⬜ | |

### 5.12 Admin Submissions `/manage/submissions`
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 149 | List loads | All submissions visible | ⬜ | |
| 150 | Search works | Filter by name or urgency | ⬜ | |
| 151 | Status filter | Filter by pending/assigned/completed | ⬜ | |
| 152 | Pagination | 10 per page with controls | ⬜ | |

---

## SECTION 6 — Cross-Cutting Concerns

### 6.1 Internationalisation
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 153 | All new screens in Arabic | Switch to AR → no English strings visible on new v2 screens | ⬜ | |
| 154 | RTL layout | Arabic layout is right-to-left with no visual breakage | ⬜ | |
| 155 | French works | Switch to FR → French text renders | ⬜ | |
| 156 | Language persists | Refresh page → same language stays selected | ⬜ | |

### 6.2 Mobile / Responsive
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 157 | Landing page mobile | No horizontal scroll, text readable | ⬜ | |
| 158 | Submit form mobile | Form usable on small screen | ⬜ | |
| 159 | Admin sidebar mobile | Hamburger menu appears and works | ⬜ | |
| 160 | Operations map mobile | Map renders and is usable | ⬜ | |

### 6.3 Security
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 161 | Unauthenticated Firestore read | Try reading `/submissions` directly in browser console → denied | ⬜ | |
| 162 | NGO cannot see whatsappPhone | No whatsappPhone field visible anywhere in NGO screens | ⬜ | |
| 163 | Agent sees own submissions only | Agent cannot see submissions from other agents | ⬜ | |
| 164 | Role redirect enforced | Agent URL `/ngo/submissions` → redirected | ⬜ | |

### 6.4 Error Handling
| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 165 | 404 page | Navigate to `/nonsense` → Not Found screen shown | ⬜ | |
| 166 | Operations map failure | Kill network mid-load → error card shown, not blank | ⬜ | |
| 167 | Claim failure feedback | Simulate claim fail → toast appears | ⬜ | |

---

## Known Issues (Pre-existing — Do Not Report as New Bugs)

- Medium fixes (`fix/medium-bugs` branch) may not be merged yet:
  - Housing page `onSnapshot` still missing `limit()` → unbounded query
  - `phoneNumber` may still appear in NGO case cards if PR not merged
  - OperationsMap may still use unpkg CDN for Leaflet icons

---

## How to Report a Bug

For each ❌ or ⚠️ result, note:
1. **Test number** (e.g. #74)
2. **What you did** (exact steps)
3. **What happened** (actual behavior)
4. **Console errors?** (open DevTools → Console tab)
5. **Network errors?** (DevTools → Network tab → red entries)
6. **Screenshot** if helpful

---

*Total test cases: 167*
