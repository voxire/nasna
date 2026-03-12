# Phase 4 Impact Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live impact charts to the public `/impact` page and the admin `/manage/impact` dashboard, maintain `byGovernorate`/`byNeed` breakdown maps and a daily stats snapshot in Firestore, and rename the existing stat fields across types, Cloud Functions, and screens.

**Architecture:** Layered migration (types → Cloud Functions → screens → i18n → Firestore rules) so TypeScript catches every broken reference atomically. All stats increment at the Cloud Function layer via `FieldValue.increment()` with merge writes; the frontend reads only via `onSnapshot` or bounded `getDocs` with `limit()`.

**Tech Stack:** React 19 + TypeScript, Firebase Cloud Functions v2 (europe-west1), Firestore, recharts (new), i18next (ar/en/fr primary), Jest + React Testing Library.

**Pre-implementation decision recorded:** The pre-existing unbounded `onSnapshot` on `submissions` in `ImpactDashboard.tsx` is fixed with **Option A** — `limit(500)` workaround with `// ⚠️ CRISIS WORKAROUND` comment. No new Cloud Function fields needed.

**Spec:** `docs/superpowers/specs/2026-03-12-phase-4-impact-dashboard-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/types/index.ts` | Rename `GlobalStatsDocument` fields; add `StatsSnapshotDocument` |
| Modify | `functions/src/dispatchEngine.ts` | All stats field renames, housing bug fixes, new increments, `dailyStatsSnapshot` |
| Modify | `functions/src/index.ts` | Export `dailyStatsSnapshot` |
| Modify | `src/Screens/Public/Impact.tsx` | Rename field refs, add 3 chart sections |
| Modify | `src/Screens/Admin/ImpactDashboard.tsx` | Fix unbounded snapshot, add time-series + NGO table + improved CSV |
| Create | `src/hooks/useCountUp.ts` | rAF-based count-up animation hook |
| Create | `src/__tests__/hooks/useCountUp.test.ts` | Unit test for the hook |
| Modify | `src/locales/ar/impact.json` | New chart section keys (Arabic primary) |
| Modify | `src/locales/en/impact.json` | New chart section keys (English) |
| Modify | `src/locales/fr/impact.json` | New chart section keys (French) |
| Modify | `firestore.rules` | Add top-level snapshot subcollection rule |
| Modify | `firestore.indexes.json` | Add composite index for NGO table query |

---

## Chunk 1: Types + Cloud Functions

### Task 1: Set up the feature branch

- [ ] **Check out main and pull**

```bash
git checkout main && git pull origin main
```

- [ ] **Create the feature branch**

```bash
git checkout -b feat/phase-4-impact-dashboard
```

---

### Task 2: Update types (`src/types/index.ts`)

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/Screens/Public/Impact.tsx` (DEFAULT_STATS + field refs only — charts added later)
- Modify: `src/Screens/Admin/ImpactDashboard.tsx` (DEFAULT_STATS + field refs only — charts added later)

> **Atomicity:** The type rename and all consuming field references must land in one commit. After editing the type, fix every reference before running `pnpm tsc`. TypeScript will tell you exactly what broke.

> **Scope note:** `src/types/index.ts` already has `HousingDocument` with the correct `capacity` field and `'available'` status — do **not** modify it. The `HousingRecord` interface that needs fixing is a local CF-only interface inside `functions/src/dispatchEngine.ts` (Task 3).

- [ ] **Replace `GlobalStatsDocument` in `src/types/index.ts`**

Find the existing interface (around line 200) and replace it entirely:

```ts
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

The `Timestamp` import is already at the top of the file (`import { Timestamp } from 'firebase/firestore'`).

- [ ] **Add `StatsSnapshotDocument` immediately after `GlobalStatsDocument`**

```ts
export interface StatsSnapshotDocument {
  date: string; // YYYY-MM-DD
  totalRegistered: number;
  totalAssigned: number;
  totalCompleted: number;
  totalPeopleHelped: number;
  totalPending: number;
  snapshotAt: Timestamp | Date;
}
```

- [ ] **Update `DEFAULT_STATS` and all field refs in `src/Screens/Public/Impact.tsx`**

Replace the `DEFAULT_STATS` constant:

```ts
const DEFAULT_STATS: GlobalStatsDocument = {
  totalRegistered: 0,
  totalAssigned: 0,
  totalCompleted: 0,
  totalPeopleHelped: 0,
  totalPending: 0,
  activeNGOs: 0,
  housingAvailable: 0,
  byGovernorate: {},
  byNeed: {},
};
```

Then update every reference to old field names in the component body:
- `stats.submissionsRegistered` → `stats.totalRegistered`
- `stats.submissionsAssigned` → `stats.totalAssigned`
- `stats.submissionsCompleted` → `stats.totalCompleted`
- `stats.peopleHelped` → `stats.totalPeopleHelped`
- `stats.activeNgoCount` → `stats.activeNGOs`

- [ ] **Update `DEFAULT_STATS` and all field refs in `src/Screens/Admin/ImpactDashboard.tsx`**

Same `DEFAULT_STATS` replacement as above. Same field name substitutions throughout the component.

> **Type-safe blind spot:** `exportCsv()` in `ImpactDashboard.tsx` uses old field names as **string literals** in CSV headers (e.g. `'submissionsRegistered'`, `'activeNgoCount'`). TypeScript will NOT catch these. They will be completely replaced in Task 8 when `exportCsv` is rewritten. If you commit here and someone runs a CSV export before Task 8 is done, the headers will be wrong — that is acceptable for this intermediate commit. Do not remove or rename `exportCsv` now; Task 8 replaces the whole function.

- [ ] **Verify TypeScript is clean**

```bash
pnpm tsc
```

Expected: 0 errors. If there are errors, they will point to remaining old field references — fix them before continuing.

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add src/types/index.ts src/Screens/Public/Impact.tsx src/Screens/Admin/ImpactDashboard.tsx
git commit -m "$(cat <<'EOF'
refactor: rename GlobalStatsDocument fields + add StatsSnapshotDocument

Renames: submissionsRegistered→totalRegistered, submissionsAssigned→totalAssigned,
submissionsCompleted→totalCompleted, peopleHelped→totalPeopleHelped,
activeNgoCount→activeNGOs, updatedAt→lastUpdatedAt.
Adds: totalPending, byGovernorate, byNeed, StatsSnapshotDocument.
Updates DEFAULT_STATS and field refs in both screens.
EOF
)"
```

---

### Task 3: Cloud Functions — infrastructure fixes (`dispatchEngine.ts`)

**Files:**
- Modify: `functions/src/dispatchEngine.ts`

This task covers: `HousingRecord` interface fix, `ensureGlobalStatsDocument`, `refreshHousingAvailability`, `rebuildGlobalStats`. The trigger functions (`onNewSubmission` etc.) come in Task 4.

- [ ] **Fix `HousingRecord` interface** (around line 60)

```ts
interface HousingRecord {
  capacity?: number; // was: availableSpots (migrated by backfillV2Data.ts)
  status?: 'pending_review' | 'available' | 'reserved' | 'filled'; // was: 'approved'
}
```

- [ ] **Update `ensureGlobalStatsDocument`** — replace the entire function body:

```ts
async function ensureGlobalStatsDocument() {
  await GLOBAL_STATS_DOC.set(
    {
      totalRegistered: 0,
      totalAssigned: 0,
      totalCompleted: 0,
      totalPeopleHelped: 0,
      totalPending: 0,
      activeNGOs: 0,
      housingAvailable: 0,
      byGovernorate: {},
      byNeed: {},
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}
```

- [ ] **Fix `refreshHousingAvailability`** — change both the query filter and the field read:

```ts
async function refreshHousingAvailability() {
  // status 'available' — 'approved' was migrated to 'available' by backfillV2Data.ts
  const housingSnapshot = await db.collection('housing').where('status', '==', 'available').get();
  const housingAvailable = housingSnapshot.docs.reduce(
    (total, document) => total + Number((document.data() as HousingRecord).capacity ?? 0),
    0,
  );

  await GLOBAL_STATS_DOC.set(
    {
      housingAvailable,
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}
```

- [ ] **Rewrite `rebuildGlobalStats` with pagination and new fields**

First verify `FieldPath` is imported at the top of `dispatchEngine.ts`. It comes from `firebase-admin/firestore`:

```ts
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
```

Replace the entire function with this paginated implementation:

```ts
const REBUILD_BATCH_SIZE = 200;

async function rebuildGlobalStats() {
  // ADMIN REBUILD TOOL: full collection scan is intentional here.
  // This function is scheduled nightly and invoked manually by admins only.
  // Client-facing queries must never do unbounded scans.

  // Accumulator
  let totalRegistered = 0;
  let totalPending = 0;
  let totalAssigned = 0;
  let totalCompleted = 0;
  let totalPeopleHelped = 0;
  const byGovernorate: Record<string, number> = {};
  const byNeed: Record<string, number> = {};

  // Paginated scan of submissions
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let hasMore = true;

  while (hasMore) {
    // Use documentId() not a data field — Firestore silently drops documents
    // that are missing the ordered field, which would corrupt the rebuild totals.
    let batchQuery = db
      .collection('submissions')
      .orderBy(FieldPath.documentId())
      .limit(REBUILD_BATCH_SIZE);

    if (lastDoc) {
      batchQuery = batchQuery.startAfter(lastDoc);
    }

    const batchSnapshot = await batchQuery.get();
    hasMore = batchSnapshot.size === REBUILD_BATCH_SIZE;

    if (batchSnapshot.empty) break;
    lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];

    for (const doc of batchSnapshot.docs) {
      const submission = doc.data() as SubmissionRecord;
      totalRegistered++;

      const status = submission.status ?? 'pending';
      if (status === 'pending') totalPending++;
      else if (status === 'assigned' || status === 'in_progress') totalAssigned++;
      else if (status === 'completed') {
        totalCompleted++;
        totalPeopleHelped += Number(submission.numberOfPeopleInHousehold ?? 0);
      }

      const gov = submission.currentGovernorate;
      if (gov) byGovernorate[gov] = (byGovernorate[gov] ?? 0) + 1;

      for (const need of submission.needs ?? []) {
        byNeed[need] = (byNeed[need] ?? 0) + 1;
      }
    }
  }

  // Members: activeNGOs
  const memberSnapshot = await db
    .collection('members')
    .where('role', '==', 'member')
    .where('validated', '==', true)
    .get();
  const activeNGOs = memberSnapshot.docs.filter(
    (doc) => Number((doc.data() as MemberRecord).currentCaseLoad ?? 0) > 0,
  ).length;

  // Housing: status 'available' — 'approved' was migrated by backfillV2Data.ts
  const housingSnapshot = await db.collection('housing').where('status', '==', 'available').get();
  const housingAvailable = housingSnapshot.docs.reduce(
    (total, doc) => total + Number((doc.data() as HousingRecord).capacity ?? 0),
    0,
  );

  await GLOBAL_STATS_DOC.set(
    {
      totalRegistered,
      totalPending,
      totalAssigned,
      totalCompleted,
      totalPeopleHelped,
      activeNGOs,
      housingAvailable,
      byGovernorate,
      byNeed,
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}
```

- [ ] **Verify TypeScript is clean**

```bash
pnpm check
```

Expected: 0 errors. Fix any remaining old field name references in functions (e.g., `activeNgoCount`, `submissionsRegistered`, `peopleHelped`).

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add functions/src/dispatchEngine.ts
git commit -m "$(cat <<'EOF'
fix: update CF infrastructure — field renames + housing status/field bugs

- HousingRecord: capacity replaces availableSpots; status 'available' replaces 'approved'
- ensureGlobalStatsDocument: all new field names
- refreshHousingAvailability: fix status filter + field read
- rebuildGlobalStats: rewritten with cursor pagination, computes byGovernorate/byNeed/totalPending
EOF
)"
```

---

### Task 4: Cloud Functions — trigger functions (`dispatchEngine.ts`)

**Files:**
- Modify: `functions/src/dispatchEngine.ts`

- [ ] **Update `onNewSubmission` stats write** (inside the trigger, after `ensureGlobalStatsDocument()` call)

Replace the existing `GLOBAL_STATS_DOC.set()` call with:

```ts
const needs = submission.needs ?? [];
await GLOBAL_STATS_DOC.set(
  {
    totalRegistered: FieldValue.increment(1),
    totalPending: FieldValue.increment(1),
    [`byGovernorate.${governorate}`]: FieldValue.increment(1),
    ...needs.reduce<Record<string, FieldValue>>((acc, need) => ({
      ...acc,
      [`byNeed.${need}`]: FieldValue.increment(1),
    }), {}),
    lastUpdatedAt: new Date(),
  },
  { merge: true },
);
```

Note: `governorate` is already defined earlier in the function as `submission.currentGovernorate ?? 'Unknown'`.

- [ ] **Update `onCaseAssigned` stats write**

Replace the existing `GLOBAL_STATS_DOC.set()` call with:

```ts
const beforeStatus = before.status ?? 'pending';
const isEverFirstAssignment = !previousAssignedTo; // only increment on first assignment

await GLOBAL_STATS_DOC.set(
  {
    ...(isEverFirstAssignment ? { totalAssigned: FieldValue.increment(1) } : {}),
    ...(isEverFirstAssignment && beforeStatus === 'pending'
      ? { totalPending: FieldValue.increment(-1) }
      : {}),
    lastUpdatedAt: new Date(),
  },
  { merge: true },
);
```

Note: `previousAssignedTo` is already defined earlier in the function as `before.assignedTo ?? ''`.

- [ ] **Update `onCaseCompleted` stats write**

After `ensureGlobalStatsDocument()`, replace the two `GLOBAL_STATS_DOC.set()` calls (for completed and non-completed paths) with:

> **Variable names:** In the existing `onCaseCompleted` function, `before` = `change.before.data() as SubmissionRecord`, `after` = `change.after.data() as SubmissionRecord`, and `nextStatus` = `after.status`. These are already defined at the top of the function. Do not redeclare them.

```ts
const beforeStatus = before.status ?? 'pending';
const wasPending = beforeStatus === 'pending';
const wasAssigned = beforeStatus === 'assigned' || beforeStatus === 'in_progress';

if (nextStatus === 'completed') {
  await GLOBAL_STATS_DOC.set(
    {
      totalCompleted: FieldValue.increment(1),
      totalPeopleHelped: FieldValue.increment(Number(after.numberOfPeopleInHousehold ?? 0)),
      ...(wasAssigned ? { totalAssigned: FieldValue.increment(-1) } : {}),
      ...(wasPending ? { totalPending: FieldValue.increment(-1) } : {}),
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
} else {
  // cancelled — only update timestamp
  await GLOBAL_STATS_DOC.set({ lastUpdatedAt: new Date() }, { merge: true });
}
```

- [ ] **Update `refreshActiveNgoCount`** — rename the field in the final set call:

```ts
await GLOBAL_STATS_DOC.set(
  {
    activeNGOs: activeNgoCount,  // was: activeNgoCount: activeNgoCount
    lastUpdatedAt: new Date(),
  },
  { merge: true },
);
```

- [ ] **Verify TypeScript is clean**

```bash
pnpm check
```

Expected: 0 errors.

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add functions/src/dispatchEngine.ts
git commit -m "$(cat <<'EOF'
feat: update trigger functions — byGovernorate/byNeed/totalPending maintenance

onNewSubmission: increment totalPending + byGovernorate + byNeed per submission
onCaseAssigned: guard totalPending/totalAssigned on first-assignment + pending status
onCaseCompleted: guard totalAssigned/totalPending on prior status; handle direct pending→completed
EOF
)"
```

---

### Task 5: Cloud Functions — `dailyStatsSnapshot`

**Files:**
- Modify: `functions/src/dispatchEngine.ts`
- Modify: `functions/src/index.ts`

- [ ] **Add `dailyStatsSnapshot` at the bottom of `dispatchEngine.ts`**

```ts
export const dailyStatsSnapshot = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'UTC',
    region: 'europe-west1',
  },
  async () => {
    // GLOBAL_STATS_DOC = db.collection('stats').doc('global')
    // 'global' is a permanent system constant — never reassigned.
    const globalSnap = await GLOBAL_STATS_DOC.get();
    if (!globalSnap.exists) {
      logger.warn('dailyStatsSnapshot: /stats/global does not exist — skipping');
      return;
    }
    const data = globalSnap.data()!;
    // set() not create() — idempotent on Cloud Scheduler retry
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
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

- [ ] **Export from `functions/src/index.ts`**

Add to the `dispatchEngine` export line:

```ts
export {
  dailyStaleCaseCheck,
  dailyStatsSnapshot,      // ← add this
  nightlyGlobalStatsRebuild,
  onCaseAssigned,
  onCaseCompleted,
  onHousingStatsChanged,
  onMemberStatsChanged,
  onNewSubmission,
} from './dispatchEngine';
```

- [ ] **Verify TypeScript is clean**

```bash
pnpm check
```

Expected: 0 errors.

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add functions/src/dispatchEngine.ts functions/src/index.ts
git commit -m "$(cat <<'EOF'
feat: add dailyStatsSnapshot scheduled Cloud Function

Writes /stats/global to /stats/global/snapshots/YYYY-MM-DD at 00:00 UTC daily.
Uses set() for idempotency on retry. Logs date only (no PII).
EOF
)"
```

---

## Chunk 2: Frontend

### Task 6: Install recharts + `useCountUp` hook

**Files:**
- Create: `src/hooks/useCountUp.ts`
- Create: `src/__tests__/hooks/useCountUp.test.ts`

- [ ] **Install recharts**

```bash
pnpm add recharts
```

- [ ] **Write the failing test first**

Create `src/__tests__/hooks/useCountUp.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { useCountUp } from '@/hooks/useCountUp';

// Minimal rAF stub
let rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let rafId = 0;

beforeEach(() => {
  rafCallbacks = new Map();
  rafId = 0;
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = ++rafId;
    rafCallbacks.set(id, cb);
    return id;
  };
  global.cancelAnimationFrame = (id: number) => {
    rafCallbacks.delete(id);
  };
});

function flush(timestamp = 1000) {
  const cbs = [...rafCallbacks.values()];
  rafCallbacks.clear();
  for (const cb of cbs) cb(timestamp);
}

describe('useCountUp', () => {
  it('starts at the initial target value', () => {
    const { result } = renderHook(() => useCountUp(42));
    expect(result.current).toBe(42);
  });

  it('returns target immediately when duration is 0', () => {
    const { result } = renderHook(() => useCountUp(100, 0));
    act(() => flush());
    expect(result.current).toBe(100);
  });

  it('animates toward target over multiple frames', () => {
    const { result } = renderHook(() => useCountUp(100, 800));
    // First frame: startTime = null → sets start, schedules next frame
    act(() => flush(0));
    // Mid animation (400ms elapsed = 50% progress)
    act(() => flush(400));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it('reaches target after full duration', () => {
    const { result } = renderHook(() => useCountUp(100, 800));
    act(() => flush(0));
    act(() => flush(800)); // full duration elapsed
    expect(result.current).toBe(100);
  });

  it('restarts from current displayed value on target change', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target, 800),
      { initialProps: { target: 100 } },
    );
    // Advance animation to ~50
    act(() => flush(0));
    act(() => flush(400)); // ~50% through
    const mid = result.current;
    expect(mid).toBeGreaterThan(0);

    // Change target — should restart from mid, not 0
    rerender({ target: 200 });
    act(() => flush(0)); // re-triggers effect, new start = mid
    const afterReset = result.current;
    expect(afterReset).toBe(mid); // first frame after target change: still at mid
  });
});
```

- [ ] **Run to confirm the test fails (file doesn't exist yet)**

```bash
pnpm test:app -- --testPathPattern=useCountUp
```

Expected: FAIL — "Cannot find module '@/hooks/useCountUp'"

- [ ] **Implement `src/hooks/useCountUp.ts`**

```ts
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const startValueRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Restart from wherever we currently are displayed
    startValueRef.current = displayRef.current;
    startTimeRef.current = null;

    const animate = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;

      const elapsed = now - startTimeRef.current;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(startValueRef.current + (target - startValueRef.current) * eased);

      displayRef.current = value;
      setDisplay(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
```

- [ ] **Run tests to confirm they pass**

```bash
pnpm test:app -- --testPathPattern=useCountUp
```

Expected: PASS — all 5 tests green.

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add src/hooks/useCountUp.ts src/__tests__/hooks/useCountUp.test.ts package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: add useCountUp hook + recharts dependency

useCountUp animates from current displayed value to target over duration ms.
Restarts from current value (not zero) when target changes mid-animation.
EOF
)"
```

---

### Task 7: Public `Impact.tsx` — charts + final field updates

**Files:**
- Modify: `src/Screens/Public/Impact.tsx`

- [ ] **Add imports at the top of the file**

```tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCountUp } from '@/hooks/useCountUp';
```

Also add the `onSnapshotError` handler — update the `useEffect`:

```tsx
useEffect(() => {
  return onSnapshot(
    doc(db, 'stats', 'global'),
    (snapshot) => {
      if (!snapshot.exists()) {
        setStats(DEFAULT_STATS);
        return;
      }
      setStats({ ...DEFAULT_STATS, ...(snapshot.data() as GlobalStatsDocument) });
    },
    () => {
      toast.error(t('common.error'));
    },
  );
}, [t]);
```

Add `import { toast } from 'sonner';` if not already imported.

- [ ] **Wrap the four large hero numbers in `useCountUp`**

In the `impactCards` array, change `value: stats.totalRegistered` etc. to `value: useCountUp(stats.totalRegistered)`. Because hooks cannot be called inside array literals (Rules of Hooks), instead derive animated values at the top of the component before the return:

```tsx
const animatedRegistered = useCountUp(stats.totalRegistered);
const animatedCompleted = useCountUp(stats.totalCompleted);
const animatedPeopleHelped = useCountUp(stats.totalPeopleHelped);
const animatedActiveNGOs = useCountUp(stats.activeNGOs);
```

Then use these in `impactCards` instead of the raw stats values. Update `toLocaleString()` calls: `value.toLocaleString(i18n.language)` (requires `const { t, i18n } = useTranslation()`).

- [ ] **Add Needs Breakdown chart section**

Below the existing pipeline + snapshot section, add:

```tsx
{/* Needs Breakdown */}
{Object.keys(stats.byNeed).length > 0 ? (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-2xl font-semibold text-gray-900">
      {t('impact.public.needsBreakdown')}
    </h2>
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={Object.entries(stats.byNeed)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => ({
            name: t(`submission.needs.${key}`, { defaultValue: key }),
            value,
          }))}
        margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="value" fill="#12a89d" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </section>
) : (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-2 text-2xl font-semibold text-gray-900">
      {t('impact.public.needsBreakdown')}
    </h2>
    <p className="text-sm text-gray-400">{t('impact.public.noData')}</p>
  </section>
)}
```

- [ ] **Add Coverage by Area chart section**

```tsx
{Object.keys(stats.byGovernorate).length > 0 ? (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-2xl font-semibold text-gray-900">
      {t('impact.public.coverageByArea')}
    </h2>
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={Object.entries(stats.byGovernorate)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => ({
            name: key.length > 12 ? `${key.slice(0, 12)}…` : key,
            value,
          }))}
        margin={{ top: 0, right: 8, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#0e9088" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </section>
) : (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-2 text-2xl font-semibold text-gray-900">
      {t('impact.public.coverageByArea')}
    </h2>
    <p className="text-sm text-gray-400">{t('impact.public.noData')}</p>
  </section>
)}
```

- [ ] **Add Status Split pie chart section**

```tsx
{stats.totalPending + stats.totalAssigned + stats.totalCompleted > 0 ? (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-2xl font-semibold text-gray-900">
      {t('impact.public.statusSplit')}
    </h2>
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={[
            { name: t('impact.public.pending'), value: stats.totalPending, fill: '#94a3b8' },
            { name: t('impact.public.assigned'), value: stats.totalAssigned, fill: '#38bdf8' },
            { name: t('impact.public.completed'), value: stats.totalCompleted, fill: '#34d399' },
          ].filter((d) => d.value > 0)}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${Math.round((percent ?? 0) * 100)}%`
          }
        >
          {[
            { fill: '#94a3b8' },
            { fill: '#38bdf8' },
            { fill: '#34d399' },
          ].map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </section>
) : (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-2 text-2xl font-semibold text-gray-900">
      {t('impact.public.statusSplit')}
    </h2>
    <p className="text-sm text-gray-400">{t('impact.public.noData')}</p>
  </section>
)}
```

- [ ] **Verify TypeScript is clean**

```bash
pnpm tsc
```

Expected: 0 errors.

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add src/Screens/Public/Impact.tsx
git commit -m "$(cat <<'EOF'
feat: add recharts charts to public Impact page

Adds needs breakdown (horizontal BarChart), coverage by governorate (BarChart),
and status split (PieChart). useCountUp animates hero numbers. onSnapshot error
shows sonner toast. Empty-state messages for all-zero data.
EOF
)"
```

---

### Task 8: Admin `ImpactDashboard.tsx` — fix snapshot + charts + NGO table + CSV

**Files:**
- Modify: `src/Screens/Admin/ImpactDashboard.tsx`

- [ ] **Add new imports**

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
} from 'firebase/firestore';
import type { StatsSnapshotDocument, MemberDocument } from '@/types';
import { Skeleton } from '@/Components/ui/skeleton';
```

- [ ] **Fix the unbounded `onSnapshot` on submissions** (Option A: limit 500 workaround)

**This is a replacement, not an addition.** Find the existing unbounded listener `onSnapshot(query(collection(db, 'submissions'), where('status', '==', 'pending')), ...)` inside the `useEffect` and **remove it entirely**, then put this in its place (keeping it inside the same `useEffect` cleanup return):

```tsx
// ⚠️ CRISIS WORKAROUND: unbounded submissions scan replaced with limit(500).
// Replace with derived fields in /stats/global when time permits.
// See: docs/superpowers/specs/2026-03-12-phase-4-impact-dashboard-design.md
onSnapshot(
  query(collection(db, 'submissions'), where('status', '==', 'pending'), limit(500)),
  (snapshot) => {
    const rows = snapshot.docs.map((document) => document.data() as SubmissionDocument);
    setPendingUrgentCases(rows.filter((row) => row.aidUrgency === 'High').length);
    setStaleCases(rows.filter((row) => row.staleFlagged).length);
  },
),
```

The `useEffect` cleanup function must include this new listener's unsubscribe just like the old one did — do not leave both running.

- [ ] **Add state for snapshots and NGOs**

```tsx
const [snapshots, setSnapshots] = useState<StatsSnapshotDocument[]>([]);
const [ngos, setNgos] = useState<(MemberDocument & { id: string })[]>([]);
const [ngosLoading, setNgosLoading] = useState(true);
```

- [ ] **Fetch snapshots and NGOs in `useEffect`**

Add after the existing `onSnapshot` calls in the single `useEffect`:

```tsx
// Time-series snapshots (one-time fetch, 90-day window)
getDocs(
  query(
    collection(db, 'stats', 'global', 'snapshots'),
    orderBy('date'),
    limit(90),
  ),
).then((snap) => {
  setSnapshots(snap.docs.map((d) => d.data() as StatsSnapshotDocument));
}).catch(() => {
  toast.error(t('common.error'));
});

// NGO breakdown (one-time fetch)
getDocs(
  query(
    collection(db, 'members'),
    where('role', '==', 'member'),
    where('validated', '==', true),
    orderBy('name'),
    limit(50),
  ),
).then((snap) => {
  setNgos(
    snap.docs.map((d) => ({ id: d.id, ...(d.data() as MemberDocument) })),
  );
}).catch(() => {
  toast.error(t('common.error'));
}).finally(() => {
  setNgosLoading(false);
});
```

- [ ] **Update `exportCsv` to use snapshot data**

Replace the existing `exportCsv` function:

```tsx
const exportCsv = () => {
  const today = new Date().toISOString().slice(0, 10);
  let rows: (string | number)[][];

  if (snapshots.length > 0) {
    rows = [
      ['date', 'totalRegistered', 'totalCompleted', 'totalPeopleHelped', 'totalPending', 'totalAssigned'],
      ...snapshots.map((s) => [
        s.date,
        s.totalRegistered,
        s.totalCompleted,
        s.totalPeopleHelped,
        s.totalPending,
        s.totalAssigned,
      ]),
    ];
  } else {
    // Fallback: single-row current stats
    rows = [
      ['date', 'totalRegistered', 'totalCompleted', 'totalPeopleHelped', 'totalPending', 'totalAssigned'],
      [
        today,
        stats.totalRegistered,
        stats.totalCompleted,
        stats.totalPeopleHelped,
        stats.totalPending,
        stats.totalAssigned,
      ],
    ];
  }

  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nasna_impact_export_${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Add time-series line chart section** (after existing pipeline health card)

```tsx
<Card>
  <CardHeader>
    <CardTitle>{t('impact.admin.timeSeries')}</CardTitle>
  </CardHeader>
  <CardContent>
    {snapshots.length === 0 ? (
      <p className="text-sm text-muted-foreground">{t('impact.admin.noSnapshotData')}</p>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={snapshots.map((s) => ({
            date: s.date.slice(5), // MM-DD
            totalRegistered: s.totalRegistered,
            totalCompleted: s.totalCompleted,
          }))}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalRegistered"
            stroke="#64748b"
            dot={false}
            name={t('impact.admin.registeredCases')}
          />
          <Line
            type="monotone"
            dataKey="totalCompleted"
            stroke="#10b981"
            dot={false}
            name={t('impact.admin.completedCases')}
          />
        </LineChart>
      </ResponsiveContainer>
    )}
  </CardContent>
</Card>
```

- [ ] **Add NGO breakdown table section**

```tsx
<Card>
  <CardHeader>
    <CardTitle>{t('impact.admin.ngoBreakdown')}</CardTitle>
  </CardHeader>
  <CardContent>
    {ngosLoading ? (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    ) : ngos.length === 0 ? (
      <p className="text-sm text-muted-foreground">{t('impact.public.noData')}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pe-4 font-medium">{t('impact.admin.ngoName')}</th>
              <th className="pb-2 pe-4 font-medium">{t('impact.admin.governoratesCovered')}</th>
              <th className="pb-2 pe-4 font-medium">{t('impact.admin.currentCaseLoad')}</th>
              <th className="pb-2 font-medium">{t('impact.admin.aidTypes')}</th>
            </tr>
          </thead>
          <tbody>
            {ngos.map((ngo) => (
              <tr key={ngo.id} className="border-b last:border-0">
                <td className="py-2 pe-4 font-medium">{ngo.name}</td>
                <td className="py-2 pe-4 text-muted-foreground">
                  {(ngo.coverageGovernorates ?? []).join(', ') || '—'}
                </td>
                <td className="py-2 pe-4">{ngo.currentCaseLoad ?? 0}</td>
                <td className="py-2 text-muted-foreground">
                  {(ngo.aidTypes ?? []).join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>
```

- [ ] **Verify TypeScript is clean**

```bash
pnpm tsc
```

Expected: 0 errors.

- [ ] **Run Prettier**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add src/Screens/Admin/ImpactDashboard.tsx
git commit -m "$(cat <<'EOF'
feat: admin ImpactDashboard — time-series chart, NGO table, improved CSV

Fixes unbounded submissions onSnapshot (limit 500 workaround).
Adds: LineChart from snapshots; NGO breakdown table with skeleton loading;
CSV export now uses snapshot rows when available, falls back to current stats.
EOF
)"
```

---

## Chunk 3: i18n + Firestore + Verification

### Task 9: i18n — new keys in all three locale files

**Files:**
- Modify: `src/locales/ar/impact.json`
- Modify: `src/locales/en/impact.json`
- Modify: `src/locales/fr/impact.json`

> **Pre-existing keys — do not re-add:** The following keys already exist in all three locale files and are NOT new: `impact.public.assigned`, `impact.public.completed` (used in the status split pie), `impact.admin.registeredCases`, `impact.admin.completedCases` (used in the time-series chart). Only add the keys listed below.

- [ ] **Add keys to `src/locales/ar/impact.json`** (Arabic is primary — these are required)

Under `"public"`:
```json
"needsBreakdown": "توزيع الاحتياجات",
"coverageByArea": "التغطية حسب المنطقة",
"statusSplit": "توزيع الحالات",
"pending": "معلّقة",
"noData": "لا توجد بيانات بعد"
```

Under `"admin"`:
```json
"timeSeries": "التطور عبر الزمن",
"noSnapshotData": "لا توجد بيانات تاريخية بعد — تظهر أول لقطة بعد منتصف الليل بالتوقيت العالمي",
"ngoBreakdown": "تفاصيل المنظمات",
"ngoName": "اسم المنظمة",
"governoratesCovered": "المحافظات المغطاة",
"currentCaseLoad": "الحالات الحالية",
"aidTypes": "أنواع المساعدات"
```

- [ ] **Add keys to `src/locales/en/impact.json`**

Under `"public"`:
```json
"needsBreakdown": "Needs breakdown",
"coverageByArea": "Coverage by area",
"statusSplit": "Case status split",
"pending": "Pending",
"noData": "No data yet"
```

Under `"admin"`:
```json
"timeSeries": "Trends over time",
"noSnapshotData": "No historical data yet — first snapshot appears after midnight UTC",
"ngoBreakdown": "NGO breakdown",
"ngoName": "NGO name",
"governoratesCovered": "Governorates covered",
"currentCaseLoad": "Current caseload",
"aidTypes": "Aid types"
```

- [ ] **Add keys to `src/locales/fr/impact.json`**

Under `"public"`:
```json
"needsBreakdown": "Répartition des besoins",
"coverageByArea": "Couverture par région",
"statusSplit": "Répartition des statuts",
"pending": "En attente",
"noData": "Aucune donnée disponible"
```

Under `"admin"`:
```json
"timeSeries": "Évolution dans le temps",
"noSnapshotData": "Aucune donnée historique — le premier instantané apparaît après minuit UTC",
"ngoBreakdown": "Détail des ONG",
"ngoName": "Nom de l'ONG",
"governoratesCovered": "Gouvernorats couverts",
"currentCaseLoad": "Charge de cas actuelle",
"aidTypes": "Types d'aide"
```

- [ ] **Run format to ensure JSON is correctly formatted**

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add src/locales/
git commit -m "$(cat <<'EOF'
i18n: add chart section keys to impact.json in ar/en/fr

New keys: needsBreakdown, coverageByArea, statusSplit, pending, noData (public);
timeSeries, noSnapshotData, ngoBreakdown, ngoName, governoratesCovered,
currentCaseLoad, aidTypes (admin). submission.needs.* keys unchanged.
EOF
)"
```

---

### Task 10: Firestore rules + composite index

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Add snapshot subcollection rule to `firestore.rules`**

Place this as a new top-level `match` block **inside** `match /databases/{database}/documents { ... }`, at the same indentation level as `match /stats/{statsId}` — **not nested inside it**:

```
// ─── /stats/global/snapshots ────────────────────────────────────────────────
// Public read — all users including unauthenticated may read snapshot history.
// Writes are Cloud Functions only via Admin SDK (bypasses these rules).

match /stats/global/snapshots/{date} {
  allow read: if true;
  allow write: if false;
}
```

Correct placement (show context):

```
    match /stats/{statsId} {
      allow read: if statsId == 'global';
      allow write: if isAdmin();
    }

    // ─── /stats/global/snapshots ────────────────────────────────────────────
    match /stats/global/snapshots/{date} {
      allow read: if true;
      allow write: if false;
    }
```

- [ ] **Add composite index to `firestore.indexes.json`**

Add to the `"indexes"` array:

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

- [ ] **Run Prettier** (`firestore.indexes.json` is JSON and will be formatted)

```bash
pnpm format
```

- [ ] **Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "$(cat <<'EOF'
feat: Firestore rules and index for Phase 4

Add /stats/global/snapshots/{date} read-all rule (top-level match, not nested).
Add composite index: members(role ASC, validated ASC, name ASC) for NGO table query.
EOF
)"
```

---

### Task 11: Final verification

- [ ] **Run Prettier formatter**

```bash
pnpm format
```

Expected: all files reformatted, exit 0. If any files are reported, the format ran and fixed them — that is fine. If it exits non-zero, investigate.

- [ ] **Stage any format changes and commit**

```bash
git add -A
git diff --staged --name-only
# Should only show formatting changes if any
git commit -m "style: pnpm format" --allow-empty
```

- [ ] **Run full type check**

```bash
pnpm check
```

Expected: 0 errors from both frontend TypeScript and functions build.

- [ ] **Run the test suite**

```bash
pnpm test:app
```

Expected: useCountUp tests pass. No regressions.

- [ ] **Manual smoke test checklist**

Work through this list in the browser (local `pnpm start` or Firebase Emulator):

- [ ] Navigate to `/impact` — page loads, 6 stat cards show (zeros are OK if no data yet)
- [ ] If there is data: needs breakdown horizontal bars render; governorate bars render; status pie renders
- [ ] Navigate to `/manage/impact` as admin — page loads, all existing queue cards show
- [ ] Time-series chart section shows either "No snapshot data yet" message or a line chart
- [ ] NGO breakdown table shows skeleton briefly then either a table or "No data yet"
- [ ] CSV export button downloads a file — verify it has the correct headers
- [ ] Verify `/impact` loads without auth — unauthenticated access must work

- [ ] **Final commit (if needed after smoke test fixes)**

```bash
pnpm format
git add -A
git commit -m "fix: smoke test corrections"
```

- [ ] **Deployment sequence reminder**

When merging and deploying:
1. Deploy Cloud Functions first (`pnpm functions:deploy`)
2. Immediately trigger `nightlyGlobalStatsRebuild` via Firebase Console → Cloud Functions → trigger manually — this writes the new field names to `/stats/global`
3. Then deploy the frontend (`pnpm deploy`)

---

## Spec Cross-Reference

All spec completion checklist items are covered:

| Spec item | Task |
|---|---|
| Housing status/field bugs fixed | Task 3 |
| `ensureGlobalStatsDocument` updated | Task 3 |
| `GlobalStatsDocument` renamed + new fields | Task 2 |
| `StatsSnapshotDocument` added | Task 2 |
| `rebuildGlobalStats` paginated + all fields | Task 3 |
| `onNewSubmission` needs??[] + byGovernorate/byNeed/totalPending | Task 4 |
| `onCaseAssigned` guards | Task 4 |
| `onCaseCompleted` guards | Task 4 |
| `dailyStatsSnapshot` + exported | Task 5 |
| `recharts` installed | Task 6 |
| `useCountUp` hook + test | Task 6 |
| Both screens: empty-state + sonner error | Tasks 7, 8 |
| `Impact.tsx` 3 chart sections | Task 7 |
| `ImpactDashboard.tsx` time-series + NGO table + CSV | Task 8 |
| Unbounded onSnapshot fixed (limit 500) | Task 8 |
| i18n in ar/en/fr | Task 9 |
| Firestore snapshot rule (top-level) | Task 10 |
| Composite index | Task 10 |
| `pnpm format` exits 0 | Task 11 |
| `pnpm tsc` exits 0 | Tasks 2, 3, 4, 5, 7, 8 |
| No PII in logs | Tasks 4, 5 |
| No unbounded client queries | Task 8 |
