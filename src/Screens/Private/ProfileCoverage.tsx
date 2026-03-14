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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import type { CenterDocument } from '@/types';
import { LEBANON_GOVERNORATES, LEBANON_GOVERNORATE_TRANSLATION_KEYS } from '@/lib/governorates';

export default function ProfileCoverage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [coverageType, setCoverageType] = useState<'governorate' | 'center' | 'hybrid'>(
    'governorate',
  );
  const [coverageGovernorates, setCoverageGovernorates] = useState<string[]>([]);
  const [coverageCenterIds, setCoverageCenterIds] = useState<string[]>([]);
  const [aidTypes, setAidTypes] = useState('');
  const [maxCaseLoad, setMaxCaseLoad] = useState(10);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup' | 'both'>('both');
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [centers, setCenters] = useState<Array<CenterDocument & { id: string }>>([]);
  const [centerGovernorateFilter, setCenterGovernorateFilter] = useState('all');
  const [centerCapacityFilter, setCenterCapacityFilter] = useState('all');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getMemberCoverageProfile();
        setCoverageType(profile.coverageType);
        setCoverageGovernorates(profile.coverageGovernorates);
        setCoverageCenterIds(profile.coverageCenterIds);
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

  const toggleCenter = (centerId: string, checked: boolean) => {
    setCoverageCenterIds((current) =>
      checked
        ? Array.from(new Set([...current, centerId]))
        : current.filter((item) => item !== centerId),
    );
  };

  const toggleGovernorate = (governorate: string, checked: boolean) => {
    setCoverageGovernorates((current) =>
      checked
        ? Array.from(new Set([...current, governorate]))
        : current.filter((item) => item !== governorate),
    );
  };

  const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      const matchesGovernorate =
        centerGovernorateFilter === 'all' || center.governorate === centerGovernorateFilter;

      const totalCapacity = Number(center.totalCapacity ?? center.capacity ?? 0);
      const matchesCapacity =
        centerCapacityFilter === 'all' ||
        (centerCapacityFilter === 'small' && totalCapacity <= 100) ||
        (centerCapacityFilter === 'medium' && totalCapacity > 100 && totalCapacity <= 300) ||
        (centerCapacityFilter === 'large' && totalCapacity > 300);

      return matchesGovernorate && matchesCapacity;
    });
  }, [centerCapacityFilter, centerGovernorateFilter, centers]);

  const selectAllVisibleCenters = () => {
    setCoverageCenterIds((current) =>
      Array.from(new Set([...current, ...filteredCenters.map((center) => center.id)])),
    );
  };

  const clearVisibleCenters = () => {
    const visibleCenterIds = new Set(filteredCenters.map((center) => center.id));
    setCoverageCenterIds((current) =>
      current.filter((centerId) => !visibleCenterIds.has(centerId)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMemberCoverageProfile({
        coverageType,
        coverageGovernorates,
        coverageCenterIds,
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

  const selectedGovernoratesLabel =
    coverageGovernorates.length === 0
      ? t('profile.chooseGovernorates')
      : coverageGovernorates
          .map((governorate) =>
            t(
              LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                governorate as keyof typeof LEBANON_GOVERNORATE_TRANSLATION_KEYS
              ] ?? governorate,
            ),
          )
          .join(', ');

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-gray-200 bg-white text-left font-normal"
                >
                  <span className="truncate">{selectedGovernoratesLabel}</span>
                  <span className="text-xs text-gray-400">{coverageGovernorates.length}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[320px]">
                <DropdownMenuLabel>{t('profile.coverageGovernorates')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LEBANON_GOVERNORATES.map((governorate) => (
                  <DropdownMenuCheckboxItem
                    key={governorate}
                    checked={coverageGovernorates.includes(governorate)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => toggleGovernorate(governorate, Boolean(checked))}
                  >
                    {t(LEBANON_GOVERNORATE_TRANSLATION_KEYS[governorate])}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('profile.coverageCenterIds')}</Label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <Select value={centerGovernorateFilter} onValueChange={setCenterGovernorateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile.filterGovernorate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('profile.allGovernorates')}</SelectItem>
                    {LEBANON_GOVERNORATES.map((governorate) => (
                      <SelectItem key={governorate} value={governorate}>
                        {t(LEBANON_GOVERNORATE_TRANSLATION_KEYS[governorate])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={centerCapacityFilter} onValueChange={setCenterCapacityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile.filterCapacity')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('profile.allCapacities')}</SelectItem>
                    <SelectItem value="small">{t('profile.capacitySmall')}</SelectItem>
                    <SelectItem value="medium">{t('profile.capacityMedium')}</SelectItem>
                    <SelectItem value="large">{t('profile.capacityLarge')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={selectAllVisibleCenters}>
                  {t('profile.selectAllVisible')}
                </Button>
                <Button type="button" variant="outline" onClick={clearVisibleCenters}>
                  {t('profile.clearVisible')}
                </Button>
              </div>
              {centers.length === 0 ? (
                <p className="text-sm text-gray-500">{t('profile.noCenters')}</p>
              ) : filteredCenters.length === 0 ? (
                <p className="text-sm text-gray-500">{t('profile.noCentersForFilters')}</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredCenters.map((center) => (
                    <label
                      key={center.id}
                      className="flex items-start gap-3 rounded-lg bg-white p-3"
                    >
                      <Checkbox
                        checked={coverageCenterIds.includes(center.id)}
                        onCheckedChange={(checked) => toggleCenter(center.id, Boolean(checked))}
                      />
                      <span className="space-y-1 text-sm">
                        <span className="block font-medium text-gray-800">{center.name}</span>
                        <span className="block text-gray-500">
                          {center.district ? `${center.district}, ` : ''}
                          {center.governorate}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {t('profile.totalCapacityLabel', {
                            count: Number(center.totalCapacity ?? center.capacity ?? 0),
                          })}
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
