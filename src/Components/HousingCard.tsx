import { useTranslation } from 'react-i18next';
import type { HousingDocument } from '@/types';
import { Button } from '@/Components/ui/button';

interface HousingCardProps {
  housing: HousingDocument & { id: string };
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  tertiaryAction?: { label: string; onClick: () => void };
  // Admin-only: set to true in admin review screens to show PII fields
  showAdminFields?: boolean;
}

const PRICE_BADGE: Record<string, string> = {
  free: 'bg-emerald-100 text-emerald-800',
  subsidized: 'bg-amber-100 text-amber-800',
  market_rate: 'bg-sky-100 text-sky-800',
};

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800',
  available: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-sky-100 text-sky-800',
  filled: 'bg-slate-200 text-slate-700',
};

export default function HousingCard({
  housing,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  showAdminFields = false,
}: HousingCardProps) {
  const { t } = useTranslation();

  const availableFromDate =
    housing.availableFrom instanceof Date
      ? housing.availableFrom
      : ((housing.availableFrom as { toDate?: () => Date })?.toDate?.() ?? new Date());

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              {t(`housing.card.type_${housing.type}`)}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_BADGE[housing.status] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {t(`housing.card.status_${housing.status}`)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {housing.district ? `${housing.district}, ` : ''}
            {housing.governorate}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            PRICE_BADGE[housing.priceType] ?? 'bg-gray-100 text-gray-700'
          }`}
        >
          {housing.priceType === 'free'
            ? t('housing.card.free')
            : housing.priceType === 'subsidized'
              ? t('housing.card.subsidized')
              : t('housing.card.marketRate')}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>{t('housing.card.capacity', { count: housing.capacity })}</p>
        {housing.pricePerMonth != null && housing.pricePerMonth > 0 && (
          <p>${housing.pricePerMonth}/mo</p>
        )}
        <p className="text-xs text-gray-400">
          {t('housing.card.availableFrom')} {availableFromDate.toLocaleDateString()}
        </p>
        {housing.amenities && housing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {housing.amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {t(`housing.card.amenity_${amenity}`)}
              </span>
            ))}
          </div>
        )}
        {/* Admin-only PII fields — gated by showAdminFields prop */}
        {showAdminFields && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            {/* PII: listerName and listerPhone — admin view only */}
            <p className="text-xs font-medium text-amber-800">{t('housing.admin.listerContact')}</p>
            <p className="text-sm">{housing.listerName}</p>
            <p className="text-sm">{housing.listerPhone}</p>
          </div>
        )}
      </div>

      {(primaryAction || secondaryAction || tertiaryAction) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {primaryAction && (
            <Button
              className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {tertiaryAction && (
            <Button variant="destructive" onClick={tertiaryAction.onClick}>
              {tertiaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
