import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/firebase';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import type { CenterDocument } from '@/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface CenterRow extends CenterDocument {
  id: string;
}

interface CenterPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CenterPicker({
  value,
  onValueChange,
  placeholder,
  disabled = false,
}: CenterPickerProps) {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // limit(100) bounds the query — realistically centers won't exceed this
    const centerQuery = query(collection(db, 'centers'), where('active', '==', true), limit(100));

    return onSnapshot(
      centerQuery,
      (snapshot) => {
        setCenters(
          snapshot.docs
            .map((document) => ({
              id: document.id,
              ...(document.data() as CenterDocument),
            }))
            .sort(
              (a, b) => a.governorate.localeCompare(b.governorate) || a.name.localeCompare(b.name),
            ),
        );
        setLoading(false);
      },
      (err) => {
        console.error('CenterPicker: failed to load centers:', err);
        setLoading(false);
        setError(err);
      },
    );
  }, []);

  const byGovernorate = useMemo(() => {
    const grouped: Record<string, CenterRow[]> = {};
    for (const center of centers) {
      (grouped[center.governorate] ??= []).push(center);
    }
    return grouped;
  }, [centers]);

  const hasSelectedCenter = useMemo(() => centers.some((c) => c.id === value), [centers, value]);

  const occupancyLabel = (center: CenterRow) => {
    const pct = Math.round((center.currentOccupancy / Math.max(1, center.totalCapacity)) * 100);
    return `${center.name} (${pct}%)`;
  };

  return (
    <Select
      value={hasSelectedCenter ? value : undefined}
      onValueChange={onValueChange}
      disabled={disabled || loading || centers.length === 0}
    >
      <SelectTrigger className="border-gray-200 bg-gray-50">
        <SelectValue
          placeholder={
            loading
              ? t('common.loading')
              : error
                ? t('submission.centersLoadError')
                : centers.length === 0
                  ? t('submission.noCentersAvailable')
                  : (placeholder ?? t('submission.selectCenter'))
          }
        />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(byGovernorate).map(([governorate, items]) => (
          <SelectGroup key={governorate}>
            <SelectLabel>{governorate}</SelectLabel>
            {items.map((center) => (
              <SelectItem key={center.id} value={center.id}>
                {occupancyLabel(center)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
