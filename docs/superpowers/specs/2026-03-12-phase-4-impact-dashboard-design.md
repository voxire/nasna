# Phase 4 — Impact Dashboard & Admin Analytics Design

**Date:** 2026-03-12
**Branch:** `feat/phase-4-impact-dashboard`
**Approach:** Layered migration — types → Cloud Functions → screens → i18n → Firestore rules

---

## Context

Phases 0–3 are complete and merged. Phase 3 landed the WhatsApp self-registration bot via Meta Cloud API. Phase 4 adds:

- Public impact dashboard (`/impact`) with live charts
- Admin analytics dashboard (`/manage/impact`) with time-series and NGO breakdown
- Scheduled daily snapshot function for historical charting
- `byGovernorate` and `byNeed` breakdown maps in `/stats/global`
- A field rename across the entire codebase (stats document, types, Cloud Functions, screens)

The donation feature (Stripe) is already fully implemented from a prior phase and is out of scope.

---

## What Already Exists

- `src/Screens/Public/Impact.tsx` — live stat cards, pipeline progress bars, uses `onSnapshot`
- `src/Screens/Admin/ImpactDashboard.tsx` — admin stat cards, queue cards, CSV export
- Both routes (`/impact`, `/manage/impact`) wired in `PublicRoutes.tsx` / `AdminRoutes.tsx`
- `impact.json` locale in all three languages with most keys already present
- Cloud Functions in `dispatchEngine.ts` maintaining `/stats/global` with incremental updates
- `GlobalStatsDocument` type in `src/types/index.ts`
- `currentCaseLoad` field on `members` documents, maintained by `incrementMemberCaseLoad` in `dispatchEngine.ts`
- Stripe donation flow in `functions/src/payments.ts` (out of scope)

---

## What Is Missing

1. `byGovernorate` and `byNeed` fields in `/stats/global` (and CF maintenance)
2. `totalPending` field (replaces manually-derived pending count)
3. `dailyStatsSnapshot` scheduled Cloud Function → `/stats/global/snapshots/{date}`
4. Charts in both screens: needs breakdown, governorate bars, status donut (public); time-series, NGO table (admin)
5. Firestore rule for `/stats/global/snapshots/{date}` subcollection
6. Field rename across all layers (see below)

---

## Pre-existing Bugs Fixed in This Phase

These are bugs in `dispatchEngine.ts` that must be corrected as part of the field rename pass:

1. **`housingAvailable` always returns 0 in production.** `refreshHousingAvailability` and `rebuildGlobalStats` both query `where('status', '==', 'approved')`, but the backfill script (`backfillV2Data.ts`) already migrated all housing documents from `status: 'approved'` to `status: 'available'`. Fix: change filter to `where('status', '==', 'available')`.

2. **`housingAvailable` reads wrong field.** The CF reads `availableSpots` from housing documents, but new housing documents created after the migration use `capacity` (as defined in `firestore.rules` `onlyFields` list). Fix: read `capacity` instead of `availableSpots` in both `refreshHousingAvailability` and `rebuildGlobalStats`. Also fix `HousingRecord` internal interface in `dispatchEngine.ts`.

---

## Known Limitations (Accepted)

- **`byGovernorate` / `byNeed` are append-only counters.** They are incremented on submission creation but never decremented on deletion or cancellation. They will drift from reality over time. The nightly `rebuildGlobalStats` is the authoritative correction mechanism. Accepted for a crisis-response context where submission deletions are rare.
- **`totalPending` drifts on cancellation.** If a case transitions to `cancelled`, `totalPending` and `totalAssigned` are not decremented. `rebuildGlobalStats` corrects. Accepted for the same reasons.
- **Daily snapshot scheduler jitter.** `set()` (not `create()`) is used intentionally so retries are idempotent. One-day-off edge cases are accepted.
- **Historical breakdown data excluded from snapshots.** `byGovernorate` and `byNeed` are omitted from `StatsSnapshotDocument`. Deferred to Phase 5.

---

## Deployment Sequence

The field rename causes a data migration window: after CF deployment, the Firestore document still has old field names; the new frontend will read the new field names and see all zeros. The sequence to avoid this:

1. Deploy Cloud Functions with renamed field names.
2. **Immediately** trigger `nightlyGlobalStatsRebuild` (or `rebuildGlobalStats`) manually via the Firebase Console or Firebase Admin CLI — do not wait for the scheduled run. This writes all new field names with correct values.
3. Deploy the frontend.

If steps 2 and 3 are reversed, or if step 2 is skipped, users will see the impact page showing all zeros until the nightly rebuild runs. This is not data-destructive but is visually broken.

`ensureGlobalStatsDocument` uses `{ merge: true }` — it will not overwrite old field values, but also will not populate new fields from old ones. The manual rebuild trigger is the only correction mechanism.

---

## Implementation Atomicity

The `GlobalStatsDocument` type rename and all consuming code (`Impact.tsx`, `ImpactDashboard.tsx`, `dispatchEngine.ts`, `DEFAULT_STATS` objects in both screens) **must be updated in a single pass**. Any partial update will cause `pnpm tsc` to fail. Do not update the type file and leave the screens referencing old field names, even temporarily.

---

## Layer 1 — Types

### Field Rename

| Old name | New name |
|---|---|
| `submissionsRegistered` | `totalRegistered` |
| `submissionsAssigned` | `totalAssigned` |
| `submissionsCompleted` | `totalCompleted` |
| `peopleHelped` | `totalPeopleHelped` |
| `activeNgoCount` | `activeNGOs` |
| `updatedAt` | `lastUpdatedAt` |

### Updated `GlobalStatsDocument`

`lastUpdatedAt` is typed as `Timestamp | Date` because Firestore returns `Timestamp` from `onSnapshot`. At the render layer, check `instanceof Timestamp` before calling `.toDate()`:

```ts
const date = lastUpdatedAt instanceof Timestamp ? lastUpdatedAt.toDate() : lastUpdatedAt;
```

```ts
import type { Timestamp } from 'firebase/firestore';

export interface GlobalStatsDocument {
  totalRegistered: number;
  totalAssigned: number;
  totalCompleted: number;
  totalPeopleHelped: number;
  totalPending: number;
  activeNGOs: number;
  housingAvailable: number;
  byGovernorate: Record<string, number>;
  byNeed: Record<string, number>;
  lastUpdatedAt?: Timestamp | Date;
}
```

### New `StatsSnapshotDocument`

`byGovernorate` and `byNeed` intentionally excluded — see Known Limitations.

```ts
export interface StatsSnapshotDocument {
  date: string;              // YYYY-MM-DD
  totalRegistered: number;
  totalAssigned: number;
  totalCompleted: number;
  totalPeopleHelped: number;
  totalPending: number;
  snapshotAt: Timestamp | Date;
}
```

---

## Layer 2 — Cloud Functions (`dispatchEngine.ts`)

### `ensureGlobalStatsDocument` — must be updated

This bootstrap function writes all stats fields with `{ merge: true }`. It **must** be updated to use the new field names. If any old names remain, they will be written alongside the new ones on every trigger, causing both old and new fields to coexist in the document permanently. After the update it should initialise:

```ts
totalRegistered: 0, totalAssigned: 0, totalCompleted: 0,
totalPeopleHelped: 0, totalPending: 0, activeNGOs: 0,
housingAvailable: 0, byGovernorate: {}, byNeed: {},
lastUpdatedAt: new Date()
```

### `onNewSubmission` — new increments

`needs` defaults to `[]` to guard against missing data from pre-bot submissions:

```ts
const needs = submission.needs ?? [];

await GLOBAL_STATS_DOC.set({
  totalRegistered: FieldValue.increment(1),
  totalPending: FieldValue.increment(1),
  [`byGovernorate.${governorate}`]: FieldValue.increment(1),
  ...needs.reduce<Record<string, FieldValue>>((acc, need) => ({
    ...acc,
    [`byNeed.${need}`]: FieldValue.increment(1),
  }), {}),
  lastUpdatedAt: new Date(),
}, { merge: true });
```

### `onCaseAssigned` — two separate guards

This function has two distinct concerns, each with its own guard:

1. **`totalPending` / `totalAssigned` stats** — Use the same guard as the existing code: increment `totalAssigned` only when `previousAssignedTo` is falsy (first ever assignment, regardless of status). Decrement `totalPending` only when `beforeStatus === 'pending'` (the case was in the pending pool).

2. **Reassignment** — when `previousAssignedTo` is truthy and different from `nextAssignedTo`, neither `totalPending` nor `totalAssigned` changes (the case stays in the assigned pool, just with a different owner).

```ts
const beforeStatus = before.status ?? 'pending';
const previousAssignedTo = before.assignedTo ?? '';
const isEverFirstAssignment = !previousAssignedTo; // matches existing code logic

await GLOBAL_STATS_DOC.set({
  ...(isEverFirstAssignment ? {
    totalAssigned: FieldValue.increment(1),
  } : {}),
  ...(isEverFirstAssignment && beforeStatus === 'pending' ? {
    totalPending: FieldValue.increment(-1),
  } : {}),
  lastUpdatedAt: new Date(),
}, { merge: true });
```

### `onCaseCompleted` — updated increments with state guards

This function runs when `nextStatus` becomes terminal (`'completed'` or `'cancelled'`). `wasPending` handles the admin-override path where a case goes directly `pending → completed` without ever being assigned — this path exists and must decrement `totalPending`. `wasPending` and `wasAssigned` are mutually exclusive (a case is in exactly one state at a time).

Guards against both direct `pending → completed` and normal `assigned/in_progress → completed`:

```ts
const beforeStatus = before.status ?? 'pending';
const wasPending = beforeStatus === 'pending';
const wasAssigned = beforeStatus === 'assigned' || beforeStatus === 'in_progress';

if (nextStatus === 'completed') {
  await GLOBAL_STATS_DOC.set({
    totalCompleted: FieldValue.increment(1),
    totalPeopleHelped: FieldValue.increment(after.numberOfPeopleInHousehold ?? 0),
    ...(wasAssigned ? { totalAssigned: FieldValue.increment(-1) } : {}),
    ...(wasPending ? { totalPending: FieldValue.increment(-1) } : {}),
    lastUpdatedAt: new Date(),
  }, { merge: true });
}
```

### `rebuildGlobalStats` — rewritten with pagination

The existing implementation uses a single `db.collection('submissions').get()` with no `limit()` or pagination. **This implementation is replaced** by a paginated scan using cursor-based batches of 200 with `startAfter`, identical to the existing `dailyStaleCaseCheck` pattern. Explicit comment required:

```ts
// ADMIN REBUILD TOOL: full collection scan is intentional here.
// This function is scheduled nightly and invoked manually by admins only.
// Client-facing queries must never do unbounded scans.
```

Computes all fields and writes them in a single `set()`:

| Field | Source |
|---|---|
| `totalRegistered` | total submission count |
| `totalPending` | count where `status === 'pending'` |
| `totalAssigned` | count where `status === 'assigned'` or `'in_progress'` |
| `totalCompleted` | count where `status === 'completed'` |
| `totalPeopleHelped` | sum of `numberOfPeopleInHousehold` for completed cases |
| `activeNGOs` | existing logic: members where `validated === true && currentCaseLoad > 0` |
| `housingAvailable` | sum of `capacity` for housing where `status === 'available'` (fixes pre-existing bug — see above) |
| `byGovernorate` | accumulate `{ [governorate]: count }` — skip if `currentGovernorate` missing |
| `byNeed` | accumulate `{ [need]: count }` — use `needs ?? []` to guard null/undefined |

### New: `dailyStatsSnapshot` (scheduled, 00:00 UTC)

`GLOBAL_STATS_DOC = db.collection('stats').doc('global')` — the document ID `'global'` is a permanent system constant. Cloud Functions use the Admin SDK, which bypasses all Firestore security rules. The `allow write: if false` in the client rule is intentional — it prevents any client write to snapshots, while the CF write proceeds unaffected via Admin SDK.

```ts
export const dailyStatsSnapshot = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'UTC', region: 'europe-west1' },
  async () => {
    const globalSnap = await GLOBAL_STATS_DOC.get();
    if (!globalSnap.exists) return;
    const data = globalSnap.data()!;
    // set() not create() — idempotent on retry
    const date = new Date().toISOString().slice(0, 10);
    await GLOBAL_STATS_DOC.collection('snapshots').doc(date).set({
      date,
      totalRegistered: data.totalRegistered ?? 0,
      totalAssigned: data.totalAssigned ?? 0,
      totalCompleted: data.totalCompleted ?? 0,
      totalPeopleHelped: data.totalPeopleHelped ?? 0,
      totalPending: data.totalPending ?? 0,
      snapshotAt: new Date(),
    });
    logger.info('Daily stats snapshot written', { date });
  },
);
```

Export it from `index.ts`.

---

## Layer 3 — Frontend Screens

### Shared: `useCountUp` hook

`src/hooks/useCountUp.ts`, signature: `function useCountUp(target: number, duration = 800): number`. When `target` changes mid-animation, the animation restarts from the currently displayed value (not from zero).

### `recharts` installation

```bash
pnpm add recharts
```

### `byNeed` i18n key strategy

Known need values come from two sources:
- **WhatsApp bot** (`NEED_MAP` in `whatsappWebhook.ts`): `food | water | shelter | medical | clothing | baby_supplies | psychosocial | legal_docs`
- **Web form** (locale files): also includes `hygiene`

These 9 values are already translated at `submission.needs.${key}` in all three locale files. Chart labels reuse these existing keys — **do not add new `impact.*` keys for needs**. Use `t('submission.needs.${key}', { defaultValue: key })` so any additional future values degrade gracefully to the raw string.

### Loading and error states

Charts derive from the same `onSnapshot` listener that populates stat cards. The initial all-zero `DEFAULT_STATS` value is the loading state. Charts with all-zero data must show an empty-state placeholder (a brief "no data yet" message inside the chart area), not blank space. If `onSnapshot` or `getDocs` emits an error: fire a `sonner` error toast and keep the last-known values displayed.

### Pre-existing unbounded `onSnapshot` violation in `ImpactDashboard.tsx`

The existing `ImpactDashboard.tsx` has an unbounded `onSnapshot` on the `submissions` collection (filtered by `status === 'pending'`). This violates the project's hard rule against unbounded collection reads. Since Phase 4 touches this file anyway, this violation **must be fixed** in the same PR.

Fix: replace with two separate `onSnapshot` calls using `limit(500)` and accept approximate counts, or better, derive `pendingUrgentCases` and `staleCases` from the `/stats/global` document directly (requires adding `pendingUrgentCount` and `stalePendingCount` to the global stats — if out of scope, use `limit(500)` as an interim fix and add a `// ⚠️ CRISIS WORKAROUND` comment).

**Decision required from developer before implementation:** fix with `limit(500)` workaround or add derived stats fields? Add this to the pre-implementation decision list.

### `src/Screens/Public/Impact.tsx`

Keeps existing hero + stat card grid + pipeline section. Adds three new sections below:

**Needs Breakdown** (`byNeed`)
- `recharts BarChart`, `layout="vertical"` (horizontal bars), RTL-aware
- Sorted descending by count
- Labels: `t('submission.needs.${key}', { defaultValue: key })`
- Empty state if `byNeed` is empty or all zeros

**Coverage by Area** (`byGovernorate`)
- `recharts BarChart`, vertical bars
- Sorted descending by count
- X-axis labels truncated to 12 chars for mobile
- Empty state if `byGovernorate` is empty

**Status Split** (`pending / assigned / completed`)
- `recharts PieChart` with three named slices: `totalPending`, `totalAssigned`, `totalCompleted`
- Simple legend below the chart
- If all three are zero, show empty-state text

All large stat numbers wrapped in `useCountUp`. Number localisation: `value.toLocaleString(i18n.language)` — locale string directly, not an object.

### `src/Screens/Admin/ImpactDashboard.tsx`

All existing cards preserved. The unbounded `onSnapshot` on `submissions` is fixed (see above). Three new sections added:

**Time-series line chart**
- `getDocs(query(collection(db, 'stats', 'global', 'snapshots'), orderBy('date'), limit(90)))`
- `recharts LineChart` with two lines: `totalRegistered` (slate) and `totalCompleted` (emerald)
- X-axis: `date` field displayed as `DD/MM`
- Empty state: "No snapshot data yet" if collection empty

**NGO breakdown table**
- `getDocs(query(collection(db, 'members'), where('role', '==', 'member'), where('validated', '==', true), orderBy('name'), limit(50)))`
- `orderBy('name')` ensures stable ordering. Requires composite index — see Layer 5.
- Columns: Name, Governorates Covered, Current Caseload, Aid Types
- `currentCaseLoad` from `members` document (maintained by `incrementMemberCaseLoad`)
- No per-NGO completed count — deferred to Phase 5
- Loading: skeleton row; error: `sonner` toast

**CSV export (improved)**
- If snapshots exist: date rows, columns `date, totalRegistered, totalCompleted, totalPeopleHelped, totalPending, totalAssigned`
- Falls back to single-row current stats if no snapshots exist yet
- Filename: `nasna_impact_export_${new Date().toISOString().slice(0, 10)}.csv`
- Same `Blob + URL.createObjectURL` pattern as existing export

---

## Layer 4 — i18n

New keys to add to **all three** locale files (`ar/`, `en/`, `fr/`):

```json
// Under impact.public:
"needsBreakdown": "...",
"coverageByArea": "...",
"statusSplit": "...",
"pending": "...",
"noData": "..."

// Under impact.admin:
"timeSeries": "...",
"noSnapshotData": "...",
"ngoBreakdown": "...",
"ngoName": "...",
"governoratesCovered": "...",
"currentCaseLoad": "...",
"aidTypes": "..."
```

Arabic is required and primary. English and French must be present. The need-type translations live at `submission.needs.*` — do not duplicate under `impact`.

---

## Layer 5 — Firestore Rules

### Firestore rule scoping

Firestore security rules are path-based and do not cascade to subcollections. `match /stats/{statsId}` applies only to documents at `/stats/{docId}` — not to `/stats/global/snapshots/{date}`. No recursive wildcard (`=**`) is used. Cloud Functions write via Admin SDK, which bypasses all client-facing rules.

### Snapshot subcollection rule

The rule must be placed as a **top-level `match` block** inside `match /databases/{database}/documents { ... }` — not nested inside the existing `match /stats/{statsId}` block. Nesting it would make it unreachable because the parent pattern (`{statsId}`) would need to match the literal `global` path segment, which it doesn't resolve correctly for nested subcollection rules. The correct placement in `firestore.rules`:

```
service cloud.firestore {
  match /databases/{database}/documents {

    // ... existing rules ...

    match /stats/{statsId} {
      allow read: if statsId == 'global';
      allow write: if isAdmin();
      // This rule covers /stats/{docId} documents only — NOT subcollections.
    }

    // Snapshot subcollection — separate top-level match, not nested above
    match /stats/global/snapshots/{date} {
      allow read: if true;
      allow write: if false;
      // CF writes via Admin SDK — this rule only blocks client writes.
    }

  }
}
```

### Existing `/stats/{statsId}` rule

No change needed. It does not cover subcollections (no recursive wildcard).

### Composite index for NGO table query

Add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "members",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "validated", "order": "ASCENDING" },
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
}
```

---

## Pre-Implementation Decision

**ImpactDashboard unbounded `onSnapshot` fix strategy:** The developer must decide before implementation begins whether to:

- **Option A** — `limit(500)` workaround with `// ⚠️ CRISIS WORKAROUND` comment
- **Option B** — Add `pendingUrgentCount` and `stalePendingCount` fields to `/stats/global` (maintained by Cloud Functions) and read them from the stats document directly — removes the submissions `onSnapshot` entirely

Confirm which option before writing code.

---

## Completion Checklist

- [ ] `pnpm format` exits 0
- [ ] `pnpm tsc` exits 0 (frontend + functions)
- [ ] Pre-existing bug: housing filter changed to `status === 'available'` in `refreshHousingAvailability` and `rebuildGlobalStats`
- [ ] Pre-existing bug: housing field changed from `availableSpots` to `capacity` in same functions; `HousingRecord` internal interface updated
- [ ] `ensureGlobalStatsDocument` updated to new field names (no old fields remain)
- [ ] `GlobalStatsDocument` updated; `lastUpdatedAt` typed as `Timestamp | Date`
- [ ] `StatsSnapshotDocument` added; `snapshotAt` typed as `Timestamp | Date`
- [ ] `rebuildGlobalStats`: paginated, computes all fields including `housingAvailable` and `activeNGOs`, explicit comment
- [ ] `onNewSubmission`: `needs ?? []`, increments `totalPending`/`byGovernorate`/`byNeed`
- [ ] `onCaseAssigned`: `!previousAssignedTo` guard for `totalAssigned`; `beforeStatus === 'pending'` guard for `totalPending`
- [ ] `onCaseCompleted`: `wasAssigned` guard for `totalAssigned`; `wasPending` guard for `totalPending`
- [ ] `dailyStatsSnapshot`: `set()` not `create()`, exported from `index.ts`
- [ ] Pre-existing unbounded `onSnapshot` in `ImpactDashboard` fixed (chosen option documented)
- [ ] `recharts` added to `package.json`
- [ ] `useCountUp` hook: animates from current displayed value on target change
- [ ] Both screens: empty-state placeholders for charts; `sonner` error toast on listener failure
- [ ] `Impact.tsx`: 3 new chart sections; `t('submission.needs.${key}')` labels; `toLocaleString(i18n.language)`
- [ ] `ImpactDashboard.tsx`: time-series chart; NGO table with `orderBy('name')`; improved CSV
- [ ] Composite Firestore index in `firestore.indexes.json`
- [ ] i18n keys in `ar/`, `en/`, `fr/`; no duplication of `submission.needs.*`
- [ ] Firestore snapshot rule added as top-level `match` block (not nested inside `/stats/{statsId}`)
- [ ] No PII in any new log statements
- [ ] No client-facing `getDocs`/`onSnapshot` without `limit()`
