# Nasna — Manual Testing Report
**Live URL:** `https://btrajek-se3dni.web.app`
**Date:** March 7, 2026
**Tester:** Claude (automated browser testing on behalf of Abed El-Fattah Amouneh)
**Scope:** Public routes, Auth flows, Protected route guards, Cross-cutting concerns
**Note:** Sections 3–5 (Agent, NGO, Admin authenticated screens) require Firebase test accounts — see `TESTING_PLAN.md` for setup steps.

---

## Executive Summary

| Category | Status |
|----------|--------|
| Public routes (10 pages) | ⚠️ 5 pages have issues |
| Auth flows | ⚠️ 2 critical i18n misses |
| Protected route guards | ✅ Working (minor inconsistency) |
| Language switcher | ✅ All 3 languages switch correctly |
| RTL layout | ✅ Correct on all tested pages |
| Console errors | ✅ None (1 deprecation warning) |

**Bugs Found: 11**
Critical: 3 | High: 2 | Medium: 4 | Low: 2

---

## Section 1 — Public Routes

### ✅ Pages That Pass

| Route | Status | Notes |
|-------|--------|-------|
| `/` (Home) | ✅ PASS | Hero, 4-step flow, trust section, FAQs all fully Arabic RTL. Live stats showing 14 registered cases. |
| `/housing` | ✅ PASS | Filters, dropdowns, empty states all Arabic. Dropdown options ("مجاني", "مدعوم", "مدفوع") correctly translated. |
| `/donate` | ✅ PASS | All labels Arabic, funding target dropdown options all translated ("تمويل عائلة", "تمويل مركز", "تمويل منظمة"). Button disabled until form is complete. |
| `/impact` | ✅ PASS | Live data from Firestore: 14 registered cases, pipeline chart, operational overview — all Arabic. |
| `/resources` | ✅ PASS | Org names (UNHCR, Red Cross etc.) correctly stay in English as proper nouns. "زيارة الموقع" buttons Arabic. |
| `/feedback` | ✅ PASS | All fields Arabic, char counter "0 / 2000", submit button "إرسال الملاحظة". |
| `/offer-help` | ✅ PASS | All fields Arabic, Leaflet map loads correctly with Arabic place names, "نشر الإعلان" button. |

---

### ❌ Pages With Bugs

---

#### 🔴 BUG #1 — `/submit` — Hardcoded English in location type field
**Severity:** Medium
**File:** `src/Screens/Public/Home.tsx` (public submission form)

**What's wrong:** The "Current living situation" label and all its dropdown options are hardcoded in English within an otherwise fully-Arabic RTL form.

**Observed:**
- Label: `"Current living situation"` → should be `"وضع السكن الحالي"`
- Option 1: `"Staying with family or host"` → should be `"مع عائلة أو مضيف"`
- Option 2: `"Staying in a center"` → should be `"في مركز إيواء"`

**Fix:** Add i18n keys for `locationType` label and all enum values in `ar/submission.json`. Use `t('submission.locationType')` and `t('submission.locationTypes.family')` etc.

**Validation behavior:** ✅ Clicking "الخطوة التالية" with empty fields shows Arabic toast "تأكد من إكمال جميع الحقول المطلوبة." — correct.

---

#### 🟡 BUG #2 — `/offer-housing` — No validation feedback on empty submit
**Severity:** Medium
**File:** `src/Screens/Public/OfferHousing.tsx` (or similar)

**What's wrong:** Clicking "إرسال عرض السكن" with all fields empty produces no visible feedback — no toast, no inline field errors, nothing.

**Expected:** Either inline validation errors under each required field, or a toast error like the `/submit` form.

**Fix:** Ensure the form's `onSubmit` handler calls `trigger()` or that React Hook Form is set to trigger validation on submit.

---

#### 🔴 BUG #3 — `/emergency` — ENTIRE PAGE IN ENGLISH
**Severity:** Critical (this is the emergency contacts page for people in crisis)
**File:** `src/Screens/Public/Emergency.tsx`

**What's wrong:** The entire `/emergency` page renders in English regardless of app language setting. When the app is set to Arabic, every other nav item switches, but the emergency page content is hardcoded English.

**Observed (all English):**
- Section label: `"EMERGENCY DIRECTORY"`
- Title: `"Verified emergency and response contacts"`
- Subtitle: `"Browse trusted hotlines, shelters, medical responders..."`
- Filter: `"All coverage"`, `"All categories"`
- Search placeholder: `"Search by name, phone, category, or area"`
- Empty state: `"No emergency contacts matched the current filters."`

**Fix:** All strings must be routed through `t()` calls and added to `ar/emergency.json`. This is the highest-priority fix — displaced people in crisis need to read this page.

---

#### 🟡 BUG #4 — `/about` — Body text and sections hardcoded in English
**Severity:** High
**File:** `src/Screens/Public/About.tsx`

**What's wrong:** Section headings use i18n correctly ("مهمتنا", "رؤيتنا", "انضم إلينا"), but all body text paragraphs, the "How We Operate" section, all 3 feature cards, and all 3 FAQ entries are hardcoded English.

**Observed English content:**
- Mission paragraph: `"Our mission is to connect, support, and empower NGOs..."`
- Vision paragraph: `"Our vision is a Lebanon where every individual..."`
- How We Operate: `"Support for Beneficiaries"`, `"Partnerships"`, `"Registration Process"`
- FAQs: `"Who is eligible for aid from Nasna?"`, `"How can I verify Nasna's legitimacy?"`, `"How does Nasna handle my personal information?"`
- CTA section: `"Get Involved"`, `"Join us in making a difference!"`

**Bug #4b:** The "Get Involved" CTA button label reads `"العودة إلى النموذج"` (Return to Form) — wrong label for a call-to-action. Should be something like `"سجّل الآن"` or `"انضم إلينا"`.

**Fix:** Move all body text content to `ar/about.json` locale file and use `t()` throughout. Fix the CTA button label.

---

#### 🔴 BUG #5 — `/terms` — Page completely blank
**Severity:** Critical
**File:** `src/Screens/Public/Terms.tsx` (or routes config)

**What's wrong:** Navigating to `/terms` renders only a "Terms" breadcrumb label (in English) in the top-right corner and a completely empty content area. No terms content is shown at all.

**Fix:** Either the Terms component is not rendering its content, or the route is pointing to an empty/stub component. The component needs to be fully implemented with RTL Arabic terms content.

---

## Section 2 — Auth Flows

### Login `/auth/login`

| Check | Result |
|-------|--------|
| Page renders (DOM) | ✅ Form present: "مرحباً بعودتك", email/password fields, Google button |
| All labels Arabic | ✅ "البريد الإلكتروني", "كلمة المرور", "تسجيل الدخول" |
| Split-screen layout | ✅ Left panel teal `rgb(18, 168, 157)`, right panel white |
| Forgot password | ✅ Modal opens: "إعادة تعيين كلمة المرور", email input, "إرسال رابط الإعادة" |
| `/login` URL | ⚠️ Returns 404 — correct URL is `/auth/login` (not intuitive) |

#### 🟡 BUG #8 — Login "OR" divider is English
**Severity:** Medium
**File:** `src/Screens/Auth/Login.tsx`
**Fix:** Replace `"OR"` with `t('auth.or')` → Arabic: `"أو"`

#### 🟡 BUG #10 — Forgot Password modal "Close" button is English
**Severity:** Low
**File:** Password reset modal component
**Fix:** Replace `"Close"` with `t('common.close')` → Arabic: `"إغلاق"`

---

### NGO Registration `/auth/register`

| Check | Result |
|-------|--------|
| All labels Arabic | ✅ "اسم المنظمة", "اسم الشخص المسؤول", "البريد الإلكتروني", etc. |
| Consent checkbox | ✅ Present (`input[type=checkbox]`) |
| Consent text Arabic | ✅ "بتقديم هذا النموذج، فإنك توافق على مشاركة بياناتك بشكل خاص." |

**Status: PASS** ✅

---

### Agent Registration `/auth/agent`

#### 🔴 BUG #9 — `/auth/agent` page entirely in English
**Severity:** Critical
**File:** `src/Screens/Auth/Agent.tsx` (or `AgentRegister.tsx`)

**Observed (all English):**
- Title: `"Become An Agent"`
- Fields: `"Full Name"`, `"Email"`, `"Password"`, `"Confirm Password"`, `"Phone Number"`, `"Area of Operation"`
- Button: `"Register"`

Only the consent text is Arabic. No consent checkbox is present (may be intentional for agent accounts vs. displaced person submissions).

**Fix:** Wrap all strings in `t()` calls and add keys to `ar/auth.json`.

---

## Section 3–5 — Authenticated Screens (Not Tested)

These sections require Firebase test accounts to be created manually. See `TESTING_PLAN.md` for step-by-step setup instructions for Admin, NGO Member, Agent, and Unvalidated Member accounts.

**Routes to test once accounts are set up:**

| Role | Routes |
|------|--------|
| Agent | `/agent/create`, `/agent/submissions` |
| NGO Member | `/ngo/submissions`, `/ngo/my-cases`, `/ngo/cases/:id`, `/ngo/profile-coverage` |
| Admin | `/manage`, `/manage/dispatch`, `/manage/centers`, `/manage/housing`, `/manage/impact`, `/manage/operations-map`, `/manage/submissions`, `/manage/ngo`, `/manage/agents`, `/manage/feedback`, `/manage/emergency`, `/manage/offers` |

---

## Section 6 — Cross-Cutting Concerns

### Language Switcher
✅ Globe icon in navbar opens dropdown: "English", "Arabic", "French"
✅ All three languages switch the nav, footer, and most page content correctly
⚠️ Bug #3 (Emergency) and Bug #4 (About) and Bug #9 (Agent register) content does NOT switch — hardcoded strings

### RTL Layout
✅ All tested pages render correctly in RTL (Arabic) direction
✅ Form fields, labels, and button text align right-to-left
✅ Navigation links right-to-left order

### Protected Route Guards
| Route | Unauthenticated Behavior |
|-------|--------------------------|
| `/ngo/submissions` | ✅ Redirects to `/auth/login` |
| `/agent/create` | ✅ Redirects to `/auth/login` |
| `/manage` (admin) | ⚠️ **Bug #11** — Redirects to `/` (home) instead of `/auth/login` |

#### 🟡 BUG #11 — Admin route redirect goes to home, not login
**Severity:** Medium
**File:** `src/Layout/Admin/Admin.tsx`
**Fix:** Admin layout's auth guard should redirect to `/auth/login` (same as `PrivateRoute` component), not to `/`.

### Console / JavaScript
✅ Zero JavaScript errors
⚠️ **Warning:** `enableIndexedDbPersistence()` deprecated — fires **30 times** per page load (excessive, should fire once)
→ **Fix:** Migrate to `FirestoreSettings.cache` per Firebase 12.x docs. Also investigate why the warning fires 30× — likely `initFirestore` being called repeatedly.

### 404 Page
#### 🟡 BUG #7 — 404 page not translated
**Severity:** Low
**File:** `src/Screens/NotFound.tsx` (or similar)
**What's wrong:** The 404 page shows "NotFound" and "Go Back" in English.
**Fix:** Use `t('errors.notFound')` and `t('errors.goBack')` with Arabic translations.

---

## Bug Priority Summary

| # | Severity | Route | Description | Status |
|---|----------|-------|-------------|--------|
| 3 | 🔴 Critical | `/emergency` | Entire page in English | Must fix before launch |
| 5 | 🔴 Critical | `/terms` | Page completely blank | Must fix before launch |
| 9 | 🔴 Critical | `/auth/agent` | Entire page in English | Must fix before launch |
| 4 | 🟠 High | `/about` | Body text all English, wrong CTA button | Fix soon |
| 1 | 🟡 Medium | `/submit` | "Current living situation" field in English | Fix soon |
| 2 | 🟡 Medium | `/offer-housing` | No validation feedback on submit | Fix soon |
| 8 | 🟡 Medium | `/auth/login` | "OR" divider in English | Fix soon |
| 11 | 🟡 Medium | `/manage` redirect | Goes to home instead of login | Fix soon |
| 7 | 🔵 Low | `/404` | "NotFound" / "Go Back" in English | Nice to have |
| 10 | 🔵 Low | Login modal | "Close" button in English | Nice to have |
| — | ℹ️ Info | All pages | Firestore deprecation fires 30× per load | Tech debt |

---

## Recommended Fix Order

1. **Bug #3** — `/emergency` i18n (highest impact — crisis page)
2. **Bug #5** — `/terms` blank page (legal requirement)
3. **Bug #9** — `/auth/agent` i18n (blocks agent onboarding)
4. **Bug #4** — `/about` i18n (trust-building page)
5. **Bug #1** — `/submit` location type field i18n (core public submission form)
6. **Bug #2** — `/offer-housing` validation (form UX)
7. **Bug #8 + #10** — Auth "OR" and "Close" (small i18n fixes)
8. **Bug #11** — Admin redirect target (minor UX)
9. **Bugs #7** — 404 page i18n
10. **Firestore deprecation** — migrate to new cache API

---

## Suggested Claude Code Prompt (for all i18n fixes in one pass)

```
You are fixing i18n bugs in the Nasna humanitarian aid platform.
Language: TypeScript + React + i18next. Locale files in src/locales/ar|en|fr/.

Fix the following hardcoded English strings — wrap each in t() and add keys
to all three locale files (ar/en/fr). Arabic is required, en/fr can be
placeholders if needed.

Pages to fix:
1. src/Screens/Public/Emergency.tsx — ALL strings (title, subtitle, filters, empty state, search placeholder)
2. src/Screens/Auth/Agent.tsx — ALL strings (title, field labels, submit button)
3. src/Screens/Public/About.tsx — body text paragraphs, How We Operate section, FAQ items, Get Involved CTA
4. src/Screens/Public/Home.tsx — locationType label and all dropdown option values
5. src/Screens/Public/Terms.tsx — investigate why page is blank, implement content
6. src/Screens/Auth/Login.tsx — "OR" divider
7. Password reset modal — "Close" button
8. 404 page — "NotFound" and "Go Back"

Rules per CLAUDE.md:
- All strings must go through t() — never hardcode UI strings
- Add keys to ar/, en/, fr/ locale files in the same commit
- Arabic is required — en/fr can be machine-translated placeholders temporarily
- Run pnpm tsc && pnpm format:check && pnpm check before committing
```

---

*Report generated: March 7, 2026 — Nasna Testing Session*
