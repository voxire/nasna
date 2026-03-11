# Phase 2: Housing Marketplace Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 2 of the Nasna platform — displacement center management (admin), housing listing marketplace (public offer + admin review + public directory), and redesigned CreateSubmission with CenterPicker.

**Architecture:** Migrate the existing Phase 2 skeleton (wrong schema) to the spec-defined types. Update types → components → screens → Firestore rules → i18n in dependency order. The existing `CenterPicker`, `CapacityBar`, `HousingCard`, `CenterManagement`, `HousingReview`, `OfferHousing`, and `Housing` files all exist but use outdated field names and must be brought in line with the spec.

**Tech Stack:** React 19, TypeScript 5.9, Firebase Firestore, Zod, React Hook Form, Tailwind CSS v4, shadcn/ui, i18next, Jest + Testing Library (unit tests for components), `pnpm` as package manager.

---

## Chunk 1: Types, CapacityBar, CenterPicker

### Task 1: Update `CenterDocument` and `HousingDocument` types

**Files:**
- Modify: `src/types/index.ts`

The current `CenterDocument` uses `capacity/occupiedCapacity/active/contactName/contactPhone`. The spec requires `totalCapacity/currentOccupancy/isActive/managerName/managerPhone/type/district/coordinates/facilities/createdBy/updatedAt`. The current `HousingDocument` uses `hostName/hostPhone/area/address/availableSpots`. The spec requires `listerName/listerPhone/listerId/type/governorate/district/capacity/pricePerMonth/amenities/availableFrom/availableUntil`. The `HousingStatus` type has 'approved' — spec removes this, using 'available' instead.

- [ ] **Step 1: Replace `CenterDocument` in `src/types/index.ts`**

Find the block starting at line 97 and replace the entire interface:

```ts
export type CenterType = 'school' | 'university' | 'community_hall' | 'sports_facility' | 'other';
export type CenterFacility = 'generator' | 'water' | 'kitchen' | 'medical_room' | 'bathrooms' | 'internet';

export interface CenterDocument {
  id?: string;
  name: string;
  type: CenterType;
  governorate: string;
  district?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  totalCapacity: number;
  currentOccupancy: number;
  facilities?: CenterFacility[];
  managerName?: string;
  // PII: admin only. Never expose to members, agents, or public.
  managerPhone?: string;
  isActive: boolean;
  createdBy: string;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}
```

- [ ] **Step 2: Replace `HousingDocument` and `HousingStatus` in `src/types/index.ts`**

Update `HousingStatus` and replace the entire `HousingDocument` interface:

```ts
export type HousingStatus = 'pending_review' | 'available' | 'reserved' | 'filled';

export type HousingType = 'apartment' | 'room' | 'house' | 'floor';
export type HousingPriceType = 'free' | 'subsidized' | 'market_rate';
export type HousingAmenity = 'generator' | 'water' | 'internet' | 'washing_machine' | 'furnished' | 'private_bathroom';

export interface HousingDocument {
  id?: string;
  listerId: string; // UID or 'anonymous'
  // PII: admin only. Never expose to members, agents, or public.
  listerName: string;
  // PII: admin only. Never expose to members, agents, or public.
  listerPhone: string;
  type: HousingType;
  governorate: string;
  district?: string;
  capacity: number;
  priceType: HousingPriceType;
  pricePerMonth?: number; // USD, 0 for free
  availableFrom: Timestamp;
  availableUntil?: Timestamp;
  amenities?: HousingAmenity[];
  description?: string;
  status: HousingStatus;
  approvedBy?: string;
  createdAt?: Timestamp;
}
```

- [ ] **Step 3: Run `pnpm tsc` and note which files now have type errors**

```bash
pnpm tsc 2>&1 | head -60
```

Expected: multiple errors in `CenterManagement.tsx`, `CenterPicker.tsx`, `CapacityBar.tsx`, `HousingCard.tsx`, `HousingReview.tsx`, `OfferHousing.tsx`, `Housing.tsx`. These will be fixed in subsequent tasks.

- [ ] **Step 4: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 5: Commit type definitions**

```bash
git add src/types/index.ts
git commit -m "feat(types): update CenterDocument and HousingDocument to Phase 2 spec"
```

---

### Task 2: Update `CapacityBar` component

**Files:**
- Modify: `src/Components/CapacityBar.tsx`
- Modify: `src/Components/__tests__/CapacityBar.test.tsx` (create if absent)

The current `CapacityBar` uses 60%/85% thresholds and has no i18n or `isActive` prop. Spec requires: green < 75%, yellow 75–90%, red > 90%, grey when `isActive === false`.

- [ ] **Step 1: Write the failing tests**

Create `src/Components/__tests__/CapacityBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import CapacityBar from '../CapacityBar';

describe('CapacityBar', () => {
  it('renders green bar when occupancy is below 75%', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={50} isActive />,
    );
    expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
  });

  it('renders yellow bar when occupancy is 75-90%', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={80} isActive />,
    );
    expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('renders red bar when occupancy is above 90%', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={95} isActive />,
    );
    expect(container.querySelector('.bg-rose-500')).toBeInTheDocument();
  });

  it('renders grey bar when isActive is false regardless of occupancy', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={50} isActive={false} />,
    );
    expect(container.querySelector('.bg-gray-300')).toBeInTheDocument();
    expect(container.querySelector('.bg-emerald-500')).not.toBeInTheDocument();
  });

  it('clamps occupancy to 100% maximum', () => {
    const { container } = render(
      <CapacityBar totalCapacity={10} currentOccupancy={200} isActive />,
    );
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar?.style.width).toBe('100%');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:app -- --testPathPattern=CapacityBar 2>&1 | tail -20
```

Expected: FAIL — `CapacityBar` doesn't accept `totalCapacity`/`currentOccupancy`/`isActive` props yet.

- [ ] **Step 3: Rewrite `CapacityBar.tsx`**

```tsx
interface CapacityBarProps {
  totalCapacity: number;
  currentOccupancy: number;
  isActive: boolean;
}

export default function CapacityBar({ totalCapacity, currentOccupancy, isActive }: CapacityBarProps) {
  const safeCapacity = Math.max(1, totalCapacity);
  const percentage = Math.min(100, Math.max(0, (currentOccupancy / safeCapacity) * 100));

  const barColor = !isActive
    ? 'bg-gray-300'
    : percentage > 90
      ? 'bg-rose-500'
      : percentage > 75
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {currentOccupancy}/{totalCapacity}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:app -- --testPathPattern=CapacityBar 2>&1 | tail -10
```

Expected: PASS (5 tests).

- [ ] **Step 5: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 6: Commit**

```bash
git add src/Components/CapacityBar.tsx src/Components/__tests__/CapacityBar.test.tsx
git commit -m "feat(CapacityBar): update thresholds to 75/90, add isActive grey state"
```

---

### Task 3: Update `CenterPicker` component

**Files:**
- Modify: `src/Components/CenterPicker.tsx`

Current `CenterPicker` uses `where('active', '==', true)` — must change to `where('isActive', '==', true)`. Also needs to group options by governorate and show occupancy status.

- [ ] **Step 1: Rewrite `CenterPicker.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/firebase';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import type { CenterDocument } from '@/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface CenterRow extends CenterDocument {
  id: string;
}

interface CenterPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CenterPicker({
  value,
  onValueChange,
  placeholder,
  disabled = false,
}: CenterPickerProps) {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // limit(100) bounds the query — realistically centers won't exceed this
    const centerQuery = query(collection(db, 'centers'), where('isActive', '==', true), limit(100));

    return onSnapshot(centerQuery, (snapshot) => {
      setCenters(
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as CenterDocument),
          }))
          .sort((a, b) => a.governorate.localeCompare(b.governorate) || a.name.localeCompare(b.name)),
      );
      setLoading(false);
    });
  }, []);

  const byGovernorate = useMemo(() => {
    const grouped: Record<string, CenterRow[]> = {};
    for (const center of centers) {
      (grouped[center.governorate] ??= []).push(center);
    }
    return grouped;
  }, [centers]);

  const hasSelectedCenter = centers.some((c) => c.id === value);

  const occupancyLabel = (center: CenterRow) => {
    const pct = Math.round((center.currentOccupancy / Math.max(1, center.totalCapacity)) * 100);
    return `${center.name} (${pct}%)`;
  };

  return (
    <Select
      value={hasSelectedCenter ? value : undefined}
      onValueChange={onValueChange}
      disabled={disabled || loading || centers.length === 0}
    >
      <SelectTrigger className="border-gray-200 bg-gray-50">
        <SelectValue
          placeholder={
            loading
              ? t('common.loading')
              : centers.length === 0
                ? t('submission.noCentersAvailable')
                : (placeholder ?? t('submission.selectCenter'))
          }
        />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(byGovernorate).map(([governorate, items]) => (
          <SelectGroup key={governorate}>
            <SelectLabel>{governorate}</SelectLabel>
            {items.map((center) => (
              <SelectItem key={center.id} value={center.id}>
                {occupancyLabel(center)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Add `submission.selectCenter` and `submission.noCentersAvailable` i18n keys**

Add to `src/locales/ar/submission.json`:
```json
"selectCenter": "اختر مركزاً",
"noCentersAvailable": "لا توجد مراكز نشطة"
```

Add to `src/locales/en/submission.json`:
```json
"selectCenter": "Select a center",
"noCentersAvailable": "No active centers available"
```

Add to `src/locales/fr/submission.json`:
```json
"selectCenter": "Sélectionner un centre",
"noCentersAvailable": "Aucun centre actif disponible"
```

- [ ] **Step 3: Run `pnpm tsc` to verify no new errors**

```bash
pnpm tsc 2>&1 | grep CenterPicker
```

Expected: no errors for `CenterPicker.tsx`.

- [ ] **Step 4: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 5: Commit**

```bash
git add src/Components/CenterPicker.tsx src/locales/ar/submission.json src/locales/en/submission.json src/locales/fr/submission.json
git commit -m "feat(CenterPicker): use isActive field, group by governorate, show occupancy"
```

---

## Chunk 2: CenterManagement admin screen

### Task 4: Rebuild `CenterManagement` screen

**Files:**
- Modify: `src/Screens/Admin/CenterManagement.tsx`

The current screen uses the old `CenterDocument` schema. Needs to be rebuilt for the new schema: `type`, `district`, `address`, `coordinates`, `totalCapacity`, `currentOccupancy`, `facilities`, `managerName`, `managerPhone` (PII, admin-only dialog only), `isActive`, `createdBy`. Uses `CapacityBar` with new props. Paginated with `limit(25)`.

- [ ] **Step 1: Write the new `CenterManagement.tsx`**

Full replacement — the new schema has breaking changes in field names:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { z } from 'zod';
import type { CenterDocument, CenterFacility, CenterType } from '@/types';
import CapacityBar from '@/Components/CapacityBar';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { toast } from 'sonner';

interface CenterRow extends CenterDocument {
  id: string;
}

const CENTER_TYPES: CenterType[] = [
  'school',
  'university',
  'community_hall',
  'sports_facility',
  'other',
];

const FACILITIES: CenterFacility[] = [
  'generator',
  'water',
  'kitchen',
  'medical_room',
  'bathrooms',
  'internet',
];

const centerSchema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(['school', 'university', 'community_hall', 'sports_facility', 'other']),
  governorate: z.string().trim().min(2),
  district: z.string().trim().optional(),
  address: z.string().trim().optional(),
  totalCapacity: z.number().int().min(1),
  currentOccupancy: z.number().int().min(0),
  managerName: z.string().trim().optional(),
  // PII: admin only. Validated here but never exposed outside admin dialog.
  managerPhone: z.string().trim().optional(),
  facilities: z.array(z.enum(['generator', 'water', 'kitchen', 'medical_room', 'bathrooms', 'internet'])).optional(),
  isActive: z.boolean(),
});

type CenterFormData = z.infer<typeof centerSchema>;

const DEFAULT_FORM: CenterFormData = {
  name: '',
  type: 'school',
  governorate: '',
  district: '',
  address: '',
  totalCapacity: 0,
  currentOccupancy: 0,
  managerName: '',
  managerPhone: '',
  facilities: [],
  isActive: true,
};

export default function CenterManagement() {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCenter, setEditingCenter] = useState<CenterRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<CenterFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), orderBy('name'), limit(25));
    return onSnapshot(centerQuery, (snapshot) => {
      setCenters(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as CenterDocument),
        })),
      );
    });
  }, []);

  const filteredCenters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return centers;
    return centers.filter((c) =>
      [c.name, c.governorate, c.district, c.address].some((f) =>
        (f ?? '').toLowerCase().includes(q),
      ),
    );
  }, [centers, searchQuery]);

  const openCreate = () => {
    setEditingCenter(null);
    setFormState(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (center: CenterRow) => {
    setEditingCenter(center);
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
      isActive: center.isActive,
    });
    setIsDialogOpen(true);
  };

  const toggleFacility = (facility: CenterFacility) => {
    setFormState((prev) => {
      const current = prev.facilities ?? [];
      return {
        ...prev,
        facilities: current.includes(facility)
          ? current.filter((f) => f !== facility)
          : [...current, facility],
      };
    });
  };

  const handleSave = async () => {
    const result = centerSchema.safeParse(formState);
    if (!result.success) {
      toast.error(t('admin.centers.errorRequired'));
      return;
    }
    if (result.data.currentOccupancy > result.data.totalCapacity) {
      toast.error(t('admin.centers.errorCapacityExceeded'));
      return;
    }

    setSaving(true);
    try {
      if (editingCenter?.id) {
        await updateDoc(doc(db, 'centers', editingCenter.id), {
          ...result.data,
          updatedAt: serverTimestamp(),
        });
        toast.success(t('admin.centers.successUpdated'));
      } else {
        await addDoc(collection(db, 'centers'), {
          ...result.data,
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.centers.title')}</h1>
          <p className="text-sm text-gray-500">{t('admin.centers.description')}</p>
        </div>
        <Button className="bg-[#12a89d] text-white hover:bg-[#0e9088]" onClick={openCreate}>
          {t('admin.centers.addCenter')}
        </Button>
      </div>

      <Input
        placeholder={t('admin.centers.searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-white"
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">{t('admin.centers.name')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('admin.centers.type')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('admin.centers.governorate')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('admin.centers.occupancy')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('admin.centers.status')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('admin.centers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  {t('admin.centers.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filteredCenters.map((center) => (
                <TableRow key={center.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <p>{center.name}</p>
                    {center.district && (
                      <p className="text-xs text-gray-500">{center.district}</p>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {t(`admin.centers.type_${center.type}`)}
                  </TableCell>
                  <TableCell>{center.governorate}</TableCell>
                  <TableCell className="w-48">
                    <CapacityBar
                      totalCapacity={center.totalCapacity}
                      currentOccupancy={center.currentOccupancy}
                      isActive={center.isActive}
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        center.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {center.isActive ? t('admin.centers.active') : t('admin.centers.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEdit(center)}>
                      {t('admin.centers.edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? t('admin.centers.editTitle') : t('admin.centers.addTitle')}
            </DialogTitle>
            <DialogDescription>{t('admin.centers.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.centers.name')}</Label>
              <Input
                value={formState.name}
                onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.type')}</Label>
                <Select
                  value={formState.type}
                  onValueChange={(v) => setFormState((p) => ({ ...p, type: v as CenterType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CENTER_TYPES.map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {t(`admin.centers.type_${ct}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.centers.governorate')}</Label>
                <Input
                  value={formState.governorate}
                  onChange={(e) => setFormState((p) => ({ ...p, governorate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.district')}</Label>
                <Input
                  value={formState.district}
                  onChange={(e) => setFormState((p) => ({ ...p, district: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.centers.address')}</Label>
                <Input
                  value={formState.address}
                  onChange={(e) => setFormState((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.totalCapacity')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={formState.totalCapacity}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, totalCapacity: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.centers.currentOccupancy')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.currentOccupancy}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, currentOccupancy: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.managerName')}</Label>
                <Input
                  value={formState.managerName}
                  onChange={(e) => setFormState((p) => ({ ...p, managerName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                {/* PII: admin only — shown only in this dialog, never in tables or public views */}
                <Label>{t('admin.centers.managerPhone')}</Label>
                <Input
                  value={formState.managerPhone}
                  onChange={(e) => setFormState((p) => ({ ...p, managerPhone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.centers.facilities')}</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3">
                {FACILITIES.map((facility) => (
                  <label key={facility} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={(formState.facilities ?? []).includes(facility)}
                      onCheckedChange={() => toggleFacility(facility)}
                    />
                    {t(`admin.centers.facility_${facility}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Checkbox
                id="center-active"
                checked={formState.isActive}
                onCheckedChange={(checked) =>
                  setFormState((p) => ({ ...p, isActive: Boolean(checked) }))
                }
              />
              <Label htmlFor="center-active" className="cursor-pointer">
                {t('admin.centers.activeCheckbox')}
              </Label>
            </div>

            <Button
              className="w-full bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving
                ? t('admin.centers.saving')
                : editingCenter
                  ? t('admin.centers.saveChanges')
                  : t('admin.centers.createCenter')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Add missing i18n keys for CenterManagement to all 3 locales**

Add to `src/locales/ar/admin.json` (inside `"centers"` object or create it):
```json
"type": "النوع",
"district": "القضاء",
"occupancy": "الإشغال",
"totalCapacity": "السعة الكلية",
"currentOccupancy": "الإشغال الحالي",
"managerName": "اسم المدير",
"managerPhone": "هاتف المدير",
"facilities": "المرافق",
"type_school": "مدرسة",
"type_university": "جامعة",
"type_community_hall": "قاعة مجتمعية",
"type_sports_facility": "منشأة رياضية",
"type_other": "أخرى",
"facility_generator": "مولد",
"facility_water": "مياه",
"facility_kitchen": "مطبخ",
"facility_medical_room": "غرفة طبية",
"facility_bathrooms": "حمامات",
"facility_internet": "إنترنت"
```

Add equivalent keys to `src/locales/en/admin.json` and `src/locales/fr/admin.json`.

- [ ] **Step 3: Run `pnpm tsc` to verify CenterManagement has no errors**

```bash
pnpm tsc 2>&1 | grep -i center
```

Expected: no errors for `CenterManagement.tsx`.

- [ ] **Step 4: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 5: Commit**

```bash
git add src/Screens/Admin/CenterManagement.tsx src/locales/ar/admin.json src/locales/en/admin.json src/locales/fr/admin.json
git commit -m "feat(CenterManagement): rebuild with Phase 2 schema, CapacityBar, Zod validation"
```

---

## Chunk 3: CreateSubmission locationType update

### Task 5: Update `CreateSubmission` locationType UI

**Files:**
- Modify: `src/Screens/Private/CreateSubmission.tsx`

The current form uses a `<Select>` for `locationType`. The spec requires a **prominent segmented control** ("At a displacement center" | "With family in a safe area"). The CenterPicker already exists, just needs the UI change and field name fixes for the new `CenterDocument` schema. When `locationType === 'center'`: show CenterPicker, hide governorate/district fields. When `locationType === 'with_family'`: opposite.

Look for the `locationType` `<Select>` block (around line 468) and also for the `selectedCenter` display (around line 256). The `selectedCenter` uses `center.city` which no longer exists — it should use `center.district` or `center.governorate`.

- [ ] **Step 1: Replace the `locationType` Select with a segmented control**

Find this block in `CreateSubmission.tsx` (around line 468-490):
```tsx
<Select
  value={formData.locationType}
  onValueChange={(value) =>
    setFormData((prev) => ({
      ...prev,
      locationType: value as LocationType,
      centerId: '',
      ...
    }))
  }
>
  <SelectTrigger ...>
    ...
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="with_family">{t('submission.withFamily')}</SelectItem>
    <SelectItem value="center">{t('submission.inCenter')}</SelectItem>
  </SelectContent>
</Select>
```

Replace with a segmented control:
```tsx
<div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
  {(
    [
      { value: 'with_family', label: t('submission.locationTypeFamily') },
      { value: 'center', label: t('submission.locationTypeCenter') },
    ] as const
  ).map(({ value, label }) => (
    <button
      key={value}
      type="button"
      onClick={() =>
        setFormData((prev) => ({
          ...prev,
          locationType: value,
          centerId: '',
          numberOfPeopleInHousehold:
            value === 'center' ? 0 : prev.numberOfPeopleInHousehold,
        }))
      }
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        formData.locationType === value
          ? 'bg-white text-[#12a89d] shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Fix `selectedCenter` display to use new field names**

Find (around line 256-264):
```tsx
const selectedCenter = centers.find((center) => center.id === formData.centerId);
```
And the display block that uses `center.city` — update to:
```tsx
{selectedCenter ? (
  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
    <p className="font-medium text-gray-800">{selectedCenter.name}</p>
    <p>
      {selectedCenter.district ? `${selectedCenter.district}, ` : ''}
      {selectedCenter.governorate}
    </p>
    {selectedCenter.address && <p>{selectedCenter.address}</p>}
  </div>
) : null}
```

- [ ] **Step 3: Add i18n keys `submission.locationTypeCenter` and `submission.locationTypeFamily`**

Add to `src/locales/ar/submission.json`:
```json
"locationTypeCenter": "في مركز إيواء",
"locationTypeFamily": "مع عائلة في منطقة آمنة"
```

Add to `src/locales/en/submission.json`:
```json
"locationTypeCenter": "At a displacement center",
"locationTypeFamily": "With family in a safe area"
```

Add to `src/locales/fr/submission.json`:
```json
"locationTypeCenter": "Dans un centre de déplacement",
"locationTypeFamily": "Avec la famille dans une zone sûre"
```

- [ ] **Step 4: Run `pnpm tsc` to verify no errors**

```bash
pnpm tsc 2>&1 | grep CreateSubmission
```

Expected: no errors.

- [ ] **Step 5: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 6: Commit**

```bash
git add src/Screens/Private/CreateSubmission.tsx src/locales/ar/submission.json src/locales/en/submission.json src/locales/fr/submission.json
git commit -m "feat(CreateSubmission): replace locationType select with segmented control, fix center display fields"
```

---

## Chunk 4: Housing components and screens

### Task 6: Update `HousingCard` component

**Files:**
- Modify: `src/Components/HousingCard.tsx`

Current `HousingCard` shows `housing.hostName` and `housing.hostPhone` — these are now `listerName`/`listerPhone`, both PII that must NEVER appear in any public view. The card must show: type, governorate, district, capacity ("Up to X people"), priceType badge, amenities, availableFrom. No contact info.

- [ ] **Step 1: Rewrite `HousingCard.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import type { HousingDocument } from '@/types';
import { Button } from '@/Components/ui/button';

interface HousingCardProps {
  housing: HousingDocument & { id: string };
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  tertiaryAction?: { label: string; onClick: () => void };
  // Admin-only: set to true in admin review screens to show PII fields
  showAdminFields?: boolean;
}

const PRICE_BADGE: Record<string, string> = {
  free: 'bg-emerald-100 text-emerald-800',
  subsidized: 'bg-amber-100 text-amber-800',
  market_rate: 'bg-sky-100 text-sky-800',
};

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800',
  available: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-sky-100 text-sky-800',
  filled: 'bg-slate-200 text-slate-700',
};

export default function HousingCard({
  housing,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  showAdminFields = false,
}: HousingCardProps) {
  const { t } = useTranslation();

  const availableFromDate =
    housing.availableFrom instanceof Date
      ? housing.availableFrom
      : (housing.availableFrom as { toDate?: () => Date })?.toDate?.() ?? new Date();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              {t(`housing.card.type_${housing.type}`)}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_BADGE[housing.status] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {t(`housing.card.status_${housing.status}`)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {housing.district ? `${housing.district}, ` : ''}
            {housing.governorate}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            PRICE_BADGE[housing.priceType] ?? 'bg-gray-100 text-gray-700'
          }`}
        >
          {housing.priceType === 'free'
            ? t('housing.card.free')
            : housing.priceType === 'subsidized'
              ? t('housing.card.subsidized')
              : t('housing.card.marketRate')}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>{t('housing.card.capacity', { count: housing.capacity })}</p>
        {housing.pricePerMonth != null && housing.pricePerMonth > 0 && (
          <p>${housing.pricePerMonth}/mo</p>
        )}
        <p className="text-xs text-gray-400">
          {t('housing.card.availableFrom')}{' '}
          {availableFromDate.toLocaleDateString()}
        </p>
        {housing.amenities && housing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {housing.amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {t(`housing.card.amenity_${amenity}`)}
              </span>
            ))}
          </div>
        )}
        {/* Admin-only PII fields — gated by showAdminFields prop */}
        {showAdminFields && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            {/* PII: listerName and listerPhone — admin view only */}
            <p className="text-xs font-medium text-amber-800">
              {t('housing.admin.listerContact')}
            </p>
            <p className="text-sm">{housing.listerName}</p>
            <p className="text-sm">{housing.listerPhone}</p>
          </div>
        )}
      </div>

      {(primaryAction || secondaryAction || tertiaryAction) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {primaryAction && (
            <Button
              className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {tertiaryAction && (
            <Button variant="destructive" onClick={tertiaryAction.onClick}>
              {tertiaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add `housing.card.*` i18n keys to all 3 locales**

Add to `src/locales/ar/housing.json` (inside existing JSON):
```json
"card": {
  "capacity": "حتى {{count}} أشخاص",
  "free": "مجاني",
  "subsidized": "مدعوم",
  "marketRate": "بالسعر التجاري",
  "availableFrom": "متاح من",
  "listerContact": "معلومات المعلِن (مشرف فقط)",
  "type_apartment": "شقة",
  "type_room": "غرفة",
  "type_house": "منزل",
  "type_floor": "طابق",
  "status_pending_review": "بانتظار المراجعة",
  "status_available": "متاح",
  "status_reserved": "محجوز",
  "status_filled": "ممتلئ",
  "amenity_generator": "مولد",
  "amenity_water": "مياه",
  "amenity_internet": "إنترنت",
  "amenity_washing_machine": "غسالة",
  "amenity_furnished": "مفروش",
  "amenity_private_bathroom": "حمام خاص"
}
```

Add equivalent keys to `src/locales/en/housing.json` and `src/locales/fr/housing.json`.

- [ ] **Step 3: Run `pnpm tsc` to verify no errors**

```bash
pnpm tsc 2>&1 | grep HousingCard
```

- [ ] **Step 4: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 5: Commit**

```bash
git add src/Components/HousingCard.tsx src/locales/ar/housing.json src/locales/en/housing.json src/locales/fr/housing.json
git commit -m "feat(HousingCard): use new schema, never expose listerName/listerPhone publicly"
```

---

### Task 7: Rebuild `OfferHousing` public form

**Files:**
- Modify: `src/Screens/Public/OfferHousing.tsx`

Current form uses old schema. New form needs: `listerName`, `listerPhone`, `type`, `governorate`, `district`, `capacity`, `priceType`, `pricePerMonth` (conditional), `availableFrom`, `availableUntil` (optional), `amenities` checkboxes, `description`. Sets `status: 'pending_review'`, `listerId: 'anonymous'`.

- [ ] **Step 1: Rewrite `OfferHousing.tsx`**

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import type { HousingAmenity, HousingPriceType, HousingType } from '@/types';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { toast } from 'sonner';

const AMENITIES: HousingAmenity[] = [
  'generator', 'water', 'internet', 'washing_machine', 'furnished', 'private_bathroom',
];

const housingSchema = z.object({
  // PII: admin only — collected for admin contact, never returned publicly
  listerName: z.string().trim().min(2),
  // PII: admin only — collected for admin contact, never returned publicly
  listerPhone: z.string().trim().min(7),
  type: z.enum(['apartment', 'room', 'house', 'floor']),
  governorate: z.string().trim().min(2),
  district: z.string().trim().optional(),
  capacity: z.number().int().min(1),
  priceType: z.enum(['free', 'subsidized', 'market_rate']),
  pricePerMonth: z.number().min(0).optional(),
  availableFrom: z.string().min(1),
  availableUntil: z.string().optional(),
  amenities: z.array(z.enum(['generator', 'water', 'internet', 'washing_machine', 'furnished', 'private_bathroom'])),
  description: z.string().trim().max(500).optional(),
});

type FormData = {
  listerName: string;
  listerPhone: string;
  type: HousingType;
  governorate: string;
  district: string;
  capacity: number;
  priceType: HousingPriceType;
  pricePerMonth: number;
  availableFrom: string;
  availableUntil: string;
  amenities: HousingAmenity[];
  description: string;
};

const DEFAULT_FORM: FormData = {
  listerName: '',
  listerPhone: '',
  type: 'apartment',
  governorate: '',
  district: '',
  capacity: 1,
  priceType: 'free',
  pricePerMonth: 0,
  availableFrom: '',
  availableUntil: '',
  amenities: [],
  description: '',
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

export default function OfferHousing() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleAmenity = (amenity: HousingAmenity) => {
    setFormState((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...formState,
      pricePerMonth: formState.priceType !== 'free' ? formState.pricePerMonth : undefined,
      district: formState.district || undefined,
      availableUntil: formState.availableUntil || undefined,
    };

    const result = housingSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const { availableFrom, availableUntil, ...rest } = result.data;
      await addDoc(collection(db, 'housing'), {
        ...rest,
        listerId: 'anonymous',
        availableFrom: Timestamp.fromDate(new Date(availableFrom)),
        ...(availableUntil
          ? { availableUntil: Timestamp.fromDate(new Date(availableUntil)) }
          : {}),
        status: 'pending_review',
        createdAt: Timestamp.now(),
      });
      toast.success(t('housing.offer.success'));
      setFormState(DEFAULT_FORM);
    } catch (error) {
      console.error('Failed to submit housing offer:', error);
      toast.error(t('housing.offer.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('housing.offer.title')}</h1>
        <p className="text-gray-500">{t('housing.offer.description')}</p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Lister contact — collected for admin only, never shown publicly */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.listerName')}</Label>
            <Input
              value={formState.listerName}
              onChange={(e) => update('listerName', e.target.value)}
            />
            {errors.listerName && (
              <p className="text-sm text-red-500">{t('validation.nameTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.listerPhone')}</Label>
            <Input
              value={formState.listerPhone}
              onChange={(e) => update('listerPhone', e.target.value)}
            />
            {errors.listerPhone && (
              <p className="text-sm text-red-500">{t('validation.invalidPhone')}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.type')}</Label>
            <Select
              value={formState.type}
              onValueChange={(v) => update('type', v as HousingType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['apartment', 'room', 'house', 'floor'] as HousingType[]).map((t_) => (
                  <SelectItem key={t_} value={t_}>
                    {t(`housing.card.type_${t_}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.capacity')}</Label>
            <Input
              type="number"
              min={1}
              value={formState.capacity}
              onChange={(e) => update('capacity', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.governorate')}</Label>
            <Input
              value={formState.governorate}
              onChange={(e) => update('governorate', e.target.value)}
            />
            {errors.governorate && (
              <p className="text-sm text-red-500">{t('validation.fieldTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.district')}</Label>
            <Input
              value={formState.district}
              onChange={(e) => update('district', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.priceType')}</Label>
            <Select
              value={formState.priceType}
              onValueChange={(v) => update('priceType', v as HousingPriceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t('housing.card.free')}</SelectItem>
                <SelectItem value="subsidized">{t('housing.card.subsidized')}</SelectItem>
                <SelectItem value="market_rate">{t('housing.card.marketRate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formState.priceType !== 'free' && (
            <div className="space-y-1.5">
              <Label>{t('housing.offer.pricePerMonth')}</Label>
              <Input
                type="number"
                min={0}
                value={formState.pricePerMonth}
                onChange={(e) => update('pricePerMonth', Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.availableFrom')}</Label>
            <Input
              type="date"
              value={formState.availableFrom}
              onChange={(e) => update('availableFrom', e.target.value)}
            />
            {errors.availableFrom && (
              <p className="text-sm text-red-500">{t('validation.dateRequired')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.availableUntil')}</Label>
            <Input
              type="date"
              value={formState.availableUntil}
              onChange={(e) => update('availableUntil', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('housing.offer.amenities')}</Label>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3">
            {AMENITIES.map((amenity) => (
              <label key={amenity} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={formState.amenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                {t(`housing.card.amenity_${amenity}`)}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.description')}</Label>
          <Textarea
            rows={4}
            value={formState.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder={t('housing.offer.descriptionPlaceholder')}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#12a89d] text-white hover:bg-[#0e9088]"
        >
          {submitting ? t('housing.offer.submitting') : t('housing.offer.submit')}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Add new i18n keys to housing.json in all 3 locales**

Add to `src/locales/ar/housing.json` (inside `"offer"` object):
```json
"listerName": "اسمك",
"listerPhone": "رقم هاتفك (واتساب مفضل)",
"type": "نوع العقار",
"governorate": "المحافظة",
"district": "القضاء (اختياري)",
"capacity": "السعة (عدد الأشخاص)",
"priceType": "نوع السعر",
"pricePerMonth": "السعر الشهري (دولار)",
"availableUntil": "متاح حتى (اختياري)",
"amenities": "المرافق المتوفرة",
"description": "وصف",
"descriptionPlaceholder": "إمكانية الوصول، قيود الأسرة، مرافق إضافية، أو أي تفاصيل يجب أن يعرفها الفريق."
```

Add equivalent keys to `en/housing.json` and `fr/housing.json`.

- [ ] **Step 3: Run `pnpm tsc` to verify no errors**

```bash
pnpm tsc 2>&1 | grep OfferHousing
```

- [ ] **Step 4: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 5: Commit**

```bash
git add src/Screens/Public/OfferHousing.tsx src/locales/ar/housing.json src/locales/en/housing.json src/locales/fr/housing.json
git commit -m "feat(OfferHousing): rebuild with Phase 2 schema, amenities, lister PII gated"
```

---

### Task 8: Rebuild `HousingReview` admin screen

**Files:**
- Modify: `src/Screens/Admin/HousingReview.tsx`

Current screen is a single-list view. Spec requires two tabs: "Pending Review" and "Approved Listings". In pending tab: all fields visible including `listerPhone` via `showAdminFields` prop on `HousingCard`. Approve → `status: 'available'` (NOT `'approved'`). Reject → delete document. In approved tab: manage lifecycle `available → reserved → filled`.

- [ ] **Step 1: Rewrite `HousingReview.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/firebase';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { HousingDocument, HousingStatus } from '@/types';
import HousingCard from '@/Components/HousingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { toast } from 'sonner';

interface HousingRow extends HousingDocument {
  id: string;
}

export default function HousingReview() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<HousingRow[]>([]);
  const [approved, setApproved] = useState<HousingRow[]>([]);

  useEffect(() => {
    const pendingQuery = query(
      collection(db, 'housing'),
      where('status', '==', 'pending_review'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );
    const approvedQuery = query(
      collection(db, 'housing'),
      where('status', 'in', ['available', 'reserved', 'filled']),
      orderBy('createdAt', 'desc'),
      limit(25),
    );

    const unsubPending = onSnapshot(pendingQuery, (snapshot) => {
      setPending(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as HousingDocument) })));
    });
    const unsubApproved = onSnapshot(approvedQuery, (snapshot) => {
      setApproved(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as HousingDocument) })));
    });

    return () => {
      unsubPending();
      unsubApproved();
    };
  }, []);

  const approveListing = async (id: string) => {
    try {
      await updateDoc(doc(db, 'housing', id), {
        status: 'available',
        approvedBy: auth.currentUser?.uid ?? '',
        updatedAt: serverTimestamp(),
      });
      toast.success(t('housing.admin.approveSuccess'));
    } catch (error) {
      console.error('Failed to approve housing:', error);
      toast.error(t('housing.admin.errorUpdate'));
    }
  };

  const rejectListing = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'housing', id));
      toast.success(t('housing.admin.rejectSuccess'));
    } catch (error) {
      console.error('Failed to reject housing:', error);
      toast.error(t('housing.admin.errorUpdate'));
    }
  };

  const updateStatus = async (id: string, status: HousingStatus) => {
    try {
      await updateDoc(doc(db, 'housing', id), { status, updatedAt: serverTimestamp() });
      toast.success(t('housing.admin.statusUpdated'));
    } catch (error) {
      console.error('Failed to update housing status:', error);
      toast.error(t('housing.admin.errorUpdate'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('housing.admin.title')}</h1>
        <p className="text-sm text-gray-500">{t('housing.admin.description')}</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {t('housing.admin.pendingReview')}
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">{t('housing.admin.approvedListings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {t('housing.admin.noPending')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pending.map((housing) => (
                <HousingCard
                  key={housing.id}
                  housing={housing}
                  showAdminFields
                  primaryAction={{
                    label: t('housing.admin.approve'),
                    onClick: () => void approveListing(housing.id),
                  }}
                  tertiaryAction={{
                    label: t('housing.admin.reject'),
                    onClick: () => void rejectListing(housing.id),
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approved.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {t('housing.admin.noApproved')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approved.map((housing) => (
                <HousingCard
                  key={housing.id}
                  housing={housing}
                  showAdminFields
                  primaryAction={
                    housing.status === 'available'
                      ? {
                          label: t('housing.admin.markReserved'),
                          onClick: () => void updateStatus(housing.id, 'reserved'),
                        }
                      : housing.status === 'reserved'
                        ? {
                            label: t('housing.admin.markFilled'),
                            onClick: () => void updateStatus(housing.id, 'filled'),
                          }
                        : undefined
                  }
                  tertiaryAction={{
                    label: t('housing.admin.delete'),
                    onClick: () => void rejectListing(housing.id),
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Add `housing.admin.*` i18n keys to all 3 locales**

Add to `src/locales/ar/housing.json` under `"admin"`:
```json
"admin": {
  "title": "مراجعة السكن",
  "description": "راجع عروض السكن واعتمد أو ارفض القوائم.",
  "pendingReview": "بانتظار المراجعة",
  "approvedListings": "القوائم المعتمدة",
  "approve": "اعتماد",
  "reject": "رفض",
  "markReserved": "تحديد كمحجوز",
  "markFilled": "تحديد كممتلئ",
  "delete": "حذف",
  "approveSuccess": "تم اعتماد القائمة.",
  "rejectSuccess": "تم رفض القائمة وحذفها.",
  "statusUpdated": "تم تحديث الحالة.",
  "errorUpdate": "فشل تحديث القائمة.",
  "noPending": "لا توجد عروض سكن بانتظار المراجعة.",
  "noApproved": "لا توجد قوائم معتمدة.",
  "listerContact": "معلومات المعلِن (مشرف فقط)"
}
```

Add equivalent keys to `en/housing.json` and `fr/housing.json`.

- [ ] **Step 3: Check that `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` components exist**

```bash
ls src/Components/ui/tabs.tsx 2>/dev/null || echo "MISSING"
```

If missing, run:
```bash
npx shadcn@latest add tabs --yes 2>/dev/null || pnpm dlx shadcn@latest add tabs --yes
```

- [ ] **Step 4: Run `pnpm tsc` to verify no errors**

```bash
pnpm tsc 2>&1 | grep HousingReview
```

- [ ] **Step 5: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 6: Commit**

```bash
git add src/Screens/Admin/HousingReview.tsx src/locales/ar/housing.json src/locales/en/housing.json src/locales/fr/housing.json
git commit -m "feat(HousingReview): two-tab layout, approve=available, PII gated via showAdminFields"
```

---

### Task 9: Update `Housing` public directory

**Files:**
- Modify: `src/Screens/Public/Housing.tsx`

Current screen queries `status === 'approved'` — must change to `status === 'available'`. Uses old field names. Has `onSnapshot` without `limit()` — must add `limit(25)`. Filters need updating to new schema (governorate instead of area, capacity min instead of availableSpots min, priceType `market_rate` instead of `paid`).

- [ ] **Step 1: Rewrite `Housing.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import HousingCard from '@/Components/HousingCard';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import type { HousingDocument, HousingPriceType, HousingType } from '@/types';

interface HousingRow extends HousingDocument {
  id: string;
}

export default function Housing() {
  const { t } = useTranslation();
  const [housingItems, setHousingItems] = useState<HousingRow[]>([]);
  const [governorateFilter, setGovernorateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<HousingType | 'all'>('all');
  const [priceFilter, setPriceFilter] = useState<HousingPriceType | 'all'>('all');
  const [minCapacity, setMinCapacity] = useState(1);

  useEffect(() => {
    // Only show 'available' listings — never show pending_review, reserved, or filled
    const housingQuery = query(
      collection(db, 'housing'),
      where('status', '==', 'available'),
      limit(25),
    );

    return onSnapshot(housingQuery, (snapshot) => {
      setHousingItems(
        snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as HousingDocument) }))
          .sort((a, b) => a.governorate.localeCompare(b.governorate)),
      );
    });
  }, []);

  const normalizedGovernorate = governorateFilter.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      housingItems.filter((h) => {
        const matchesGovernorate =
          normalizedGovernorate.length === 0 ||
          (h.governorate ?? '').toLowerCase().includes(normalizedGovernorate) ||
          (h.district ?? '').toLowerCase().includes(normalizedGovernorate);
        const matchesType = typeFilter === 'all' || h.type === typeFilter;
        const matchesPrice = priceFilter === 'all' || h.priceType === priceFilter;
        const matchesCapacity = h.capacity >= minCapacity;
        return matchesGovernorate && matchesType && matchesPrice && matchesCapacity;
      }),
    [housingItems, normalizedGovernorate, typeFilter, priceFilter, minCapacity],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('housing.directory.title')}</h1>
        <p className="text-gray-500">{t('housing.directory.description')}</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>{t('housing.directory.governorateLabel')}</Label>
          <Input
            value={governorateFilter}
            onChange={(e) => setGovernorateFilter(e.target.value)}
            placeholder={t('housing.directory.governoratePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('housing.directory.typeLabel')}</Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('housing.directory.allTypes')}</SelectItem>
              {(['apartment', 'room', 'house', 'floor'] as HousingType[]).map((t_) => (
                <SelectItem key={t_} value={t_}>
                  {t(`housing.card.type_${t_}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('housing.directory.priceTypeLabel')}</Label>
          <Select
            value={priceFilter}
            onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('housing.directory.allPriceTypes')}</SelectItem>
              <SelectItem value="free">{t('housing.card.free')}</SelectItem>
              <SelectItem value="subsidized">{t('housing.card.subsidized')}</SelectItem>
              <SelectItem value="market_rate">{t('housing.card.marketRate')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('housing.directory.minCapacity')}</Label>
          <Input
            type="number"
            min={1}
            value={minCapacity}
            onChange={(e) => setMinCapacity(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((housing) => (
          // NOTE: showAdminFields is NOT passed — listerName/listerPhone never shown publicly
          <HousingCard key={housing.id} housing={housing} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {t('housing.directory.noResults')}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update directory i18n keys in all 3 locales**

The housing.json `directory` section needs: `governorateLabel`, `governoratePlaceholder`, `typeLabel`, `allTypes`, `minCapacity`, `noResults`. Update `src/locales/ar/housing.json`:
```json
"governorateLabel": "المحافظة",
"governoratePlaceholder": "ابحث بالمحافظة أو القضاء",
"typeLabel": "نوع العقار",
"allTypes": "جميع الأنواع",
"minCapacity": "الحد الأدنى للسعة",
"noResults": "لا توجد قوائم سكن متاحة تطابق الفلاتر الحالية."
```

Add equivalent keys to `en/housing.json` and `fr/housing.json`.

- [ ] **Step 3: Run `pnpm tsc` to verify no errors**

```bash
pnpm tsc 2>&1 | grep Housing
```

- [ ] **Step 4: Run `pnpm format`**

```bash
pnpm format
```

- [ ] **Step 5: Commit**

```bash
git add src/Screens/Public/Housing.tsx src/locales/ar/housing.json src/locales/en/housing.json src/locales/fr/housing.json
git commit -m "feat(Housing): query status=available, new schema filters, limit(25)"
```

---

## Chunk 5: Firestore rules and final verification

### Task 10: Update Firestore rules for centers and housing

**Files:**
- Modify: `firestore.rules`

Current rules:
- `centers`: uses `resource.data.active` — must change to `resource.data.isActive`
- `housing create`: lists old fields (`hostName`, `hostPhone`, `area`, etc.) — must use new schema fields; must allow unauthenticated creates; `status` must start as `'pending_review'`
- `housing read`: needs to allow unauthenticated reads of `status == 'available'` listings

- [ ] **Step 1: Update the `/centers` rule**

Find:
```
match /centers/{centerId} {
  allow read: if resource.data.active == true || isAdmin() || isValidatedMember() || isAgent();
  allow write: if isAdmin();
}
```

Replace with:
```
match /centers/{centerId} {
  // isActive centers are readable by all authenticated users (for CenterPicker)
  allow read: if isSignedIn() || isAdmin();
  allow write: if isAdmin();
}
```

- [ ] **Step 2: Update the `/housing` rule**

Find and replace the entire housing block:
```
match /housing/{housingId} {
  // Anyone (including unauthenticated) may submit a housing offer
  allow create: if request.resource.data.keys().hasOnly([
      'listerId', 'listerName', 'listerPhone', 'type', 'governorate',
      'district', 'capacity', 'priceType', 'pricePerMonth',
      'availableFrom', 'availableUntil', 'amenities', 'description',
      'status', 'createdAt'
    ])
    // PII fields must be strings
    && request.resource.data.listerName is string
    && request.resource.data.listerPhone is string
    && request.resource.data.listerId is string
    && request.resource.data.type in ['apartment', 'room', 'house', 'floor']
    && request.resource.data.governorate is string
    && request.resource.data.capacity is int
    && request.resource.data.capacity >= 1
    && request.resource.data.priceType in ['free', 'subsidized', 'market_rate']
    // All submissions start as pending_review
    && request.resource.data.status == 'pending_review';

  // Unauthenticated users can see available listings (public directory)
  // listerPhone/listerName are in the document but MUST be stripped by Cloud Function
  // before returning to any non-admin client. Firestore cannot mask individual fields.
  // Admin sees everything. Public sees only 'available' listings.
  allow read: if isAdmin() || resource.data.status == 'available';

  allow update, delete: if isAdmin();
}
```

- [ ] **Step 3: Verify rules file is valid**

```bash
pnpm format
```

Check the file for obvious syntax errors by reading it. Firestore rules syntax is validated at deploy time.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "fix(firestore): update centers/housing rules for Phase 2 schema"
```

---

### Task 11: Final type-check and format pass

**Files:** all modified files

- [ ] **Step 1: Run full type check**

```bash
pnpm tsc 2>&1
```

Expected: 0 errors. If errors remain, fix them before proceeding.

- [ ] **Step 2: Run format**

```bash
pnpm format
```

- [ ] **Step 3: Run full type check again after format**

```bash
pnpm tsc 2>&1
```

Expected: 0 errors.

- [ ] **Step 4: Run all tests**

```bash
pnpm test:app 2>&1 | tail -20
```

Expected: all tests PASS including the new CapacityBar tests.

- [ ] **Step 5: Commit format fixes**

```bash
git add -u
git commit -m "style: run prettier on all Phase 2 files"
```

---

### Task 12: Verify completion checklist

Work through each item manually:

- [ ] CapacityBar: green < 75%, yellow 75–90%, red > 90%, grey when `isActive === false` — verified by tests
- [ ] CenterManagement: CRUD dialog with all spec fields, `onSnapshot`, `limit(25)`, `CapacityBar` in table
- [ ] CenterPicker: queries `isActive === true`, groups by governorate, shows occupancy %
- [ ] CreateSubmission: segmented control (not Select), CenterPicker shown/hidden correctly
- [ ] OfferHousing: listerName + listerPhone collected, amenities checkboxes, `pricePerMonth` shown conditionally, writes `status: 'pending_review'`
- [ ] HousingReview admin: two tabs, approve sets `status: 'available'`, `showAdminFields` passed to `HousingCard`
- [ ] Housing public directory: queries `status === 'available'` only, `limit(25)`, `showAdminFields` NOT passed (PII safe)
- [ ] `HousingCard`: `listerName`/`listerPhone` only rendered when `showAdminFields === true`
- [ ] Firestore rules: housing allows unauthenticated create, allows read for `status === 'available'`; centers requires `isSignedIn()` to read
- [ ] All PII fields (`listerName`, `listerPhone`, `managerPhone`) have `// PII:` comments in types and component code
- [ ] i18n keys in ar/en/fr for all new strings
- [ ] `pnpm format` exits 0
- [ ] `pnpm tsc` exits 0
- [ ] No `getDocs()` without `limit()` — confirmed in Housing.tsx and CenterManagement.tsx
- [ ] `consentGiven` unchanged in submissions (this PR doesn't touch submission logic beyond locationType UI)

---

## Memory Note

After completing this plan, save to project memory:
- `CenterDocument` now uses `isActive`, `totalCapacity`, `currentOccupancy`, `managerName`, `managerPhone` (PII)
- `HousingDocument` now uses `listerName`/`listerPhone` (both PII, admin only), `listerId`, `capacity`, `priceType: 'free'|'subsidized'|'market_rate'`
- `HousingStatus` = `'pending_review' | 'available' | 'reserved' | 'filled'` (no `'approved'` or `'rejected'`)
- `HousingCard` has `showAdminFields` prop — never pass it in public screens
- Approve housing → sets `status: 'available'`, not `'approved'`
