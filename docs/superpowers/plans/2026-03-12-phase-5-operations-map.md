# Phase 5 — Operations Map Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 5 — fix the CenterDocument data model (`isActive` → `active`, new public fields), upgrade CenterManagement form, enrich the public CentersMap for mobile-first use, and wire the admin OperationsMap to use the corrected field name.

**Architecture:** All changes flow from a single data-model rename (`isActive` → `active` in CenterDocument) and the addition of four optional public fields. The service layer (operationsMap.ts) is updated to expose stored coordinates and new fields. The admin map query is fixed to match the corrected field name. The public CentersMap is upgraded with a mobile bottom-sheet, rich popups, and compact stat pills.

**Tech Stack:** React 19 + TypeScript, Firestore, react-leaflet 1.9, Tailwind CSS v4, i18next (ar/en/fr), Zod, shadcn/ui

---

## Current state (branch `feat/phase-5-operations-map`)

Already done on this branch:
- `firestore.rules`: `isActive` → `active` for centers read rule; housing `approved` status allowed ✓
- `src/services/operationsMap.ts`: `limit()` added to both getDocs calls ✓
- `src/Screens/Admin/OperationsMap.tsx`: Full admin map fully implemented — all 4 layers, filter panel, clustering, PII-safe popups, capped banner ✓
- `src/Routes/AdminRoutes.tsx`: Routes `/manage/operations-map` and `/admin/map` both exist ✓
- `src/Layout/Admin/Sidebar.tsx`: "Operations Map" nav item pointing to `/admin/map` ✓

Remaining work in this plan: Tasks 1–8 below.

---

## Chunk 1: Data model + Service layer

### Task 1: Update CenterDocument type — `isActive` → `active` + new public fields

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Edit CenterDocument in src/types/index.ts**

Replace the `isActive` field with `active` and add four optional public fields below `facilities`:

```typescript
// in CenterDocument interface — replace isActive line:
active: boolean;

// add after facilities:
// public contact number — NOT PII, safe to display to all users
phone?: string;
// e.g. ['food', 'medical', 'clothing']
aidServices?: string[];
// e.g. "Mon–Fri 8:00–17:00"
operatingHours?: string;
// true = accepting new arrivals, false = full/closed
intakeOpen?: boolean;
```

Full replacement block (lines 106–126 of current file):

```typescript
export interface CenterDocument {
  id?: string;
  name: string;
  type: CenterType;
  governorate: string;
  district?: string;
  address?: string;
  // stored as plain object (not Firestore GeoPoint) for Leaflet compatibility
  coordinates?: { lat: number; lng: number };
  totalCapacity: number;
  currentOccupancy: number;
  facilities?: CenterFacility[];
  // public contact number — NOT PII, safe to show to all users
  phone?: string;
  // e.g. ['food', 'medical', 'clothing']
  aidServices?: string[];
  // e.g. "Mon–Fri 8:00–17:00"
  operatingHours?: string;
  // true = accepting new arrivals; false = full/closed
  intakeOpen?: boolean;
  // PII: admin only. Never expose to members, agents, or public.
  managerName?: string;
  // PII: admin only. Never expose to members, agents, or public.
  managerPhone?: string;
  active: boolean;
  createdBy: string;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}
```

- [ ] **Step 2: Verify TypeScript errors surface (expected)**

```bash
pnpm tsc 2>&1 | grep "isActive" | head -20
```

Expected: TypeScript will report errors on any remaining `isActive` references — this confirms the rename propagated. Errors in CenterManagement.tsx and OperationsMap.tsx are expected and will be fixed in Tasks 2 and 4.

---

### Task 2: Update CenterManagement form — `isActive` → `active` + new form fields

**Files:**
- Modify: `src/Screens/Admin/CenterManagement.tsx`

**Overview of changes:**
1. Zod schema: rename `isActive` → `active`, add `lat?`, `lng?`, `phone?`, `aidServices?`, `operatingHours?`, `intakeOpen?`
2. `DEFAULT_FORM`: update field names, add defaults for new fields
3. `openEdit`: populate new fields from center data
4. `toggleFacility` pattern → add `toggleAidService` helper
5. `handleSave`: extract `lat`/`lng` and write as `coordinates: { lat, lng }` when both are present
6. JSX: fix all `isActive` references to `active`; add form inputs for new fields
7. Add `AID_SERVICES` constant

- [ ] **Step 3: Add AID_SERVICES constant after FACILITIES**

```typescript
const AID_SERVICES = [
  'food', 'water', 'medical', 'clothing', 'shelter', 'legal', 'psychosocial',
] as const;

type AidService = (typeof AID_SERVICES)[number];
```

- [ ] **Step 4: Replace the Zod schema**

Replace the existing `centerSchema` (lines 67–82):

```typescript
const centerSchema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(['school', 'university', 'community_hall', 'sports_facility', 'other']),
  governorate: z.string().trim().min(2),
  district: z.string().trim().optional(),
  address: z.string().trim().optional(),
  totalCapacity: z.number().int().min(1),
  currentOccupancy: z.number().int().min(0),
  managerName: z.string().trim().optional(),
  // PII: admin only — validated here but never exposed outside admin dialog.
  managerPhone: z.string().trim().optional(),
  facilities: z
    .array(z.enum(['generator', 'water', 'kitchen', 'medical_room', 'bathrooms', 'internet']))
    .optional(),
  active: z.boolean(),
  // coordinate inputs — stored as coordinates: { lat, lng } in Firestore
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().trim().optional(),
  aidServices: z
    .array(z.enum(['food', 'water', 'medical', 'clothing', 'shelter', 'legal', 'psychosocial']))
    .optional(),
  operatingHours: z.string().trim().optional(),
  intakeOpen: z.boolean().optional(),
});
```

- [ ] **Step 5: Update DEFAULT_FORM**

```typescript
const DEFAULT_FORM: CenterFormData = {
  name: '',
  type: 'school',
  governorate: '',
  district: '',
  address: '',
  totalCapacity: 1,
  currentOccupancy: 0,
  managerName: '',
  managerPhone: '',
  facilities: [],
  active: true,
  lat: undefined,
  lng: undefined,
  phone: '',
  aidServices: [],
  operatingHours: '',
  intakeOpen: true,
};
```

- [ ] **Step 6: Update openEdit to populate new fields**

Replace the `setFormState` call inside `openEdit` (lines 146–160):

```typescript
setFormState({
  name: center.name,
  type: center.type,
  governorate: center.governorate,
  district: center.district ?? '',
  address: center.address ?? '',
  totalCapacity: center.totalCapacity,
  currentOccupancy: center.currentOccupancy,
  managerName: center.managerName ?? '',
  // PII: admin only — shown in dialog
  managerPhone: center.managerPhone ?? '',
  facilities: center.facilities ?? [],
  active: center.active,
  lat: center.coordinates?.lat,
  lng: center.coordinates?.lng,
  phone: center.phone ?? '',
  aidServices: center.aidServices ?? [],
  operatingHours: center.operatingHours ?? '',
  intakeOpen: center.intakeOpen ?? true,
});
```

- [ ] **Step 7: Add toggleAidService helper** (after the existing `toggleFacility` function)

```typescript
const toggleAidService = (service: AidService) => {
  setFormState((prev) => {
    const current = prev.aidServices ?? [];
    return {
      ...prev,
      aidServices: current.includes(service)
        ? current.filter((s) => s !== service)
        : [...current, service],
    };
  });
};
```

- [ ] **Step 8: Update handleSave to write coordinates correctly**

Replace the Firestore write block inside `handleSave` (the if/else for editingCenter):

```typescript
setSaving(true);
try {
  const { lat, lng, ...coreData } = result.data;
  const coordinatesField =
    lat !== undefined && lng !== undefined ? { coordinates: { lat, lng } } : {};

  if (editingCenter?.id) {
    await updateDoc(doc(db, 'centers', editingCenter.id), {
      ...coreData,
      ...coordinatesField,
      updatedAt: serverTimestamp(),
    });
    toast.success(t('admin.centers.successUpdated'));
  } else {
    await addDoc(collection(db, 'centers'), {
      ...coreData,
      ...coordinatesField,
      createdBy: auth.currentUser?.uid ?? '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    toast.success(t('admin.centers.successAdded'));
  }
  setIsDialogOpen(false);
} catch (error) {
  console.error('Failed to save center:', error);
  toast.error(t('admin.centers.errorSave'));
} finally {
  setSaving(false);
}
```

- [ ] **Step 9: Fix isActive → active in JSX table cells and CapacityBar usage**

In the TableRow mapping (lines 263–296), replace:
- `center.isActive` → `center.active` (3 occurrences: CapacityBar prop, status badge classname, status badge text)

```tsx
<CapacityBar
  totalCapacity={center.totalCapacity}
  currentOccupancy={center.currentOccupancy}
  isActive={center.active}   {/* ← was isActive={center.isActive} */}
/>
```

```tsx
<span
  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
    center.active               {/* ← was center.isActive */}
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-gray-100 text-gray-700'
  }`}
>
  {center.active ? t('admin.centers.active') : t('admin.centers.inactive')}   {/* ← was center.isActive */}
</span>
```

- [ ] **Step 10: Fix isActive → active in the dialog checkbox**

Replace the active checkbox block (lines 424–435):

```tsx
<div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
  <Checkbox
    id="center-active"
    checked={formState.active}
    onCheckedChange={(checked) =>
      setFormState((p) => ({ ...p, active: Boolean(checked) }))
    }
  />
  <Label htmlFor="center-active" className="cursor-pointer">
    {t('admin.centers.activeCheckbox')}
  </Label>
</div>
```

- [ ] **Step 11: Add new form inputs to the dialog**

Add these sections to the dialog `<div className="space-y-4">`, after the existing manager phone inputs and before the facilities block.

**Coordinates section** (add after managerPhone div, before facilities section):

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <div className="space-y-2">
    <Label>{t('admin.centers.latitude')}</Label>
    <Input
      type="number"
      step="any"
      placeholder="33.8938"
      value={formState.lat ?? ''}
      onChange={(e) =>
        setFormState((p) => ({
          ...p,
          lat: e.target.value ? Number(e.target.value) : undefined,
        }))
      }
    />
  </div>
  <div className="space-y-2">
    <Label>{t('admin.centers.longitude')}</Label>
    <Input
      type="number"
      step="any"
      placeholder="35.5018"
      value={formState.lng ?? ''}
      onChange={(e) =>
        setFormState((p) => ({
          ...p,
          lng: e.target.value ? Number(e.target.value) : undefined,
        }))
      }
    />
  </div>
</div>
<p className="text-xs text-gray-400 -mt-2">{t('admin.centers.coordinatesHint')}</p>
```

**Public info section** (add after coordinates, before facilities):

```tsx
<div className="space-y-2">
  <Label>{t('admin.centers.publicPhone')}</Label>
  <Input
    value={formState.phone ?? ''}
    placeholder="+961 1 234 567"
    onChange={(e) => setFormState((p) => ({ ...p, phone: e.target.value }))}
  />
</div>

<div className="space-y-2">
  <Label>{t('admin.centers.operatingHours')}</Label>
  <Input
    value={formState.operatingHours ?? ''}
    placeholder="Mon–Fri 8:00–17:00"
    onChange={(e) => setFormState((p) => ({ ...p, operatingHours: e.target.value }))}
  />
</div>

<div className="space-y-2">
  <Label>{t('admin.centers.aidServices')}</Label>
  <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3">
    {AID_SERVICES.map((service) => (
      <label key={service} className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={(formState.aidServices ?? []).includes(service)}
          onCheckedChange={() => toggleAidService(service)}
        />
        {t(`admin.centers.aidService_${service}`)}
      </label>
    ))}
  </div>
</div>

<div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
  <Checkbox
    id="center-intake"
    checked={formState.intakeOpen ?? true}
    onCheckedChange={(checked) =>
      setFormState((p) => ({ ...p, intakeOpen: Boolean(checked) }))
    }
  />
  <Label htmlFor="center-intake" className="cursor-pointer">
    {t('admin.centers.intakeOpen')}
  </Label>
</div>
```

- [ ] **Step 12: Run tsc to check for remaining isActive errors**

```bash
pnpm tsc 2>&1 | grep -E "isActive|error TS" | head -30
```

Expected: No `isActive` errors. Fix any remaining ones.

- [ ] **Step 13: Run format**

```bash
pnpm format
```

- [ ] **Step 14: Commit Task 2**

```bash
git add src/types/index.ts src/Screens/Admin/CenterManagement.tsx
git commit -m "feat: rename isActive → active in CenterDocument + new public fields form"
```

---

### Task 3: Update operationsMap service — stored coordinates + new fields

**Files:**
- Modify: `src/services/operationsMap.ts`

- [ ] **Step 15: Update CenterMarker interface to include new public fields**

Replace the existing `CenterMarker` interface (lines 43–53):

```typescript
export interface CenterMarker {
  id: string;
  name: string;
  governorate: string;
  city: string;
  address: string;
  capacity: number;
  occupiedCapacity: number;
  lat: number;
  lng: number;
  // new public fields — NOT PII
  phone?: string;
  aidServices?: string[];
  operatingHours?: string;
  intakeOpen?: boolean;
}
```

- [ ] **Step 16: Update the centers mapping in getPublicCentersMapData**

Replace the `centers` mapping block (lines 91–103):

```typescript
const centers: CenterMarker[] = centersSnap.docs.map((doc) => {
  const d = doc.data();
  const storedCoords = d.coordinates as { lat: number; lng: number } | undefined;
  const fallback = getCoordinates(d.governorate as string | undefined);
  return {
    id: doc.id,
    name: (d.name as string) ?? 'Center',
    governorate: (d.governorate as string) ?? '',
    city: (d.city as string) ?? '',
    address: (d.address as string) ?? '',
    capacity: Number(d.totalCapacity ?? d.capacity ?? 0),
    occupiedCapacity: Number(d.currentOccupancy ?? d.occupiedCapacity ?? 0),
    lat: storedCoords?.lat ?? fallback.lat,
    lng: storedCoords?.lng ?? fallback.lng,
    phone: (d.phone as string | undefined) ?? undefined,
    aidServices: (d.aidServices as string[] | undefined) ?? [],
    operatingHours: (d.operatingHours as string | undefined) ?? undefined,
    intakeOpen: (d.intakeOpen as boolean | undefined) ?? undefined,
  };
});
```

Note: `d.totalCapacity ?? d.capacity` preserves backwards compat with documents that used the old field name.

- [ ] **Step 17: Run tsc**

```bash
pnpm tsc 2>&1 | grep "operationsMap\|CenterMarker" | head -20
```

Expected: No errors in operationsMap.ts or related files.

- [ ] **Step 18: Run format and commit**

```bash
pnpm format
git add src/services/operationsMap.ts
git commit -m "feat: CenterMarker exposes stored coords and new public fields"
```

---

## Chunk 2: Admin map fix + Public map mobile improvements

### Task 4: Fix OperationsMap centers query + enrich center popup

**Files:**
- Modify: `src/Screens/Admin/OperationsMap.tsx`

- [ ] **Step 19: Fix the center Firestore query**

On line 486, change:
```typescript
const centerQuery = query(collection(db, 'centers'), where('isActive', '==', true), limit(100));
```
To:
```typescript
const centerQuery = query(collection(db, 'centers'), where('active', '==', true), limit(200));
```

- [ ] **Step 20: Enrich the center popup in the map JSX**

Find the center popup block (around lines 734–762) and replace the popup content:

```tsx
<Popup>
  <div className="space-y-2 text-sm">
    <p className="font-semibold">{center.name}</p>
    <p>
      <span className="font-semibold">{t('admin.map.popup.center.type')}</span>{' '}
      {center.type}
    </p>
    <p>
      <span className="font-semibold">{t('admin.map.popup.center.occupancy')}</span>{' '}
      {center.currentOccupancy}/{center.totalCapacity}
    </p>
    {center.intakeOpen !== undefined ? (
      <p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            center.intakeOpen
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {center.intakeOpen
            ? t('admin.map.popup.center.intakeOpen')
            : t('admin.map.popup.center.intakeClosed')}
        </span>
      </p>
    ) : null}
    {center.phone ? (
      <p>
        <span className="font-semibold">{t('admin.map.popup.center.phone')}</span>{' '}
        {center.phone}
      </p>
    ) : null}
    {center.operatingHours ? (
      <p>
        <span className="font-semibold">{t('admin.map.popup.center.hours')}</span>{' '}
        {center.operatingHours}
      </p>
    ) : null}
    <div className="flex flex-wrap gap-1">
      {(center.facilities ?? []).length > 0 ? (
        center.facilities?.map((facility) => (
          <span
            key={`${center.id}-${facility}`}
            className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
          >
            {t(`admin.map.facilities.${facility}`)}
          </span>
        ))
      ) : (
        <span className="text-xs text-slate-500">{t('admin.map.popup.none')}</span>
      )}
    </div>
  </div>
</Popup>
```

- [ ] **Step 21: Run tsc + format + commit**

```bash
pnpm tsc 2>&1 | grep "OperationsMap\|error TS" | head -20
pnpm format
git add src/Screens/Admin/OperationsMap.tsx
git commit -m "fix: centers query uses active field + enrich center popup with new fields"
```

---

### Task 5: Public CentersMap — mobile-first improvements

**Files:**
- Modify: `src/Screens/Public/CentersMap.tsx`

**Overview of changes:**
1. Add `bottomSheetOpen` state
2. Stat cards: mobile horizontal scroll pills (< sm) + desktop grid (sm+)
3. Layout: map is primary focus, layer panel is sidebar on lg+, bottom sheet on mobile
4. Map height: `h-[calc(100vh-4rem)]` on mobile, `h-[580px]` on desktop
5. Displacement popup: Get Directions link + tappable `tel:` phone number
6. Center popup: phone (tel:), aidServices badges, operatingHours, intakeOpen badge, occupancy progress bar (all conditional)

- [ ] **Step 22: Add bottomSheetOpen state**

After the existing `useState` declarations, add:

```typescript
const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
```

- [ ] **Step 23: Replace the stat cards block**

Replace the `<div className="grid gap-4 sm:grid-cols-3">` block (lines 90–117):

```tsx
{/* Stat cards — compact horizontal pill row on mobile, grid on desktop */}
<div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
  {[
    { label: t('centersMap.totalCenters'), value: centers.length, color: 'text-[#12a89d]' },
    { label: t('centersMap.displacementSitesCount'), value: displacementSites.length, color: 'text-orange-500' },
    { label: t('centersMap.housingListings'), value: housingAreas.reduce((sum, h) => sum + h.availableSpots, 0), color: 'text-purple-600' },
  ].map((stat) => (
    <div
      key={stat.label}
      className="flex-none rounded-full border border-gray-200 bg-white px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
    >
      <span className={`font-bold text-base ${stat.color}`}>{stat.value}</span>
      <span className="text-gray-600 whitespace-nowrap">{stat.label}</span>
    </div>
  ))}
</div>
<div className="hidden sm:grid gap-4 sm:grid-cols-3">
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">{t('centersMap.totalCenters')}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-[#12a89d]">{centers.length}</p>
    </CardContent>
  </Card>
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">{t('centersMap.displacementSitesCount')}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-orange-500">{displacementSites.length}</p>
    </CardContent>
  </Card>
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">{t('centersMap.housingListings')}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-purple-600">
        {housingAreas.reduce((sum, h) => sum + h.availableSpots, 0)}
      </p>
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 24: Replace the main layout grid (map + layer panel)**

Replace the `<div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">` block (lines 119–249):

```tsx
<div className="lg:grid lg:gap-6 lg:grid-cols-[0.8fr_1.2fr]">
  {/* Desktop sidebar — hidden on mobile */}
  <Card className="hidden lg:block">
    <CardHeader>
      <CardTitle>{t('centersMap.layers')}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {[
        {
          id: 'centers',
          label: t('centersMap.aidCenters'),
          checked: showCenters,
          set: setShowCenters,
          color: 'text-[#12a89d]',
          dot: 'bg-[#12a89d]',
        },
        {
          id: 'displacementSites',
          label: t('centersMap.displacementSites'),
          checked: showDisplacementSites,
          set: setShowDisplacementSites,
          color: 'text-orange-500',
          dot: 'bg-orange-400',
        },
        {
          id: 'housing',
          label: t('centersMap.housingAreas'),
          checked: showHousing,
          set: setShowHousing,
          color: 'text-purple-600',
          dot: 'bg-purple-400',
        },
      ].map((layer) => (
        <div key={layer.id} className="flex items-center gap-3">
          <Checkbox
            checked={layer.checked}
            onCheckedChange={(checked) => layer.set(Boolean(checked))}
          />
          <span className={`inline-block h-3 w-3 rounded-full ${layer.dot} shrink-0`} />
          <Label className={layer.color}>{layer.label}</Label>
        </div>
      ))}

      <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 mt-2">
        <p className="font-medium text-gray-800">{t('centersMap.legendTitle')}</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>{t('centersMap.legendCenters')}</li>
          <li>{t('centersMap.legendDisplacement')}</li>
          <li>{t('centersMap.legendHousing')}</li>
        </ul>
      </div>
    </CardContent>
  </Card>

  {/* Map container */}
  <div className="relative">
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="h-[calc(100vh-4rem)] lg:h-[580px]">
          <MapContainer
            center={[33.8547, 35.8623]}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* === CENTER MARKERS === */}
            {showCenters &&
              centers.map((center) => {
                const pct = center.capacity > 0 ? center.occupiedCapacity / center.capacity : 0;
                const intakeOpen =
                  center.intakeOpen !== undefined
                    ? center.intakeOpen
                    : center.occupiedCapacity < center.capacity;
                const barColor = pct > 0.9 ? '#ef4444' : pct >= 0.75 ? '#facc15' : '#4ade80';

                return (
                  <Marker
                    key={`center-${center.id}`}
                    position={[center.lat, center.lng]}
                    icon={centerIcon}
                  >
                    <Popup>
                      <div className="space-y-1.5 text-sm min-w-[180px]">
                        <p className="font-semibold">{center.name}</p>
                        <p>
                          {center.city && `${center.city}, `}{center.governorate}
                        </p>
                        {center.address && (
                          <p className="text-muted-foreground">{center.address}</p>
                        )}
                        {/* Occupancy progress bar */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {t('centersMap.capacity')} {center.occupiedCapacity}/{center.capacity}
                          </p>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, pct * 100)}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                        {/* Intake badge */}
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            intakeOpen
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {intakeOpen
                            ? t('centersMap.intakeOpen')
                            : t('centersMap.intakeClosed')}
                        </span>
                        {/* Phone */}
                        {center.phone && (
                          <p>
                            {t('centersMap.phone')}{' '}
                            <a
                              href={`tel:${center.phone}`}
                              className="text-[#12a89d] underline"
                            >
                              {center.phone}
                            </a>
                          </p>
                        )}
                        {/* Aid services badges */}
                        {(center.aidServices ?? []).length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              {t('centersMap.aidServices')}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {center.aidServices!.map((service) => (
                                <span
                                  key={service}
                                  className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Operating hours */}
                        {center.operatingHours && (
                          <p className="text-xs text-gray-600">
                            {t('centersMap.operatingHours')} {center.operatingHours}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* === DISPLACEMENT SITES === */}
            {showDisplacementSites &&
              displacementSites.map((site, index) => (
                <CircleMarker
                  key={`site-${index}`}
                  center={[site.latitude, site.longitude]}
                  radius={7}
                  pathOptions={{ color: '#ea580c', fillColor: '#fb923c', fillOpacity: 0.8 }}
                >
                  <Popup>
                    <div className="space-y-1.5 text-sm min-w-[180px]">
                      <p className="font-semibold">{site.place_name_arabic}</p>
                      <p className="text-muted-foreground">{site.place_name_english}</p>
                      <p>
                        {t('centersMap.contact')} {site.contact_person}
                      </p>
                      <p>
                        {t('centersMap.phone')}{' '}
                        <a
                          href={`tel:${site.phone_number}`}
                          className="text-[#12a89d] underline"
                        >
                          {site.phone_number}
                        </a>
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block rounded-md bg-[#12a89d] px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-[#0e9088]"
                      >
                        {t('centersMap.getDirections')}
                      </a>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {/* === HOUSING AREAS === */}
            {showHousing &&
              housingAreas.map((area) => (
                <CircleMarker
                  key={`housing-${area.area}`}
                  center={[area.lat, area.lng]}
                  radius={Math.max(6, Math.min(18, area.listingCount * 2))}
                  pathOptions={{ color: '#7c3aed', fillColor: '#c4b5fd', fillOpacity: 0.55 }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">{area.area}</p>
                      <p>
                        {t('centersMap.availableSpots')} {area.availableSpots}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>

    {/* Mobile bottom sheet — layer controls */}
    <div className="lg:hidden">
      {/* Toggle button fixed at bottom of viewport */}
      <button
        type="button"
        onClick={() => setBottomSheetOpen((prev) => !prev)}
        className="fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-lg"
      >
        {t('centersMap.layers')} {bottomSheetOpen ? '▼' : '▲'}
      </button>

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[999] rounded-t-2xl border-t border-gray-200 bg-white shadow-xl transition-transform duration-300 ${
          bottomSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-1 h-1 w-12 rounded-full bg-gray-300" />
        <div className="px-6 pb-8 pt-2 space-y-4">
          <p className="font-semibold text-gray-900">{t('centersMap.layers')}</p>
          {[
            {
              id: 'centers',
              label: t('centersMap.aidCenters'),
              checked: showCenters,
              set: setShowCenters,
              dot: 'bg-[#12a89d]',
            },
            {
              id: 'displacementSites',
              label: t('centersMap.displacementSites'),
              checked: showDisplacementSites,
              set: setShowDisplacementSites,
              dot: 'bg-orange-400',
            },
            {
              id: 'housing',
              label: t('centersMap.housingAreas'),
              checked: showHousing,
              set: setShowHousing,
              dot: 'bg-purple-400',
            },
          ].map((layer) => (
            <div key={layer.id} className="flex items-center gap-3">
              <Checkbox
                checked={layer.checked}
                onCheckedChange={(checked) => layer.set(Boolean(checked))}
              />
              <span className={`inline-block h-3 w-3 rounded-full ${layer.dot} shrink-0`} />
              <Label>{layer.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 25: Run tsc + format**

```bash
pnpm tsc 2>&1 | grep "CentersMap\|error TS" | head -30
pnpm format
```

Fix any type errors (most likely missing CenterMarker fields).

- [ ] **Step 26: Commit Task 5**

```bash
git add src/Screens/Public/CentersMap.tsx
git commit -m "feat: CentersMap mobile-first layout, rich popups, Get Directions, bottom sheet"
```

---

## Chunk 3: i18n + Final verification

### Task 6: centersMap i18n — new keys in all three locales

**Files:**
- Modify: `src/locales/ar/centersMap.json`
- Modify: `src/locales/en/centersMap.json`
- Modify: `src/locales/fr/centersMap.json`

New keys needed: `getDirections`, `intakeOpen`, `intakeClosed`, `aidServices`, `operatingHours`

Note: `phone` and `layers` already exist in all three files.

- [ ] **Step 27: Add to src/locales/ar/centersMap.json**

Add before the closing `}`:

```json
  "getDirections": "احصل على الاتجاهات",
  "intakeOpen": "يستقبل الوافدين",
  "intakeClosed": "ممتلئ / مغلق",
  "aidServices": "الخدمات المقدّمة:",
  "operatingHours": "ساعات العمل:"
```

- [ ] **Step 28: Add to src/locales/en/centersMap.json**

```json
  "getDirections": "Get Directions",
  "intakeOpen": "Open — accepting arrivals",
  "intakeClosed": "Full / Closed",
  "aidServices": "Aid services:",
  "operatingHours": "Hours:"
```

- [ ] **Step 29: Add to src/locales/fr/centersMap.json**

```json
  "getDirections": "Obtenir l'itinéraire",
  "intakeOpen": "Ouvert — accueille des arrivées",
  "intakeClosed": "Complet / Fermé",
  "aidServices": "Services d'aide :",
  "operatingHours": "Horaires :"
```

- [ ] **Step 30: Run format + commit**

```bash
pnpm format
git add src/locales/ar/centersMap.json src/locales/en/centersMap.json src/locales/fr/centersMap.json
git commit -m "i18n: centersMap — getDirections, intakeOpen, intakeClosed, aidServices, operatingHours"
```

---

### Task 7: admin.json i18n — new center popup keys

**Files:**
- Modify: `src/locales/ar/admin.json`
- Modify: `src/locales/en/admin.json`
- Modify: `src/locales/fr/admin.json`

New keys needed in `admin.map.popup.center`:
- `intakeOpen`, `intakeClosed`, `phone`, `hours`

New keys needed in `admin.centers`:
- `latitude`, `longitude`, `coordinatesHint`, `publicPhone`, `operatingHours`, `aidServices`, `intakeOpen`
- `aidService_food`, `aidService_water`, `aidService_medical`, `aidService_clothing`, `aidService_shelter`, `aidService_legal`, `aidService_psychosocial`

- [ ] **Step 31: Add to src/locales/ar/admin.json**

In `admin.map.popup.center` object, add after `"occupancy"`:

```json
"intakeOpen": "مفتوح",
"intakeClosed": "ممتلئ / مغلق",
"phone": "الهاتف:",
"hours": "ساعات العمل:"
```

In `admin.centers` object, add new keys:

```json
"latitude": "خط العرض",
"longitude": "خط الطول",
"coordinatesHint": "ابحث عن الإحداثيات على maps.google.com",
"publicPhone": "رقم الهاتف العام",
"operatingHours": "ساعات العمل",
"aidServices": "الخدمات المقدّمة",
"intakeOpen": "يستقبل الوافدين حالياً",
"aidService_food": "غذاء",
"aidService_water": "مياه",
"aidService_medical": "رعاية طبية",
"aidService_clothing": "ملابس",
"aidService_shelter": "مأوى",
"aidService_legal": "دعم قانوني",
"aidService_psychosocial": "دعم نفسي-اجتماعي"
```

- [ ] **Step 32: Add to src/locales/en/admin.json**

In `admin.map.popup.center`:

```json
"intakeOpen": "Open",
"intakeClosed": "Full / Closed",
"phone": "Phone:",
"hours": "Hours:"
```

In `admin.centers`:

```json
"latitude": "Latitude",
"longitude": "Longitude",
"coordinatesHint": "Find coordinates at maps.google.com",
"publicPhone": "Public phone number",
"operatingHours": "Operating hours",
"aidServices": "Aid services",
"intakeOpen": "Currently accepting arrivals",
"aidService_food": "Food",
"aidService_water": "Water",
"aidService_medical": "Medical",
"aidService_clothing": "Clothing",
"aidService_shelter": "Shelter",
"aidService_legal": "Legal support",
"aidService_psychosocial": "Psychosocial support"
```

- [ ] **Step 33: Add to src/locales/fr/admin.json**

In `admin.map.popup.center`:

```json
"intakeOpen": "Ouvert",
"intakeClosed": "Complet / Fermé",
"phone": "Téléphone :",
"hours": "Horaires :"
```

In `admin.centers`:

```json
"latitude": "Latitude",
"longitude": "Longitude",
"coordinatesHint": "Trouvez les coordonnées sur maps.google.com",
"publicPhone": "Numéro de téléphone public",
"operatingHours": "Heures d'ouverture",
"aidServices": "Services d'aide",
"intakeOpen": "Accepte actuellement des arrivées",
"aidService_food": "Alimentation",
"aidService_water": "Eau",
"aidService_medical": "Médical",
"aidService_clothing": "Vêtements",
"aidService_shelter": "Hébergement",
"aidService_legal": "Soutien juridique",
"aidService_psychosocial": "Soutien psychosocial"
```

- [ ] **Step 34: Run format + commit**

```bash
pnpm format
git add src/locales/ar/admin.json src/locales/en/admin.json src/locales/fr/admin.json
git commit -m "i18n: admin — center popup intakeOpen/intakeClosed/phone/hours + form field labels"
```

---

### Task 8: Final verification

- [ ] **Step 35: Full type check**

```bash
pnpm tsc
```

Expected: Exit code 0. Fix any remaining errors before continuing.

- [ ] **Step 36: Format check**

```bash
pnpm format
```

Expected: All files reformatted (or already clean). Any changes must be staged before commit.

- [ ] **Step 37: Run check (tsc + functions build)**

```bash
pnpm check
```

Expected: Exit code 0.

- [ ] **Step 38: Verify completion checklist**

Walk through and confirm each item:

| Item | File(s) |
|------|---------|
| `active` field (not `isActive`) in CenterDocument | `src/types/index.ts` |
| New optional public fields on CenterDocument | `src/types/index.ts` |
| CenterManagement: `active` toggle works | `src/Screens/Admin/CenterManagement.tsx` |
| CenterManagement: lat/lng coordinate inputs | `src/Screens/Admin/CenterManagement.tsx` |
| CenterManagement: phone/aidServices/hours/intakeOpen inputs | `src/Screens/Admin/CenterManagement.tsx` |
| getPublicCentersMapData: stored coords used, fallback to centroid | `src/services/operationsMap.ts` |
| CenterMarker: new public fields typed and mapped | `src/services/operationsMap.ts` |
| Admin map: centers query uses `where('active', '==', true)` | `src/Screens/Admin/OperationsMap.tsx` |
| Admin map: center popup shows intakeOpen/phone/hours (conditional) | `src/Screens/Admin/OperationsMap.tsx` |
| No PII in any admin map popup | `src/Screens/Admin/OperationsMap.tsx` |
| Public map: map fills `h-[calc(100vh-4rem)]` on mobile | `src/Screens/Public/CentersMap.tsx` |
| Public map: stat cards horizontal scroll pills on mobile | `src/Screens/Public/CentersMap.tsx` |
| Public map: layer controls in bottom sheet on mobile | `src/Screens/Public/CentersMap.tsx` |
| Public map: Get Directions link in displacement popup | `src/Screens/Public/CentersMap.tsx` |
| Public map: tappable `tel:` phone in displacement popup | `src/Screens/Public/CentersMap.tsx` |
| Public map: center popup has progress bar + conditional fields | `src/Screens/Public/CentersMap.tsx` |
| i18n: centersMap new keys in ar/en/fr | `src/locales/*/centersMap.json` |
| i18n: admin center popup + form keys in ar/en/fr | `src/locales/*/admin.json` |
| Firestore rules: `active` field (already done on branch) | `firestore.rules` |
| Route `/manage/operations-map` + `/admin/map` (already done) | `src/Routes/AdminRoutes.tsx` |
| Nav link in admin sidebar (already done) | `src/Layout/Admin/Sidebar.tsx` |

- [ ] **Step 39: Final commit**

```bash
pnpm format
git add -p   # stage any remaining changes
git commit -m "chore: final format pass for phase-5"
```

---

## Scope notes

### What's already done on this branch
The following were complete before this plan and require no changes:
- `firestore.rules`: centers `active` field rule + housing `approved` status
- `src/services/operationsMap.ts`: `limit()` on getDocs
- `src/Screens/Admin/OperationsMap.tsx`: Full admin map (all 4 layers, filter panel, clustering, PII-safe popups)
- `src/Routes/AdminRoutes.tsx`: `/manage/operations-map` + `/admin/map` routes
- `src/Layout/Admin/Sidebar.tsx`: "Operations Map" nav link

### What's intentionally out of scope
- Firestore composite indexes for the new `aidServices` or `intakeOpen` fields — these are read from the map service via `where('active', '==', true)` only; no array-contains or multi-field filter queries are added
- Real-time submission updates — the spec says `getDocs` + Refresh button for submissions; `onSnapshot` is correct only for centers/housing
- Leaflet.markercluster library — spec explicitly bans this; the grid clustering in OperationsMap.tsx already satisfies the requirement
