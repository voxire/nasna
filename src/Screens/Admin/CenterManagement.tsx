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

const AID_SERVICES = [
  'food',
  'water',
  'medical',
  'clothing',
  'shelter',
  'legal',
  'psychosocial',
] as const;

type AidService = (typeof AID_SERVICES)[number];

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

type CenterFormData = z.infer<typeof centerSchema>;

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
    return onSnapshot(
      centerQuery,
      (snapshot) => {
        setCenters(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as CenterDocument),
          })),
        );
      },
      (error) => {
        console.error('centers listener error:', error);
        toast.error(t('admin.centers.errorSave'));
      },
    );
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
      active: center.active,
      lat: center.coordinates?.lat,
      lng: center.coordinates?.lng,
      phone: center.phone ?? '',
      aidServices: (center.aidServices ?? []) as AidService[],
      operatingHours: center.operatingHours ?? '',
      intakeOpen: center.intakeOpen ?? true,
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
              <TableHead className="font-semibold text-gray-700">
                {t('admin.centers.name')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('admin.centers.type')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('admin.centers.governorate')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('admin.centers.occupancy')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('admin.centers.status')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('admin.centers.actions')}
              </TableHead>
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
                    {center.district && <p className="text-xs text-gray-500">{center.district}</p>}
                  </TableCell>
                  <TableCell className="capitalize">
                    {center.type ? t(`admin.centers.type_${center.type}`) : '—'}
                  </TableCell>
                  <TableCell>{center.governorate}</TableCell>
                  <TableCell className="w-48">
                    <CapacityBar
                      totalCapacity={center.totalCapacity}
                      currentOccupancy={center.currentOccupancy}
                      isActive={center.active}
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        center.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {center.active ? t('admin.centers.active') : t('admin.centers.inactive')}
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
                checked={formState.active}
                onCheckedChange={(checked) =>
                  setFormState((p) => ({ ...p, active: Boolean(checked) }))
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
