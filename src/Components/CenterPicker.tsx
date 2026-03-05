import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { CenterDocument } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
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
  placeholder = 'Select a center',
  disabled = false,
}: CenterPickerProps) {
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), where('active', '==', true));

    return onSnapshot(centerQuery, (snapshot) => {
      const nextCenters = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...(document.data() as CenterDocument),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

      setCenters(nextCenters);
      setLoading(false);
    });
  }, []);

  const hasSelectedCenter = useMemo(
    () => centers.some((center) => center.id === value),
    [centers, value],
  );

  return (
    <Select
      value={hasSelectedCenter ? value : undefined}
      onValueChange={onValueChange}
      disabled={disabled || loading || centers.length === 0}
    >
      <SelectTrigger className="bg-gray-50 border-gray-200">
        <SelectValue
          placeholder={
            loading
              ? 'Loading centers...'
              : centers.length === 0
                ? 'No active centers available'
                : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {centers.map((center) => (
          <SelectItem key={center.id} value={center.id}>
            {center.name} · {center.city}, {center.governorate}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
