# Phase 2: Housing Marketplace — Design Spec

**Date:** 2026-03-11
**Branch:** `feat/phase-2-housing-marketplace`
**Phases complete:** 0, 1

---

## Overview

Phase 2 adds three capabilities to Nasna:
1. **Centers management** — admin CRUD for displacement centers, with live occupancy tracking
2. **Redesigned CreateSubmission** — locationType toggle that shows CenterPicker or free-text location
3. **Housing listings** — public offer form, admin review workflow, and public directory

The existing codebase has a Phase 2 skeleton but with an older schema. Every file needs to be aligned to the spec-defined types.

---

## Part A — Centers (`/admin/centers`)

### Data Model (`CenterDocument`)
```ts
{
  id: string
  name: string
  type: 'school' | 'university' | 'community_hall' | 'sports_facility' | 'other'
  governorate: string
  district?: string
  address?: string
  coordinates?: { lat: number; lng: number }
  totalCapacity: number
  currentOccupancy: number
  facilities?: ('generator' | 'water' | 'kitchen' | 'medical_room' | 'bathrooms' | 'internet')[]
  managerName?: string
  managerPhone?: string  // PII: admin only
  isActive: boolean
  createdBy: string
  updatedAt: Timestamp
}
```

### CapacityBar component
- Green: occupancy < 75%
- Yellow: 75–90%
- Red: > 90%
- Grey: `isActive === false`
- Props: `{ totalCapacity, currentOccupancy, isActive }`

### CenterManagement screen
- `onSnapshot` with `limit(25)` + cursor pagination
- Table: name, type, governorate, currentOccupancy/totalCapacity, CapacityBar, isActive toggle, edit/delete
- Dialog: full CRUD, all fields, Zod-validated
- `managerPhone` shown in dialog (admin only — never in public views)

### CenterPicker component
- Queries `centers` where `isActive === true`
- Groups options by governorate
- Shows occupancy status alongside name
- Used in CreateSubmission when `locationType === 'center'`

### Firestore rule
```
match /centers/{centerId} {
  allow read: if isSignedIn();
  allow write: if isAdmin();
}
```

---

## Part B — CreateSubmission Redesign

**File:** `src/Screens/Private/CreateSubmission.tsx`

The `locationType` field and `CenterPicker` import already exist. Changes needed:
1. The toggle should be a **prominent segmented control** (not a Select), showing "At a displacement center" | "With family in a safe area"
2. When `locationType === 'center'`: show CenterPicker, hide governorate/district free-text; `centerId` required
3. When `locationType === 'with_family'`: hide CenterPicker, show existing governorate/area fields; `centerId` null
4. CenterPicker must use updated `isActive` field (was `active`)

---

## Part C — Housing (`/offer-housing`, `/admin/housing`, `/housing`)

### Data Model (`HousingDocument`)
```ts
{
  id: string
  listerId: string         // UID or 'anonymous'
  listerName: string       // PII: admin only
  listerPhone: string      // PII: admin only. NEVER shown publicly
  type: 'apartment' | 'room' | 'house' | 'floor'
  governorate: string
  district?: string
  capacity: number
  priceType: 'free' | 'subsidized' | 'market_rate'
  pricePerMonth?: number
  availableFrom: Timestamp
  availableUntil?: Timestamp
  amenities?: ('generator' | 'water' | 'internet' | 'washing_machine' | 'furnished' | 'private_bathroom')[]
  description?: string
  status: 'pending_review' | 'available' | 'reserved' | 'filled'
  approvedBy?: string
  createdAt: Timestamp
}
```

**Key PII rule:** `listerName` and `listerPhone` MUST NEVER appear in any public-facing component or query.

### OfferHousing (`/offer-housing`) — public, no auth
- All spec fields
- `pricePerMonth` shown only when `priceType !== 'free'`
- Writes with `status: 'pending_review'`, `listerId: 'anonymous'`
- Sonner toast on success/error

### HousingReview (`/admin/housing`) — admin only
- **Tab 1 — Pending Review:** shows all fields including `listerPhone`. Approve → sets `status: 'available'`. Reject → delete or mark rejected.
- **Tab 2 — Approved Listings:** status management `available → reserved → filled`, delete option
- `onSnapshot`, `limit(25)` + pagination

### HousingCard component
- Shows: type, governorate, district, capacity badge ("Up to X people"), priceType badge, amenities chips, availableFrom
- **NEVER** shows `listerName` or `listerPhone`
- "Contact via Nasna" button (no direct lister contact exposed)

### HousingDirectory (`/housing`) — public, no auth
- Filters: governorate, type, capacity (min), priceType
- Queries only `status === 'available'`
- No getDocs without limit

### Firestore rules
```
match /housing/{housingId} {
  allow create: if true;  // unauthenticated allowed
  allow read: if isAdmin() || resource.data.status == 'available';
  allow update, delete: if isAdmin();
}
```

---

## Part D — i18n

New keys to add to `ar/`, `en/`, `fr/` housing.json (or relevant file):
- `housing.offer.title/success`
- `housing.directory.title`, `housing.directory.filters.*`
- `housing.card.capacity/free/subsidized/marketRate`
- `housing.admin.pendingReview/approve/reject`
- `centers.admin.title/occupancy`, `centers.capacity.full/nearFull`
- `submission.locationTypeCenter/locationTypeFamily/selectCenter`

---

## Files to Change

| File | Action |
|------|--------|
| `src/types/index.ts` | Update `CenterDocument`, `HousingDocument`, `HousingStatus` |
| `src/Components/CapacityBar.tsx` | New thresholds + `isActive` grey state |
| `src/Components/CenterPicker.tsx` | Use `isActive`, group by governorate, show occupancy |
| `src/Components/HousingCard.tsx` | New field names, no PII |
| `src/Screens/Admin/CenterManagement.tsx` | New schema, CapacityBar, facilities |
| `src/Screens/Private/CreateSubmission.tsx` | Segmented control, CenterPicker show/hide |
| `src/Screens/Public/OfferHousing.tsx` | New schema, lister fields, amenities |
| `src/Screens/Admin/HousingReview.tsx` | Two tabs, new schema, approve=available |
| `src/Screens/Public/Housing.tsx` | Filters, status=available only, new fields |
| `firestore.rules` | Update centers + housing rules |
| `src/locales/ar/housing.json` | New keys |
| `src/locales/en/housing.json` | New keys |
| `src/locales/fr/housing.json` | New keys |
| `src/locales/ar/submission.json` | New locationType keys |
| `src/locales/en/submission.json` | New locationType keys |
| `src/locales/fr/submission.json` | New locationType keys |

---

## Completion Criteria

- [ ] `pnpm format` exits 0
- [ ] `pnpm tsc` exits 0
- [ ] CapacityBar: correct green/yellow/red/grey thresholds
- [ ] CenterManagement: CRUD with new schema, live occupancy via onSnapshot
- [ ] CenterPicker: uses `isActive`, groups by governorate
- [ ] CreateSubmission: segmented control, CenterPicker hidden/shown correctly
- [ ] OfferHousing: all new fields, writes status=pending_review
- [ ] HousingReview: two tabs, approve → status=available
- [ ] HousingDirectory: available only, never shows listerPhone
- [ ] HousingCard: no PII fields rendered
- [ ] Firestore rules updated for centers + housing
- [ ] All PII fields annotated with `// PII:` comments
- [ ] All i18n keys in ar/, en/, fr/
- [ ] No `getDocs` without `limit()`
