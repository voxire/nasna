import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/firebase';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
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

export default function HousingReview() {
  const { t } = useTranslation();
  const [housingItems, setHousingItems] = useState<HousingRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HousingStatus | 'all'>('pending_review');

  const STATUS_FILTERS: Array<{ label: string; value: HousingStatus | 'all' }> = [
    { label: t('housing.review.allStatuses'), value: 'all' },
    { label: t('housing.review.pendingReview'), value: 'pending_review' },
    { label: t('housing.review.approved'), value: 'approved' },
    { label: t('housing.review.rejected'), value: 'rejected' },
    { label: t('housing.review.reserved'), value: 'reserved' },
    { label: t('housing.review.filled'), value: 'filled' },
  ];

  useEffect(() => {
    const housingQuery = query(collection(db, 'housing'), orderBy('createdAt', 'desc'), limit(50));

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

      toast.success(t('housing.review.statusUpdated', { status: status.replace('_', ' ') }));
    } catch (error) {
      console.error(error);
      toast.error(t('housing.review.errorUpdate'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('housing.review.title')}</h1>
        <p className="text-sm text-gray-500">
          {t('housing.review.description')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Input
          placeholder={t('housing.review.searchPlaceholder')}
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
                    label: t('housing.review.approve'),
                    onClick: () => void updateHousingStatus(housing, 'approved'),
                  }
                : undefined
            }
            secondaryAction={
              housing.status === 'approved'
                ? {
                    label: t('housing.review.reserve'),
                    onClick: () => void updateHousingStatus(housing, 'reserved'),
                  }
                : housing.status === 'reserved'
                  ? {
                      label: t('housing.review.markFilled'),
                      onClick: () => void updateHousingStatus(housing, 'filled'),
                    }
                  : undefined
            }
            tertiaryAction={
              housing.status !== 'rejected'
                ? {
                    label: t('housing.review.reject'),
                    onClick: () => void updateHousingStatus(housing, 'rejected'),
                  }
                : undefined
            }
          />
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {t('housing.review.noResults')}
        </div>
      ) : null}
    </div>
  );
}
