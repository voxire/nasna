import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCenter, setEditingCenter] = useState<CenterRow | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), orderBy('name'));

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
      toast.error('Name, governorate, and city are required.');
      return;
    }

    if (formState.capacity < 0 || formState.occupiedCapacity < 0) {
      toast.error('Capacity values cannot be negative.');
      return;
    }

    if (formState.occupiedCapacity > formState.capacity) {
      toast.error('Occupied capacity cannot exceed total capacity.');
      return;
    }

    setSaving(true);
    try {
      if (editingCenter?.id) {
        await updateDoc(doc(db, 'centers', editingCenter.id), {
          ...formState,
          updatedAt: new Date(),
        });
        toast.success('Center updated.');
      } else {
        await addDoc(collection(db, 'centers'), {
          ...formState,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success('Center added.');
      }

      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save center.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (centerId: string) => {
    try {
      await deleteDoc(doc(db, 'centers', centerId));
      toast.success('Center deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete center.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Center Management</h1>
          <p className="text-sm text-gray-500">
            Maintain active centers used in submissions, dispatch, and NGO coverage matching.
          </p>
        </div>
        <Button
          className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
          onClick={() => {
            resetForm();
            setEditingCenter({ id: '', ...DEFAULT_FORM });
          }}
        >
          Add Center
        </Button>
      </div>

      <Input
        placeholder="Search by center, city, governorate, or address"
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
                    {center.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{center.address}</p>
                  <p>
                    Capacity {center.occupiedCapacity}/{center.capacity} · {available} available
                  </p>
                  <p>
                    {center.contactName || 'No contact name'} · {center.contactPhone || 'No phone'}
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
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => void handleDelete(center.id)}>
                    Delete
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
            <DialogTitle>{editingCenter?.id ? 'Edit Center' : 'Add Center'}</DialogTitle>
            <DialogDescription>
              These center records are used by intake, dispatch, and NGO coverage matching.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Governorate</Label>
                <Input
                  value={formState.governorate}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, governorate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formState.city}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formState.address}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Total Capacity</Label>
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
                <Label>Occupied Capacity</Label>
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
                <Label>Contact Name</Label>
                <Input
                  value={formState.contactName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, contactName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
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
                Center is active and available for intake
              </Label>
            </div>
            <Button
              className="w-full bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? 'Saving...' : editingCenter?.id ? 'Save Changes' : 'Create Center'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
