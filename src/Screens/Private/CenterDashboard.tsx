import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/authStore';
import type { CenterDocument, SubmissionDocument } from '@/types';
import CapacityBar from '@/Components/CapacityBar';
import CaseStatusBadge from '@/Components/CaseStatusBadge';
import { Skeleton } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Building2, MapPin, Phone, Clock, Info, Pencil, Search, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface CenterRow extends CenterDocument {
  id: string;
}

interface FamilyRow extends SubmissionDocument {
  id: string;
}

/** Mask full name to "FirstName L." */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function CenterDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const [center, setCenter] = useState<CenterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editCapacity, setEditCapacity] = useState('');
  const [editOccupancy, setEditOccupancy] = useState('');
  const [editIntakeOpen, setEditIntakeOpen] = useState(true);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // ── Families (submissions at this center) ────────────────────────────────
  useEffect(() => {
    const centerId = profile?.centerId;
    if (!centerId) {
      setFamiliesLoading(false);
      return;
    }
    const q = query(
      collection(db, 'submissions'),
      where('centerId', '==', centerId),
      orderBy('registrationDate', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        setFamilies(snap.docs.map((d) => ({ id: d.id, ...(d.data() as SubmissionDocument) })));
        setFamiliesLoading(false);
      },
      (err) => {
        console.error('CenterDashboard families:', err);
        setFamiliesLoading(false);
      },
    );
  }, [profile?.centerId]);

  const openEdit = () => {
    if (!center) return;
    setEditCapacity(String(center.totalCapacity));
    setEditOccupancy(String(center.currentOccupancy));
    setEditIntakeOpen(center.intakeOpen !== false);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!center || !profile?.centerId) return;
    const capacity = parseInt(editCapacity, 10);
    const occupancy = parseInt(editOccupancy, 10);
    if (isNaN(capacity) || capacity < 0) {
      toast.error(t('submission.agent.center.errorCapacityInvalid'));
      return;
    }
    if (isNaN(occupancy) || occupancy < 0) {
      toast.error(t('submission.agent.center.errorOccupancyInvalid'));
      return;
    }
    if (occupancy > capacity) {
      toast.error(t('submission.agent.center.errorOccupancyExceedsCapacity'));
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'centers', profile.centerId), {
        totalCapacity: capacity,
        currentOccupancy: occupancy,
        intakeOpen: editIntakeOpen,
        updatedAt: serverTimestamp(),
      });
      setCenter((prev) =>
        prev
          ? {
              ...prev,
              totalCapacity: capacity,
              currentOccupancy: occupancy,
              intakeOpen: editIntakeOpen,
            }
          : prev,
      );
      setEditing(false);
      toast.success(t('submission.agent.center.saveSuccess'));
    } catch (err) {
      console.error('CenterDashboard: failed to save:', err);
      toast.error(t('submission.agent.center.saveError'));
    } finally {
      setSaving(false);
    }
  };

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
          <h2 className="text-xl font-semibold text-gray-700">
            {t('submission.agent.center.noCenter')}
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            {t('submission.agent.center.noCenterHint')}
          </p>
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
  const isActive = center.active && center.intakeOpen !== false;

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
            {[center.governorate, center.district, center.address].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      {/* Capacity card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {t('submission.agent.center.capacity')}
          </h2>
          {!editing && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openEdit}>
              <Pencil className="h-3.5 w-3.5" />
              {t('submission.agent.center.edit')}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editCapacity">{t('submission.agent.center.totalCapacity')}</Label>
                <Input
                  id="editCapacity"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editOccupancy">
                  {t('submission.agent.center.currentOccupancy')}
                </Label>
                <Input
                  id="editOccupancy"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editOccupancy}
                  onChange={(e) => setEditOccupancy(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-[#12a89d]"
                checked={editIntakeOpen}
                onChange={(e) => setEditIntakeOpen(e.target.checked)}
              />
              {t('submission.agent.center.intakeOpenLabel')}
            </label>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                {t('submission.agent.center.cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? t('submission.agent.center.saving') : t('submission.agent.center.save')}
              </Button>
            </div>
          </div>
        ) : center.totalCapacity === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            <Info className="h-4 w-4 shrink-0" />
            <span>{t('submission.agent.center.capacityNotSet')}</span>
          </div>
        ) : (
          <>
            <CapacityBar
              totalCapacity={center.totalCapacity}
              currentOccupancy={center.currentOccupancy}
              isActive={center.active}
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{center.totalCapacity}</p>
                <p className="text-xs text-gray-500">
                  {t('submission.agent.center.totalCapacity')}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{center.currentOccupancy}</p>
                <p className="text-xs text-gray-500">
                  {t('submission.agent.center.currentOccupancy')}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{availableSpots}</p>
                <p className="text-xs text-gray-500">{t('submission.agent.center.available')}</p>
              </div>
            </div>
          </>
        )}
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
        {!center.phone &&
          !center.operatingHours &&
          (!center.aidServices || center.aidServices.length === 0) && (
            <p className="text-sm text-gray-400 italic">{t('submission.agent.center.noDetails')}</p>
          )}
      </div>

      {/* Families registered at this center */}
      {(() => {
        const filtered = families.filter((f) =>
          maskName(f.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
        );
        return (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {t('submission.agent.center.families')}
                </h2>
                {!familiesLoading && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {families.length}
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Input
                  className="pl-8 h-8 text-sm w-44"
                  placeholder={t('submission.agent.center.familiesSearch')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Body */}
            {familiesLoading ? (
              <div className="divide-y divide-gray-100">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8 ml-auto" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
                <Users className="h-8 w-8" />
                <p className="text-sm font-medium">{t('submission.agent.center.familiesEmpty')}</p>
                <p className="text-xs">{t('submission.agent.center.familiesEmptyHint')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((family) => (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => navigate(`/agent/submissions/${family.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 w-28 truncate">
                      {maskName(family.fullName ?? '')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('submission.agent.center.householdSize', {
                        count: family.numberOfPeopleInHousehold,
                      })}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {family.registrationDate
                        ? new Date(
                            family.registrationDate.seconds * 1000,
                          ).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                    <div className="shrink-0">
                      <CaseStatusBadge status={family.status} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default CenterDashboard;
