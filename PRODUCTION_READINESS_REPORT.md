# Nasna Production Readiness Report
**Date:** March 7, 2026
**Scope:** Full live audit — Firebase console, Firestore, Auth, Cloud Functions, and all user flows on nasna.world

---

## Summary

The platform is deployable for a **soft launch** targeting public flows and agent onboarding. Several critical items must be resolved before full production operation with NGOs and the WhatsApp bot. One CSS bug affects the auth pages on direct URL load (not SPA navigation), and the WhatsApp/email integrations are entirely non-functional due to missing secrets.

---

## 🔴 CRITICAL — Blockers (must fix before launch)

### 1. Secret Manager API Not Enabled → All Integrations Dead
**What:** The GCP Secret Manager API has never been enabled on the `btrajek-se3dni` project. No secrets have been set.
**Impact:** Every Cloud Function that touches Twilio or SendGrid throws immediately. This means:
- WhatsApp bot: completely non-functional
- Stale-case NGO WhatsApp notifications: non-functional
- Case-assigned WhatsApp notifications: non-functional
- Email verification on registration: may fail silently

**Fix:**
1. Go to [GCP Console → APIs](https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=btrajek-se3dni) → Enable Secret Manager API
2. Then set all 6 secrets:
```
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set SENDGRID_FROM_EMAIL
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
```

---

### 2. Twilio Webhook URL Not Configured
**What:** The deployed `whatsappWebhook` Cloud Function URL has never been registered with Twilio's WhatsApp Sandbox or Business API.
**Impact:** Incoming WhatsApp messages from displaced people are never received by the bot.

**Fix:** In Twilio Console → Messaging → WhatsApp Sandbox (or number settings):
- Set Webhook URL to: `https://europe-west1-btrajek-se3dni.cloudfunctions.net/whatsappWebhook`
- Method: POST

---

### 3. `VITE_WHATSAPP_NUMBER` Not Set in Production Build
**What:** The `.env.example` shows `VITE_WHATSAPP_NUMBER=14155238886` (the Twilio Sandbox number). The actual production environment variable may be missing or still pointing to sandbox.
**Impact:** All QR codes for displacement centers and the WhatsApp registration link point to the wrong number.

**Fix:** Set the correct production Twilio number in the Firebase Hosting environment / build pipeline.

---

### 4. Plaintext Passwords in Firestore (Legacy v1 Data) — Data Cleanup Required
**What:** All 7 members created in October 2024 (v1 era) have `password` and `confirmPassword` stored in plaintext in their Firestore documents (verified directly in console).
**Example:** `ramykronby@gmail.com` → `password: "123456"`, `confirmPassword: "123456"`
**Current code status:** The current `Register.tsx` and `AgentRegister.tsx` do NOT write password fields — the code is already fixed. This is legacy data only.

**Fix:** Run a one-time admin cleanup script to remove these fields from all existing member documents:
```typescript
// Run once via Firebase Admin SDK / Cloud Shell
const members = await db.collection('members').get();
const batch = db.batch();
members.docs.forEach(doc => {
  batch.update(doc.ref, {
    password: FieldValue.delete(),
    confirmPassword: FieldValue.delete(),
  });
});
await batch.commit();
```

---

### 5. `emergencyContacts` Collection is Empty
**What:** The `/emergency` page renders correctly but shows no data. The `emergencyContacts` Firestore collection does not exist (will auto-create on first write).
**Impact:** The most critical public-facing page for displaced people in crisis shows nothing.

**Fix:** Admin must manually populate `emergencyContacts` via the admin panel or directly in Firestore with real Lebanese emergency numbers (Red Cross, Civil Defense, hospitals, etc.).

---

## 🟡 HIGH — Should Fix Before NGO Onboarding

### 6. Auth Pages Blank on Direct URL Load (CSS Animation Bug)
**What:** Navigating directly to `/auth/login`, `/auth/register`, or `/auth/agent` via URL bar or hard refresh shows a completely blank page. The form content is in the DOM (screen-reader accessible) but visually invisible (`opacity: 0`).
**Root cause:** `PageTransition` (`motion/react`) starts at `initial={{ opacity: 0 }}` and animates to `opacity: 1`. When `GuestRoute` shows a loading spinner then swaps to the lazy-loaded auth component, the Framer Motion animation cycle resets to initial state without replaying.
**Workaround:** The bug does NOT affect normal SPA navigation (clicking "Login" from the navbar works perfectly). Redirects from authenticated routes also work correctly.

**Fix:** Wrap each auth screen's `<Public>` element with a key prop tied to the route, or move the `PageTransition` animation inside the auth screens themselves rather than at the layout level. Alternatively, give `GuestRoute` a stable key so Framer Motion doesn't reset.

---

### 7. All Displacement Centers Show 0 Capacity
**What:** The `centers` Firestore collection has documents with `capacity: 0` for all centers.
**Impact:** Capacity display in the admin/agent views will show 0 everywhere.

**Fix:** Admin must update each center document with the correct capacity value.

---

### 8. Missing Collections (Will Auto-Create on First Use)
The following collections do not exist yet in Firestore:
- `housing` — auto-creates on first offer-housing form submission ✅
- `notifications` — auto-creates on first dispatch event ✅
- `wa_sessions` — auto-creates on first WhatsApp message ✅

These are not blockers but should be noted for monitoring.

---

### 9. Old Submissions Have Capitalized `needs` Values
**What:** Existing submissions use `"Water"`, `"Food"`, `"Medical"` (capitalized), while the current Zod enum likely uses lowercase values. This can cause mismatches in filtering/display.
**Impact:** Old cases may not render correctly in the case feed UI.

**Fix:** Either: (a) migrate old data to lowercase, or (b) make the display layer case-insensitive.

---

### 10. Firebase Dynamic Links Shutdown Warning
**What:** Firebase Auth console shows: *"The following Authentication features will stop working when Firebase Dynamic Links shuts down: email link authentication for mobile apps, as well as Cordova OAuth support for web apps."*
**Impact:** If the platform uses email link auth (magic links), those will break. Standard email/password and Google SSO are unaffected.

**Fix:** Verify whether email link auth is used. If not, no action needed. If yes, migrate to a different flow.

---

## 🟢 CONFIRMED WORKING — Public Pages

| Page | Status | Notes |
|------|--------|-------|
| `/` (landing) | ✅ | Full Arabic content, hero, stats |
| `/about` | ✅ | Hero image, mission/vision sections |
| `/submit` | ✅ | Arabic form, location type selector works |
| `/emergency` | ✅ | Renders correctly — but no data |
| `/housing` | ✅ | Renders correctly — but no data |
| `/offer-housing` | ✅ | Full form with all fields |
| `/offer-help` | ✅ | Form with Leaflet map loading |
| `/resources` | ✅ | All 6 orgs hardcoded (UNHCR, Red Cross, UNICEF, Caritas, WFP, MSF) |
| `/terms` | ✅ | Full Arabic terms, all 8 sections |
| `/about` | ✅ | Renders correctly |
| `/auth/login` | ⚠️ | Works via SPA nav, blank on direct URL |
| `/auth/register` | ⚠️ | Works via SPA nav, blank on direct URL |
| `/auth/agent` | ⚠️ | Works via SPA nav, blank on direct URL |

---

## 🟢 CONFIRMED WORKING — Auth & Route Guards

| Flow | Status | Notes |
|------|--------|-------|
| Unauthenticated → `/dashboard` | ✅ | Correctly redirects to `/auth/login` |
| Login form UI (via redirect/SPA nav) | ✅ | Two-column layout, Arabic, Google SSO button |
| Google SSO button | ✅ | Renders correctly |
| Forgot password link | ✅ | Visible |
| Rate limiting (5 attempts lock) | ✅ | Code verified |
| Security console warning | ✅ | STOP! developer warning present |

---

## 🟢 CONFIRMED WORKING — Firebase / Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Firebase Hosting | ✅ | nasna.world live, custom domain working |
| 18 Cloud Functions deployed | ✅ | All deployed to `europe-west1` |
| Firestore online | ✅ | 4 collections: centers, members, stats, submissions |
| Firebase Auth | ✅ | 8 users, email/password + Google providers |
| Firestore security rules | ✅ | Set (not audited for correctness in this session) |
| i18n (ar/en/fr) | ✅ | Arabic loads correctly on all tested pages |
| RTL layout | ✅ | Arabic right-to-left rendering correct |
| Offline banner + syncing banner | ✅ | Code verified and merged |
| `persistentLocalCache` | ✅ | Offline-first Firestore configured |

---

## 📋 Pre-Launch Checklist

### Must Do Before Any Real Users:
- [ ] Enable GCP Secret Manager API
- [ ] Set all 6 Twilio/SendGrid secrets via `firebase functions:secrets:set`
- [ ] Register Twilio webhook URL pointing to `whatsappWebhook` function
- [ ] Set correct `VITE_WHATSAPP_NUMBER` in production build env
- [ ] Run password field cleanup script on all member documents
- [ ] Populate `emergencyContacts` collection with real Lebanese numbers

### Should Do Before NGO Onboarding:
- [ ] Fix auth page blank-on-direct-load animation bug
- [ ] Update center capacities from 0 to real values
- [ ] Decide on old submissions `needs` field migration (capitalized vs lowercase)
- [ ] Verify no email link auth in use (or migrate away from it)
- [ ] Add first real admin user with `role: "admin"` in Firestore (no admin account was found in the current members collection)

### Monitoring:
- [ ] Enable Firebase Crashlytics or equivalent error monitoring
- [ ] Set up Cloud Function error alerting (currently functions run silently)
- [ ] Monitor Cloud Function cold start times (18 functions in `europe-west1`)

---

## 🔍 Observations on Current Data

- **Members:** 7 Firestore documents, all created October 2024 (v1 era). Roles found: `agent`, `member`. **No admin user found** — the admin panel has no accessible admin account in production.
- **Submissions:** Collection exists (count unknown, not opened to avoid loading all data).
- **Centers:** Collection exists with documents but capacity values are all 0.
- **Stats:** Collection exists (likely aggregated counts).

---

*Report generated by automated live audit — nasna.world, Firebase project btrajek-se3dni — March 7, 2026*
