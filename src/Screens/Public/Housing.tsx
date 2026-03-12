import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import HousingCard from '@/Components/HousingCard';
import CapacityBar from '@/Components/CapacityBar';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import type { CenterDocument, HousingDocument, HousingPriceType, HousingType } from '@/types';
import { toast } from 'sonner';

interface HousingRow extends HousingDocument {
  id: string;
}

interface CenterRow extends CenterDocument {
  id: string;
}

export default function Housing() {
  const { t } = useTranslation();
  const [housingItems, setHousingItems] = useState<HousingRow[]>([]);
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [governorateFilter, setGovernorateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | HousingType>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | HousingPriceType>('all');
  const [minCapacity, setMinCapacity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const housingQuery = query(
      collection(db, 'housing'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );
    const centerQuery = query(
      collection(db, 'centers'),
      where('isActive', '==', true),
      orderBy('name'),
      limit(25),
    );

    const unsubscribeHousing = onSnapshot(
      housingQuery,
      (snapshot) => {
        setHousingItems(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as HousingDocument),
          })),
        );
        setLoading(false);
      },
      (error) => {
        console.error('housing listener error:', error);
        toast.error(t('common.errorTitle'));
        setLoading(false);
      },
    );

    const unsubscribeCenters = onSnapshot(
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
        toast.error(t('common.errorTitle'));
      },
    );

    return () => {
      unsubscribeHousing();
      unsubscribeCenters();
    };
  }, []);

  const normalizedGovernorate = useMemo(
    () => governorateFilter.trim().toLowerCase(),
    [governorateFilter],
  );

  const filteredHousing = useMemo(
    () =>
      housingItems.filter((housing) => {
        const matchesGovernorate =
          normalizedGovernorate.length === 0 ||
          [housing.governorate, housing.district].some((field) =>
            field?.toLowerCase().includes(normalizedGovernorate),
          );
        const matchesType = typeFilter === 'all' || housing.type === typeFilter;
        const matchesPrice = priceFilter === 'all' || housing.priceType === priceFilter;
        const matchesCapacity = housing.capacity >= minCapacity;
        return matchesGovernorate && matchesType && matchesPrice && matchesCapacity;
      }),
    [housingItems, normalizedGovernorate, typeFilter, priceFilter, minCapacity],
  );

  const filteredCenters = useMemo(
    () =>
      centers.filter((center) => {
        const available = Math.max(0, center.totalCapacity - center.currentOccupancy);
        const matchesArea =
          normalizedGovernorate.length === 0 ||
          [center.name, center.governorate, center.district, center.address].some((field) =>
            field?.toLowerCase().includes(normalizedGovernorate),
          );
        return matchesArea && available >= minCapacity;
      }),
    [centers, normalizedGovernorate, minCapacity],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-gray-500">{t('common.loading')}…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('housing.directory.title')}</h1>
        <p className="text-gray-500">{t('housing.directory.description')}</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>{t('housing.directory.areaLabel')}</Label>
          <Input
            value={governorateFilter}
            onChange={(event) => setGovernorateFilter(event.target.value)}
            placeholder={t('housing.directory.areaPlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('housing.directory.typeLabel')}</Label>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('housing.directory.allTypes')}</SelectItem>
              <SelectItem value="apartment">{t('housing.card.type_apartment')}</SelectItem>
              <SelectItem value="room">{t('housing.card.type_room')}</SelectItem>
              <SelectItem value="house">{t('housing.card.type_house')}</SelectItem>
              <SelectItem value="floor">{t('housing.card.type_floor')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('housing.directory.priceTypeLabel')}</Label>
          <Select
            value={priceFilter}
            onValueChange={(value) => setPriceFilter(value as typeof priceFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('housing.directory.allPriceTypes')}</SelectItem>
              <SelectItem value="free">{t('housing.directory.free')}</SelectItem>
              <SelectItem value="subsidized">{t('housing.directory.subsidized')}</SelectItem>
              <SelectItem value="market_rate">{t('housing.directory.marketRate')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('housing.directory.minSpots')}</Label>
          <Input
            type="number"
            min={1}
            value={minCapacity}
            onChange={(event) => setMinCapacity(Number(event.target.value) || 1)}
          />
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('housing.directory.approvedTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('housing.directory.approvedDescription')}</p>
          </div>

          <div className="grid gap-4">
            {filteredHousing.map((housing) => (
              <HousingCard key={housing.id} housing={housing} />
            ))}
          </div>

          {filteredHousing.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {t('housing.directory.noHousingResults')}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('housing.directory.centersTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('housing.directory.centersDescription')}</p>
          </div>

          <div className="grid gap-4">
            {filteredCenters.map((center) => (
              <div
                key={center.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                    <p className="text-sm text-gray-500">
                      {center.district ? `${center.district}, ` : ''}
                      {center.governorate}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                    {t('housing.directory.officialCenter')}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  {center.address && <p>{center.address}</p>}
                  <CapacityBar
                    totalCapacity={center.totalCapacity}
                    currentOccupancy={center.currentOccupancy}
                    isActive={center.active}
                  />
                </div>
              </div>
            ))}
          </div>

          {filteredCenters.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {t('housing.directory.noCenterResults')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
