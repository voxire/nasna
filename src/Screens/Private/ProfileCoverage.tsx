import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import { updateMemberCoverageProfile } from '@/services/memberCases';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
import type { CenterDocument } from '@/types';

export default function ProfileCoverage() {
  const [coverageType, setCoverageType] = useState<'governorate' | 'center' | 'hybrid'>(
    'governorate',
  );
  const [coverageGovernorates, setCoverageGovernorates] = useState('');
  const [coverageCenterIds, setCoverageCenterIds] = useState('');
  const [aidTypes, setAidTypes] = useState('');
  const [maxCaseLoad, setMaxCaseLoad] = useState(10);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup' | 'both'>('both');
  const [saving, setSaving] = useState(false);
  const [centers, setCenters] = useState<Array<CenterDocument & { id: string }>>([]);

  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), where('active', '==', true));

    return onSnapshot(centerQuery, (snapshot) => {
      setCenters(
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as CenterDocument),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
    });
  }, []);

  const parseCsv = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const selectedCenterIds = useMemo(() => parseCsv(coverageCenterIds), [coverageCenterIds]);

  const toggleCenter = (centerId: string, checked: boolean) => {
    const nextIds = checked
      ? Array.from(new Set([...selectedCenterIds, centerId]))
      : selectedCenterIds.filter((item) => item !== centerId);

    setCoverageCenterIds(nextIds.join(', '));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMemberCoverageProfile({
        coverageType,
        coverageGovernorates: parseCsv(coverageGovernorates),
        coverageCenterIds: parseCsv(coverageCenterIds),
        aidTypes: parseCsv(aidTypes),
        maxCaseLoad,
        deliveryMode,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Coverage Profile</h1>
        <p className="text-sm text-gray-500">
          Define where your organization operates, what aid types you can handle, and your active
          case capacity.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Coverage Type</Label>
            <Select
              value={coverageType}
              onValueChange={(value) => setCoverageType(value as typeof coverageType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="governorate">Governorate</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery Mode</Label>
            <Select
              value={deliveryMode}
              onValueChange={(value) => setDeliveryMode(value as typeof deliveryMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Coverage Governorates</Label>
            <Input
              value={coverageGovernorates}
              onChange={(event) => setCoverageGovernorates(event.target.value)}
              placeholder="Beirut, Mount Lebanon, North Lebanon"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Coverage Center IDs</Label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              {centers.length === 0 ? (
                <p className="text-sm text-gray-500">No active centers available.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {centers.map((center) => (
                    <label
                      key={center.id}
                      className="flex items-start gap-3 rounded-lg bg-white p-3"
                    >
                      <Checkbox
                        checked={selectedCenterIds.includes(center.id)}
                        onCheckedChange={(checked) => toggleCenter(center.id, Boolean(checked))}
                      />
                      <span className="space-y-1 text-sm">
                        <span className="block font-medium text-gray-800">{center.name}</span>
                        <span className="block text-gray-500">
                          {center.city}, {center.governorate}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Aid Types</Label>
            <Input
              value={aidTypes}
              onChange={(event) => setAidTypes(event.target.value)}
              placeholder="food, shelter, medicine"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Active Case Load</Label>
            <Input
              type="number"
              min={1}
              value={maxCaseLoad}
              onChange={(event) => setMaxCaseLoad(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="mt-6">
          <Button
            className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save coverage profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
