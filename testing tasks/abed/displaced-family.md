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
- [ ] Open `nasna.world` on desktop — does the hero image load?
- [ ] Are the headline, subtext, and CTA button readable and clearly visible?
- [ ] Scroll through every section in order: Stats → Crisis Context → How It Works → Features → Aid Categories → Security & Trust → FAQ → Final CTA
- [ ] Click **"Register Now"** — does it navigate to `/submit`?
- [ ] Click **"Learn More"** — does it smoothly scroll to "How It Works"?
- [ ] Click each FAQ item — does it expand and collapse correctly?
- [ ] Do all 6 feature cards show with icons, titles, and descriptions?

### Edge Cases
- [ ] Resize browser window to 375px width — does anything break or overflow?
- [ ] Click "Learn More" when you're already scrolled past "How It Works" — does it scroll back up?
- [ ] Open the page with a slow connection (throttle in DevTools) — is there a loading state or does it just go blank?
- [ ] Open two FAQ items back to back — does the first one close when the second opens, or do both stay open?

### Mobile Check
- [ ] Open `nasna.world` on your phone
- [ ] Hero image: does the mosque/church photo load? Is the logo visible over it?
- [ ] Stats bar: do all 4 stats stack cleanly on a small screen?
- [ ] Feature cards: do they stack into a single column?
- [ ] CTA buttons: are they wide enough to tap comfortably without accidentally tapping the wrong one?
- [ ] Scroll through the whole page — does anything clip, overflow, or feel broken?

### RTL / Arabic Check
- [ ] Make sure the language is set to Arabic
- [ ] Are all section headings right-aligned?
- [ ] Does the hero text (headline + subtext) read right-to-left correctly?
- [ ] Does the scroll hint at the bottom of the hero align correctly?
- [ ] Switch to English — does everything flip back to LTR without layout issues?

---

## Scenario 2 — Registration Form (Happy Path)

**Goal:** Can a family complete the full registration without hitting any issues?

### Happy Path
- [ ] Navigate to `nasna.world/submit`
- [ ] Fill in all required fields: Full Name, Phone Number, Gender
- [ ] Select Current Governorate from the dropdown
- [ ] Fill in City, Street, Building, Floor
- [ ] Select Previous Governorate (where they were displaced from)
- [ ] Fill in Number of People in Household
- [ ] Add age ranges for household members (totaling the correct count)
- [ ] Select Aid Urgency: High / Medium / Low
- [ ] Select at least 2 Immediate Needs (Food, Water, etc.)
- [ ] Select any Special Needs if applicable (Pregnancy, Disability, etc.)
- [ ] Optionally add a comment
- [ ] Check the consent checkbox
- [ ] Click **Submit** — does it navigate to a confirmation screen?
- [ ] Does the confirmation screen show a proper thank-you message?

### Edge Cases
- [ ] Submit with **phone number left empty** — does a validation error appear immediately?
- [ ] Submit with **Full Name left empty** — is it blocked with an error?
- [ ] Enter a **non-Lebanese phone number** (e.g., `+1 212 555 0000`) — is it accepted or rejected with a clear message?
- [ ] Use a **phone number that was already submitted** — do you get a "duplicate" error message?
- [ ] Enter an **invalid email** (e.g., `notanemail`) — does it catch it before submitting?
- [ ] Enter **Number of People = 2** but fill age ranges totaling 5 people — does it catch the mismatch?
- [ ] Submit with the **consent checkbox unchecked** — is submission blocked with a visible message?
- [ ] Enter a **name with 100+ characters** — does the field handle it without breaking the layout?
- [ ] Submit with **no governorate selected** — does it validate and block?
- [ ] Leave the form half-filled and refresh the page — is the data lost (expected) or preserved?

### Mobile Check
- [ ] Open `/submit` on your phone
- [ ] Are all form fields full-width and easy to tap?
- [ ] When the keyboard opens, does it push the page up correctly so the active field is visible?
- [ ] Does tapping between fields work without accidentally submitting?
- [ ] Is the Submit button always visible and not cut off at the bottom?
- [ ] When a validation error appears, is it visible without needing to scroll?

### RTL / Arabic Check
- [ ] With Arabic active, do all form labels align to the right?
- [ ] Are dropdown options (Governorates, Gender, Urgency) displayed in Arabic?
- [ ] Does the multi-step "Next" button label appear correctly in Arabic?
- [ ] Are error messages displayed in Arabic?

---

## Scenario 3 — Hotlines Page

**Goal:** Can a family member quickly find and call an emergency number?

### Happy Path
- [ ] Navigate to `nasna.world/hotlines`
- [ ] Do hotlines load with categories (Civil Defense, Red Cross, etc.)?
- [ ] Is each entry showing: organization name + phone number?
- [ ] On desktop: clicking a number — does it open a `tel:` prompt?
- [ ] On mobile: tapping a number — does it offer to place a call?

### Edge Cases
- [ ] Simulate a network error (airplane mode) and reload — is there an error state instead of a blank screen?
- [ ] Are there any entries with a missing name or empty phone number? Do they display gracefully?
- [ ] If there's a search or filter — try filtering by category. Does it narrow results correctly?

### Mobile Check
- [ ] Are phone numbers large enough to tap comfortably on a small screen?
- [ ] Does the page load fast enough to be useful in an emergency situation?

### RTL / Arabic Check
- [ ] Do organization names translate to Arabic?
- [ ] Do phone numbers stay left-to-right even in RTL mode? (numbers should never be reversed)

---

## Scenario 4 — Housing Page

**Goal:** Can a displaced family find available housing offers?

### Happy Path
- [ ] Find the Housing link in the navigation
- [ ] Does the housing list load with available units?
- [ ] Does each listing show: location, available capacity, contact info?
- [ ] Can you browse multiple listings without the page breaking?

### Edge Cases
- [ ] What happens if there are no available housing offers? Is there a clear "nothing available" empty state?
- [ ] What if a listing has missing data (no address or no contact)? Does it display without crashing?

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
