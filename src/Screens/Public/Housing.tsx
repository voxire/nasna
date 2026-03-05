import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
import type { CenterDocument, HousingDocument } from '@/types';

interface HousingRow extends HousingDocument {
  id: string;
}

interface CenterRow extends CenterDocument {
  id: string;
}

export default function Housing() {
  const [housingItems, setHousingItems] = useState<HousingRow[]>([]);
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [areaFilter, setAreaFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'subsidized' | 'paid'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState(1);

  useEffect(() => {
    const housingQuery = query(collection(db, 'housing'), where('status', '==', 'approved'));
    const centerQuery = query(collection(db, 'centers'), where('active', '==', true));

    const unsubscribeHousing = onSnapshot(housingQuery, (snapshot) => {
      setHousingItems(
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as HousingDocument),
          }))
          .sort((left, right) => left.area.localeCompare(right.area)),
      );
    });

    const unsubscribeCenters = onSnapshot(centerQuery, (snapshot) => {
      setCenters(
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as CenterDocument),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
    });

    return () => {
      unsubscribeHousing();
      unsubscribeCenters();
    };
  }, []);

  const normalizedArea = areaFilter.trim().toLowerCase();

  const filteredHousing = useMemo(
    () =>
      housingItems.filter((housing) => {
        const matchesArea =
          normalizedArea.length === 0 ||
          [housing.area, housing.address].some((field) =>
            field.toLowerCase().includes(normalizedArea),
          );
        const matchesPrice = priceFilter === 'all' || housing.priceType === priceFilter;
        const matchesAvailability = housing.availableSpots >= availabilityFilter;

        return matchesArea && matchesPrice && matchesAvailability;
      }),
    [availabilityFilter, housingItems, normalizedArea, priceFilter],
  );

  const filteredCenters = useMemo(
    () =>
      centers.filter((center) => {
        const available = Math.max(0, center.capacity - center.occupiedCapacity);
        const matchesArea =
          normalizedArea.length === 0 ||
          [center.city, center.governorate, center.address, center.name].some((field) =>
            field.toLowerCase().includes(normalizedArea),
          );

        return matchesArea && available >= availabilityFilter;
      }),
    [availabilityFilter, centers, normalizedArea],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Housing Directory</h1>
        <p className="text-gray-500">
          Browse approved host housing and active centers with current capacity.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Input
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value)}
            placeholder="Search by area, city, governorate, or address"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Price Type</Label>
          <Select
            value={priceFilter}
            onValueChange={(value) =>
              setPriceFilter(value as typeof priceFilter)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All price types</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="subsidized">Subsidized</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Minimum Spots</Label>
          <Input
            type="number"
            min={1}
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(Number(event.target.value) || 1)}
          />
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Approved Housing Offers</h2>
          <p className="text-sm text-gray-500">
            Reviewed housing listings currently available for placement.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredHousing.map((housing) => (
            <HousingCard key={housing.id} housing={housing} />
          ))}
        </div>

        {filteredHousing.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No approved housing listings matched the current filters.
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Active Centers</h2>
          <p className="text-sm text-gray-500">
            Official centers currently active in the system with live occupancy state.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredCenters.map((center) => (
            <div key={center.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                  <p className="text-sm text-gray-500">
                    {center.city}, {center.governorate}
                  </p>
                </div>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                  Official center
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>{center.address}</p>
                <p>
                  Contact: {center.contactName || 'No contact name'} · {center.contactPhone || 'No phone'}
                </p>
                <CapacityBar capacity={center.capacity} occupied={center.occupiedCapacity} />
              </div>
            </div>
          ))}
        </div>

        {filteredCenters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No centers matched the current filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
