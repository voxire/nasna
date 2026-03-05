import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/firebase';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import type { HousingDocument, HousingStatus } from '@/types';
import HousingCard from '@/Components/HousingCard';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { toast } from 'sonner';

interface HousingRow extends HousingDocument {
  id: string;
}

const STATUS_FILTERS: Array<{ label: string; value: HousingStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Filled', value: 'filled' },
];

export default function HousingReview() {
  const [housingItems, setHousingItems] = useState<HousingRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HousingStatus | 'all'>('pending_review');

  useEffect(() => {
    const housingQuery = query(collection(db, 'housing'), orderBy('createdAt', 'desc'));

    return onSnapshot(housingQuery, (snapshot) => {
      setHousingItems(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as HousingDocument),
        })),
      );
    });
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return housingItems.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [item.hostName, item.hostPhone, item.area, item.address].some((field) =>
          (field ?? '').toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesSearch;
    });
  }, [housingItems, searchQuery, statusFilter]);

  const updateHousingStatus = async (housing: HousingRow, status: HousingStatus) => {
    try {
      await updateDoc(doc(db, 'housing', housing.id), {
        status,
        approvedBy: auth.currentUser?.uid ?? '',
        approvedAt: status === 'approved' ? new Date() : (housing.approvedAt ?? null),
        updatedAt: new Date(),
      });

      toast.success(`Housing listing marked ${status.replace('_', ' ')}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update housing listing.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Housing Review</h1>
        <p className="text-sm text-gray-500">
          Review submitted housing offers, approve trusted capacity, and track reserved or filled
          inventory.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Input
          placeholder="Search by host, phone, area, or address"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="min-w-[240px] flex-1 bg-gray-50"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as HousingStatus | 'all')}
        >
          <SelectTrigger className="w-[180px] bg-gray-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredItems.map((housing) => (
          <HousingCard
            key={housing.id}
            housing={housing}
            primaryAction={
              housing.status !== 'approved'
                ? {
                    label: 'Approve',
                    onClick: () => void updateHousingStatus(housing, 'approved'),
                  }
                : undefined
            }
            secondaryAction={
              housing.status === 'approved'
                ? {
                    label: 'Reserve',
                    onClick: () => void updateHousingStatus(housing, 'reserved'),
                  }
                : housing.status === 'reserved'
                  ? {
                      label: 'Mark Filled',
                      onClick: () => void updateHousingStatus(housing, 'filled'),
                    }
                  : undefined
            }
            tertiaryAction={
              housing.status !== 'rejected'
                ? {
                    label: 'Reject',
                    onClick: () => void updateHousingStatus(housing, 'rejected'),
                  }
                : undefined
            }
          />
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No housing offers matched the current filters.
        </div>
      ) : null}
    </div>
  );
}
