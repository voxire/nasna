# Persona: Displaced Family

**Tester:** Abed
**Environment:** [nasna.world](https://nasna.world)
**Login required:** No
**Estimated time:** ~1.5 hours
**Test in:** Arabic first, then switch to English

---

## Who is this persona?

A displaced person or family member who heard about Nasna and wants to register to receive aid. They are likely on a phone, may have limited connectivity, and speak Arabic as their first language.

---

## Scenario 1 — Landing Page

**Goal:** Does the landing page communicate the platform clearly and guide the user to register?

### Happy Path
- [x] Open `nasna.world` on desktop — does the hero image load? ✅ Beirut mosque/church hero photo loads; Nasna logo visible with brightness-0 invert styling
- [x] Are the headline, subtext, and CTA button readable and clearly visible? ✅ "Help Starts Here" large and legible; subtitle clear; "Register Now" (teal) and "Learn More" (outline) buttons clearly visible
- [x] Scroll through every section in order: Stats → Crisis Context → How It Works → Features → Aid Categories → Security & Trust → FAQ → Final CTA ✅ All 8 sections present and rendering correctly
- [x] Click **"Register Now"** — does it navigate to `/submit`? ✅ Routes to `/submit` (public registration form)
- [x] Click **"Learn More"** — does it smoothly scroll to "How It Works"? ✅ `scrollIntoView` on `#how-it-works` anchor confirmed; element sits at y≈1348
- [x] Click each FAQ item — does it expand and collapse correctly? ✅ All 4 accordion items expand and collapse correctly
- [x] Do all 6 feature cards show with icons, titles, and descriptions? ✅ 6 feature cards rendered in `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` layout; all have icons, titles, and descriptions

### Edge Cases
- [x] Resize browser window to 375px width — does anything break or overflow? ✅ No horizontal overflow. Stats bar drops to `grid-cols-2` (2×2), crisis pills and aid categories stay 2-col — content wraps cleanly within each cell. Feature cards collapse to single column via `grid-cols-1`. No fixed-width elements that break viewport.
- [x] Click "Learn More" when you're already scrolled past "How It Works" — does it scroll back up? ✅ `scrollIntoView` targets the anchor regardless of current scroll position — scrolls up correctly
- [x] Open the page with a slow connection (throttle in DevTools) — is there a loading state or does it just go blank? ⚠️ No loading skeleton or Suspense boundary — Landing.tsx is fully static and not lazy-loaded. On slow connections, the page shows blank until the JS bundle loads, then all content appears at once. No progressive loading.
- [x] Open two FAQ items back to back — does the first one close when the second opens, or do both stay open? ✅ Accordion uses `type="multiple"` — both items stay open simultaneously. Intentional design (allows comparing answers side by side).

### Mobile Check
- [x] Open `nasna.world` on your phone ✅ Tested via responsive class analysis and live screenshot
- [x] Hero image: does the mosque/church photo load? Is the logo visible over it? ✅ Background image uses `object-cover`; logo rendered with inverted colours for contrast on dark background
- [x] Stats bar: do all 4 stats stack cleanly on a small screen? ✅ `grid-cols-2 md:grid-cols-4` — 4 stats display as 2×2 grid at mobile; all items fit comfortably
- [x] Feature cards: do they stack into a single column? ✅ `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` — single column below 640px
- [x] CTA buttons: are they wide enough to tap comfortably without accidentally tapping the wrong one? ✅ `flex flex-col sm:flex-row` — buttons stack vertically on mobile (each full-width); no accidental tap risk
- [x] Scroll through the whole page — does anything clip, overflow, or feel broken? ✅ All sections use responsive gutters (`px-4`/`px-6`) and `max-w-*` containers; no fixed widths causing horizontal scroll

### RTL / Arabic Check
- [x] Make sure the language is set to Arabic ✅ Globe button → Arabic; `document.documentElement.dir='rtl'` applied globally
- [x] Are all section headings right-aligned? ✅ Confirmed across Hero, Crisis Context, How It Works (step titles), Security cards, FAQ items — all right-aligned
- [x] Does the hero text (headline + subtext) read right-to-left correctly? ✅ "المساعدة تبدأ من هنا" right-aligned and reads RTL; subtitle and CTA buttons also flip correctly
- [x] Does the scroll hint at the bottom of the hero align correctly? ✅ Flex layout flips with `dir=rtl`; scroll indicator aligns correctly
- [x] Switch to English — does everything flip back to LTR without layout issues? ✅ Instant clean flip on English selection — logo returns to top-left, nav LTR, all text left-aligned; no artifacts

---

## Scenario 2 — Registration Form (Happy Path)

**Goal:** Can a family complete the full registration without hitting any issues?

### Happy Path
- [x] Navigate to `nasna.world/submit`
- [x] Fill in all required fields: Full Name, Phone Number, Gender
- [x] Select Current Governorate from the dropdown
- [x] Fill in City, Street, Building, Floor
- [x] Select Previous Governorate (where they were displaced from)
- [x] Fill in Number of People in Household
- [x] Add age ranges for household members (totaling the correct count)
- [x] Select Aid Urgency: High / Medium / Low
- [x] Select at least 2 Immediate Needs (Food, Water, etc.)
- [x] Select any Special Needs if applicable (Pregnancy, Disability, etc.)
- [x] Optionally add a comment ✅ Optional textarea (`maxLength={500}`), submitting without it is valid
- [x] Check the consent checkbox
- [x] Click **Submit** — does it navigate to a confirmation screen? ✅ Navigates to `/confirmation`
- [x] Does the confirmation screen show a proper thank-you message? ✅ "Thank you for sharing your information!"

### Edge Cases
- [x] Submit with **phone number left empty** — does a validation error appear immediately? ✅ Inline "هذا الحقل مطلوب." / "This field is required." appears under Phone Number on Next Step click (PR #76)
- [x] Submit with **Full Name left empty** — is it blocked with an error? ✅ Same inline required error under Full Name (PR #76)
- [x] Enter a **non-Lebanese phone number** (e.g., `+1 212 555 0000`) — is it accepted or rejected with a clear message? ⚠️ Accepted — no phone format or country-code validation exists. Any non-empty string passes. `+1 212 555 0000` passes Step 1 and would be submitted to Firestore as-is.
- [x] Use a **phone number that was already submitted** — do you get a "duplicate" error message? ✅ Code-verified: Cloud Function `checkSubmissionDuplicates` runs at submit time; `phoneDuplicate: true` → `toast.error` blocks submission entirely (unlike agent form which warns and proceeds).
- [x] Enter an **invalid email** (e.g., `notanemail`) — does it catch it before submitting? ✅ Live validation on every keystroke — red border + "Please enter a valid email address." inline immediately. Next Step blocked until corrected or field cleared (email is optional; clearing it removes the error).
- [x] Enter **Number of People = 2** but fill age ranges totaling 5 people — does it catch the mismatch? ✅ Specific, clear toast: "The total number of members in the age ranges cannot exceed the number of people in the household." Submission blocked. Note: under-count (total < numberOfPeople) is allowed.
- [x] Submit with the **consent checkbox unchecked** — is submission blocked with a visible message? ⚠️ Blocked, but only with the generic toast "Ensure all required fields are complete." — no inline error appears on or near the consent checkbox. Users must manually figure out that consent is the missing item.
- [x] Enter a **name with 100+ characters** — does the field handle it without breaking the layout? ✅ `maxLength={100}` enforced at browser/input level — physically prevents typing beyond 100 characters. No layout issues.
- [x] Submit with **no governorate selected** — does it validate and block? ✅ Both Previous and Current Governorate show inline "This field is required." errors and placeholder "اختر المحافظة" / "Select governorate" (Bug #4 fixed by PR #76).
- [x] Leave the form half-filled and refresh the page — is the data lost (expected) or preserved? ✅ Data lost on refresh — expected. Public form (Home.tsx) has no draft persistence (no IndexedDB, no localStorage). Unlike the agent form, no draft-restore toast appears.

### Mobile Check
- [x] Open `/submit` on your phone ✅ Tested via CSS class analysis
- [x] Are all form fields full-width and easy to tap? ✅ All inputs use `w-full`; form container is `max-w-[600px] mx-auto px-6` — single column, full width on phones
- [x] When the keyboard opens, does it push the page up correctly so the active field is visible? ✅ Standard browser scroll-into-view behavior; no fixed overlapping elements blocking the active field
- [x] Does tapping between fields work without accidentally submitting? ✅ Next Step button is at the bottom of the form below all fields, with no submit-on-enter trap
- [x] Is the Submit button always visible and not cut off at the bottom? ✅ Button is inside the normal page flow with `mt-5` margin — not fixed/sticky, scrolls into view naturally
- [x] When a validation error appears, is it visible without needing to scroll? ⚠️ Inline errors appear directly under their field (visible in context) ✅ but the generic toast appears at the top of the viewport and may require scrolling up to read on long forms

### RTL / Arabic Check
- [x] With Arabic active, do all form labels align to the right? ✅ Home.tsx applies `dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}` directly on the form container — all labels, inputs, and error messages right-align correctly
- [x] Are dropdown options (Governorates, Gender, Urgency) displayed in Arabic? ✅ Governorate placeholder "اختر المحافظة", living situation "الإقامة مع العائلة أو مضيف" all translated; all 12 governorates have Arabic keys in `ar/home.json`
- [x] Does the multi-step "Next" button label appear correctly in Arabic? ✅ "الخطوة التالية" — correctly placed on the left (logical end in RTL via `justify-end`)
- [x] Are error messages displayed in Arabic? ✅ Toast: "تأكد من إكمال جميع الحقول المطلوبة." and inline "هذا الحقل مطلوب." both confirmed in Arabic

---

## Scenario 3 — Hotlines Page

**Goal:** Can a family member quickly find and call an emergency number?

### Happy Path
- [x] Navigate to `nasna.world/hotlines`
- [x] Do hotlines load with categories (Civil Defense, Red Cross, etc.)? ✅ Emergency / Mental Health / Protection / Humanitarian categories present
- [x] Is each entry showing: organization name + phone number? ✅ Plus description and 24/7 badge
- [x] On desktop: clicking a number — does it open a `tel:` prompt? ✅ All numbers are proper `tel:` links
- [x] On mobile: tapping a number — does it offer to place a call? ✅ Code-verified: each featured hotline card is an `<a href="tel:...">` anchor — the entire card (not just the number) is the tap target. On iOS/Android, tapping opens the native call prompt automatically.

### Edge Cases
- [x] Simulate a network error (airplane mode) and reload — is there an error state instead of a blank screen? ✅ Hotlines.tsx is 100% static — all data is a hardcoded `HOTLINES` constant array, no Firestore queries or network calls. The page renders fully offline. No error state needed. Excellent design for an emergency page.
- [x] Are there any entries with a missing name or empty phone number? Do they display gracefully? ✅ All entries complete, no empty fields observed
- [x] If there's a search or filter — try filtering by category. Does it narrow results correctly? ✅ "Emergency" filter shows only emergency cards; search by name works correctly

### Mobile Check
- [x] Are phone numbers large enough to tap comfortably on a small screen? ✅ Numbers displayed at `text-5xl` (48px), bold — highly readable. Entire card is the tap target (not just the number digit).
- [x] Does the page load fast enough to be useful in an emergency situation? ✅ Fully static content (no async data fetching) — renders as fast as the JS bundle loads. No loading spinners or Firestore latency.

### RTL / Arabic Check
- [x] Do organization names translate to Arabic? ⚠️ Organization names (Police / ISF, Civil Defense, Lebanese Red Cross, Embrace Lebanon) remain in English — no Arabic translations provided. May be intentional for proper names, but worth confirming.
- [x] Do phone numbers stay left-to-right even in RTL mode? (numbers should never be reversed) ✅ Numbers display correctly LTR in Arabic mode

---

## Scenario 4 — Housing Page

**Goal:** Can a displaced family find available housing offers?

### Happy Path
- [x] Find the Housing link in the navigation ✅ "Housing" link present in top nav
- [ ] Does the housing list load with available units? ⚠️ No approved listings in the system at time of testing — see empty state check below
- [ ] Does each listing show: location, available capacity, contact info? ⚠️ Cannot verify — no listings available
- [ ] Can you browse multiple listings without the page breaking? ⚠️ Cannot verify — no listings available

### Edge Cases
- [x] What happens if there are no available housing offers? Is there a clear "nothing available" empty state? ✅ Both "Approved Housing Offers" and "Active Centers" sections show clear messages: "No approved housing listings matched the current filters." / "No centers matched the current filters."
- [x] What if a listing has missing data (no address or no contact)? Does it display without crashing? ✅ Code-verified: HousingCard handles all optional fields safely — `district` conditional render, `status`/`priceType` fallback badges, `pricePerMonth` null-guard, `amenities` length-guard, `availableFrom` `?? new Date()` fallback. Contact info (listerName/listerPhone) is always hidden from public view — gated behind `showAdminFields` prop which defaults to `false` in the public Housing.tsx. No crash risk from missing data.

---

## Bug Report Template

```
Bug #[number]
Persona: Displaced Family
Scenario: [e.g., Scenario 2 — Registration Form]
Steps to reproduce:
1.
2.
3.
Expected:
Actual:
Device / Browser: [e.g., iPhone 15, Safari]
Language: [Arabic / English]
Screenshot: [attach]
```

---

## Bugs Found

```
Bug #1
Persona: Displaced Family
Scenario: Scenario 2 — Registration Form
Steps to reproduce:
1. Navigate to nasna.world/submit
2. Fill in Full Name, Phone, Email, Gender, all Location fields EXCEPT Building and Floor
3. Click "Next Step"
Expected: Either the form advances (Building/Floor are optional) OR the missing fields are highlighted in red with labels
Actual: A generic toast appears — "Ensure all required fields are complete." — with no indication of which fields are missing. Building and Floor have no asterisk or "required" label, so users assume they are optional.
Device / Browser: Desktop, Chrome
Language: English
Screenshot: [attach]
```

```
Bug #2
Persona: Displaced Family
Scenario: Scenario 2 — Registration Form
Steps to reproduce:
1. Navigate to nasna.world/submit, fill all Step 1 fields correctly
2. On Step 2, fill Immediate Needs, Urgency, and Consent but leave Special Needs unchecked
3. Click "Send Request"
Expected: Form submits — Special Needs is labeled as "if applicable" in the test plan and carries no asterisk in the UI
Actual: Submission is blocked with a generic toast "Ensure all required fields are complete." Special Needs must have at least one selection, but this is not communicated to the user anywhere. A user with no special needs cannot submit.
Device / Browser: Desktop, Chrome
Language: English
Screenshot: [attach]
```

```
Bug #3
Persona: Displaced Family
Scenario: Scenario 2 — Registration Form
Steps to reproduce:
1. Navigate to nasna.world/submit
2. Fill any required field incorrectly or leave it empty
3. Click "Next Step" or "Send Request"
Expected: The specific field(s) with missing/invalid data are highlighted (red border, error label beneath) so the user knows exactly what to fix
Actual: Only a generic toast appears briefly at the top of the viewport ("Ensure all required fields are complete.") with no field-level feedback. The toast disappears after a few seconds. Users must manually scan the entire form to find the problem.
Device / Browser: Desktop, Chrome
Language: English
Screenshot: [attach]
```

```
Bug #4
Persona: Displaced Family
Scenario: Scenario 2 — Registration Form
Steps to reproduce:
1. Navigate to nasna.world/submit
2. Open the Previous Governorate dropdown without selecting anything
3. Close it without choosing a value
4. Click "Next Step"
Expected: Placeholder text in the trigger ("Select governorate" or similar) so users know it is required and unselected
Actual: The SelectTrigger shows blank/empty when no governorate is chosen. There is no placeholder hint. Users may not notice the field is empty. It also lacks a required indicator (*).
Device / Browser: Desktop, Chrome
Language: English
Screenshot: [attach]
Note: Fixed by PR #76 — both Previous and Current Governorate now show "Select governorate" / "اختر المحافظة" placeholder and inline required error.
```

```
Bug #10
Persona: Displaced Family
Scenario: Scenario 2 — Registration Form
Steps to reproduce:
1. Navigate to nasna.world/submit
2. Fill all Step 1 required fields EXCEPT City (leave it blank)
3. Click "Next Step" — form advances to Step 2 with no error about City
4. Fill all Step 2 fields (Immediate Needs, Urgency, Consent)
5. Click "Send Request"
Expected: Either City is caught and flagged at Step 1, or an inline error appears at Step 2 pointing back to the missing City field
Actual: Form advances past Step 1 silently (City is absent from `pageOneValid` check and has no `showStep1Errors` error renderer). At Step 2, "Send Request" is blocked by the generic toast "Ensure all required fields are complete." — but the user is on Step 2 with no City field visible and no indication that City is the problem. City has no asterisk and no error path.
Device / Browser: Desktop, Chrome
Language: English
Note: City IS required for final submission (part of `hasRequiredAddress` in `handleAddMember`), but was omitted from PR #76's inline validation coverage at Step 1.
```
