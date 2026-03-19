import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/authStore';
import type { CenterDocument } from '@/types';
import CapacityBar from '@/Components/CapacityBar';
import { Skeleton } from '@/Components/ui/skeleton';
import { Building2, MapPin, Phone, Clock, Info } from 'lucide-react';

interface CenterRow extends CenterDocument {
  id: string;
}

function CenterDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const [center, setCenter] = useState<CenterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const centerId = profile?.centerId;
    if (!centerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getDoc(doc(db, 'centers', centerId))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setCenter({ id: snap.id, ...(snap.data() as CenterDocument) });
        } else {
          setError(t('submission.agent.center.notFound'));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('CenterDashboard: failed to load center:', err);
        setError(t('submission.agent.center.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.centerId, t]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!profile?.centerId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Building2 className="h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">{t('submission.agent.center.noCenter')}</h2>
          <p className="text-sm text-gray-500 max-w-sm">{t('submission.agent.center.noCenterHint')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Info className="h-10 w-10 text-red-400" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!center) return null;

  const availableSpots = Math.max(0, center.totalCapacity - center.currentOccupancy);
  const isActive = center.active && (center.intakeOpen !== false);

  const typeLabel: Record<string, string> = {
    school: t('admin.centers.type_school'),
    university: t('admin.centers.type_university'),
    community_hall: t('admin.centers.type_community_hall'),
    sports_facility: t('admin.centers.type_sports_facility'),
    other: t('admin.centers.type_other'),
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{center.name}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {typeLabel[center.type] ?? center.type}
          </span>
          {isActive ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              {t('submission.agent.center.intakeOpen')}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
              {t('submission.agent.center.intakeClosed')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            {[center.governorate, center.district, center.address]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </div>

      {/* Capacity card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('submission.agent.center.capacity')}
        </h2>
        <CapacityBar
          totalCapacity={center.totalCapacity}
          currentOccupancy={center.currentOccupancy}
          isActive={center.active}
        />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{center.totalCapacity}</p>
            <p className="text-xs text-gray-500">{t('submission.agent.center.totalCapacity')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{center.currentOccupancy}</p>
            <p className="text-xs text-gray-500">{t('submission.agent.center.currentOccupancy')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{availableSpots}</p>
            <p className="text-xs text-gray-500">{t('submission.agent.center.available')}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('submission.agent.center.details')}
        </h2>
        {center.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{center.phone}</span>
          </div>
        )}
        {center.operatingHours && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{center.operatingHours}</span>
          </div>
        )}
        {center.aidServices && center.aidServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {center.aidServices.map((service) => (
              <span
                key={service}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100"
              >
                {service}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CenterDashboard;
