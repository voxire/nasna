import type { HousingDocument } from '@/types';
import { Button } from '@/Components/ui/button';

interface HousingCardProps {
  housing: HousingDocument & { id: string };
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  reserved: 'bg-sky-100 text-sky-800',
  filled: 'bg-slate-200 text-slate-800',
};

export default function HousingCard({
  housing,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: HousingCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{housing.hostName}</h3>
          <p className="text-sm text-gray-500">
            {housing.area} · {housing.address}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_STYLES[housing.status] ?? 'bg-gray-100 text-gray-700'
          }`}
        >
          {housing.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600">
        <p>
          Capacity {housing.availableSpots}/{housing.capacity} available
        </p>
        <p>
          {housing.priceType === 'free'
            ? 'Free'
            : housing.priceType === 'subsidized'
              ? 'Subsidized'
              : 'Paid'}
        </p>
        <p>{housing.hostPhone}</p>
        <p>{housing.notes || 'No notes added.'}</p>
      </div>

      {primaryAction || secondaryAction || tertiaryAction ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {primaryAction ? (
            <Button
              className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
          {tertiaryAction ? (
            <Button variant="destructive" onClick={tertiaryAction.onClick}>
              {tertiaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
