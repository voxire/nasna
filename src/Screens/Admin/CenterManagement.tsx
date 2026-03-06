import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import type { CenterDocument } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
import { toast } from 'sonner';

interface CenterRow extends CenterDocument {
  id: string;
}

const DEFAULT_FORM = {
  name: '',
  governorate: '',
  city: '',
  address: '',
  capacity: 0,
  occupiedCapacity: 0,
  contactName: '',
  contactPhone: '',
  active: true,
};

export default function CenterManagement() {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCenter, setEditingCenter] = useState<CenterRow | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), orderBy('name'), limit(100));

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
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return centers.filter((center) =>
      normalizedQuery.length === 0
        ? true
        : [center.name, center.city, center.governorate, center.address].some((field) =>
            (field ?? '').toLowerCase().includes(normalizedQuery),
          ),
    );
  }, [centers, searchQuery]);

  const resetForm = () => {
    setFormState(DEFAULT_FORM);
    setEditingCenter(null);
  };

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.governorate.trim() || !formState.city.trim()) {
      toast.error(t('admin.centers.errorRequired'));
      return;
    }

    if (formState.capacity < 0 || formState.occupiedCapacity < 0) {
      toast.error(t('admin.centers.errorNegativeCapacity'));
      return;
    }

    if (formState.occupiedCapacity > formState.capacity) {
      toast.error(t('admin.centers.errorCapacityExceeded'));
      return;
    }

    setSaving(true);
    try {
      if (editingCenter?.id) {
        await updateDoc(doc(db, 'centers', editingCenter.id), {
          ...formState,
          updatedAt: new Date(),
        });
        toast.success(t('admin.centers.successUpdated'));
      } else {
        await addDoc(collection(db, 'centers'), {
          ...formState,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success(t('admin.centers.successAdded'));
      }

      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(t('admin.centers.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (centerId: string) => {
    try {
      await deleteDoc(doc(db, 'centers', centerId));
      toast.success(t('admin.centers.successDeleted'));
    } catch (error) {
      console.error(error);
      toast.error(t('admin.centers.errorDelete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.centers.title')}</h1>
          <p className="text-sm text-gray-500">{t('admin.centers.description')}</p>
        </div>
        <Button
          className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
          onClick={() => {
            resetForm();
            setEditingCenter({ id: '', ...DEFAULT_FORM });
          }}
        >
          {t('admin.centers.addCenter')}
        </Button>
      </div>

      <Input
        placeholder={t('admin.centers.searchPlaceholder')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="bg-white"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCenters.map((center) => {
          const available = Math.max(
            0,
            Number(center.capacity ?? 0) - Number(center.occupiedCapacity ?? 0),
          );

          return (
            <Card key={center.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{center.name}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {center.city}, {center.governorate}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      center.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {center.active ? t('admin.centers.active') : t('admin.centers.inactive')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{center.address}</p>
                  <p>
                    {`${t('admin.centers.capacity')} ${center.occupiedCapacity}/${center.capacity} · ${available} ${t('admin.centers.available')}`}
                  </p>
                  <p>
                    {center.contactName || t('admin.centers.noContactName')} ·{' '}
                    {center.contactPhone || t('admin.centers.noPhone')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCenter(center);
                      setFormState({
                        name: center.name,
                        governorate: center.governorate,
                        city: center.city,
                        address: center.address,
                        capacity: Number(center.capacity ?? 0),
                        occupiedCapacity: Number(center.occupiedCapacity ?? 0),
                        contactName: center.contactName ?? '',
                        contactPhone: center.contactPhone ?? '',
                        active: Boolean(center.active),
                      });
                    }}
                  >
                    {t('admin.centers.edit')}
                  </Button>
                  <Button variant="destructive" onClick={() => void handleDelete(center.id)}>
                    {t('admin.centers.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={editingCenter !== null}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCenter?.id ? t('admin.centers.editTitle') : t('admin.centers.addTitle')}
            </DialogTitle>
            <DialogDescription>{t('admin.centers.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.centers.name')}</Label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.governorate')}</Label>
                <Input
                  value={formState.governorate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, governorate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.centers.city')}</Label>
                <Input
                  value={formState.city}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.centers.address')}</Label>
              <Input
                value={formState.address}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.totalCapacity')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.capacity}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      capacity: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.centers.occupiedCapacity')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.occupiedCapacity}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      occupiedCapacity: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('admin.centers.contactName')}</Label>
                <Input
                  value={formState.contactName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, contactName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.centers.contactPhone')}</Label>
                <Input
                  value={formState.contactPhone}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, contactPhone: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Checkbox
                id="center-active"
                checked={formState.active}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({ ...current, active: Boolean(checked) }))
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
                : editingCenter?.id
                  ? t('admin.centers.saveChanges')
                  : t('admin.centers.createCenter')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
