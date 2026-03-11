import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { getMemberCoverageProfile, updateMemberCoverageProfile } from '@/services/memberCases';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [coverageType, setCoverageType] = useState<'governorate' | 'center' | 'hybrid'>(
    'governorate',
  );
  const [coverageGovernorates, setCoverageGovernorates] = useState('');
  const [coverageCenterIds, setCoverageCenterIds] = useState('');
  const [aidTypes, setAidTypes] = useState('');
  const [maxCaseLoad, setMaxCaseLoad] = useState(10);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup' | 'both'>('both');
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [centers, setCenters] = useState<Array<CenterDocument & { id: string }>>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getMemberCoverageProfile();
        setCoverageType(profile.coverageType);
        setCoverageGovernorates(profile.coverageGovernorates.join(', '));
        setCoverageCenterIds(profile.coverageCenterIds.join(', '));
        setAidTypes(profile.aidTypes.join(', '));
        setMaxCaseLoad(profile.maxCaseLoad);
        setDeliveryMode(profile.deliveryMode);
      } catch {
        // Profile not yet configured — defaults are fine
      } finally {
        setProfileLoading(false);
      }
    };

    void loadProfile();
  }, []);

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

      if (firebaseUser) {
        await refreshProfile();
      }

      toast.success(t('profile.saveSuccess'));
      navigate('/ngo/submissions');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        {t('profile.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('profile.title')}</h1>
        <p className="text-sm text-gray-500">{t('profile.description')}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('profile.coverageType')}</Label>
            <Select
              value={coverageType}
              onValueChange={(value) => setCoverageType(value as typeof coverageType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="governorate">{t('profile.governorate')}</SelectItem>
                <SelectItem value="center">{t('profile.center')}</SelectItem>
                <SelectItem value="hybrid">{t('profile.hybrid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('profile.deliveryMode')}</Label>
            <Select
              value={deliveryMode}
              onValueChange={(value) => setDeliveryMode(value as typeof deliveryMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">{t('profile.delivery')}</SelectItem>
                <SelectItem value="pickup">{t('profile.pickup')}</SelectItem>
                <SelectItem value="both">{t('profile.both')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('profile.coverageGovernorates')}</Label>
            <Input
              value={coverageGovernorates}
              onChange={(event) => setCoverageGovernorates(event.target.value)}
              placeholder={t('profile.governoratesPlaceholder')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('profile.coverageCenterIds')}</Label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              {centers.length === 0 ? (
                <p className="text-sm text-gray-500">{t('profile.noCenters')}</p>
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
                          {center.district ? `${center.district}, ` : ''}
                          {center.governorate}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('profile.aidTypes')}</Label>
            <Input
              value={aidTypes}
              onChange={(event) => setAidTypes(event.target.value)}
              placeholder={t('profile.aidTypesPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('profile.maxCaseLoad')}</Label>
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
            {saving ? t('profile.saving') : t('profile.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
