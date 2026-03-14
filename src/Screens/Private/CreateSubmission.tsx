import { useCallback, useEffect, useMemo, useState } from 'react';
import { auth, db, functions } from '../../firebase';
import { addDoc, collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { AgeRanges, AidUrgency, CenterDocument, Gender, LocationType } from '../../types';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import AidTypeCheckboxGrid from '@/Components/AidTypeCheckboxGrid';
import CenterPicker from '@/Components/CenterPicker';
import { buildSubmissionWorkflowDefaults } from '@/lib/v2Defaults';
import {
  clearSubmissionDraft,
  listQueuedSubmissions,
  loadSubmissionDraft,
  queueSubmission,
  saveSubmissionDraft,
  syncQueuedSubmissions,
  type QueuedSubmissionRecord,
} from '@/services/offlineSubmissionQueue';

const baseSubmissionSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number'),
  emailAddress: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email().optional(),
  ),
  gender: z.enum(['Male', 'Female']),
  currentGovernorate: z.string().min(1),
  previousGovernorate: z.string().min(1),
  street: z.string().min(1),
  building: z.string().min(1),
  floor: z.string().min(1),
  city: z.string().min(1),
  locationType: z.enum(['with_family', 'center']),
  centerId: z.string(),
  ageRanges: z.object({
    '0-3': z.number().min(0),
    '4-12': z.number().min(0),
    '13-18': z.number().min(0),
    '19-60': z.number().min(0),
    '60+': z.number().min(0),
  }),
  specialNeeds: z.array(z.string()),
  needs: z.array(z.string()),
  aidUrgency: z.enum(['High', 'Medium', 'Low']),
  consentGiven: z.literal(true, { error: 'Consent is required' }),
  comments: z.string().max(500),
  numberOfPeopleInHousehold: z.number().min(0),
});

const submissionSchema = baseSubmissionSchema.superRefine((value, context) => {
  if (value.locationType === 'center' && !value.centerId.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['centerId'],
      message: 'Center selection is required',
    });
  }
});

interface SubmissionFormData {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  gender: Gender | '';
  locationType: LocationType;
  centerId: string;
  currentGovernorate: string;
  previousGovernorate: string;
  street: string;
  building: string;
  floor: string;
  city: string;
  ageRanges: AgeRanges;
  specialNeeds: string[];
  needs: string[];
  aidUrgency: AidUrgency | '';
  consentGiven: boolean;
  comments: string;
  numberOfPeopleInHousehold: number;
}

const defaultFormData: SubmissionFormData = {
  fullName: '',
  phoneNumber: '',
  emailAddress: '',
  gender: '',
  locationType: 'with_family',
  centerId: '',
  currentGovernorate: '',
  previousGovernorate: '',
  street: '',
  building: '',
  floor: '',
  city: '',
  ageRanges: { '0-3': 0, '4-12': 0, '13-18': 0, '19-60': 0, '60+': 0 },
  specialNeeds: [],
  needs: [],
  aidUrgency: '',
  consentGiven: false,
  comments: '',
  numberOfPeopleInHousehold: 0,
};

function CreateSubmission() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>(defaultFormData);
  const [specialNeedInput, setSpecialNeedInput] = useState('');
  const [centers, setCenters] = useState<Array<CenterDocument & { id: string }>>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [queuedItems, setQueuedItems] = useState<QueuedSubmissionRecord[]>([]);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState('');

  const userUid = auth.currentUser?.uid;
  const draftKey = useMemo(() => `submission-draft:${userUid ?? 'anonymous'}`, [userUid]);

  useEffect(() => {
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
            .sort((left, right) => left.name.localeCompare(right.name)),
        );
      },
      (error) => {
        console.error('centers listener error:', error);
        toast.error(t('submission.centersLoadError'));
      },
    );
  }, []);

  const refreshQueuedItems = useCallback(async () => {
    if (!userUid) return;
    setQueuedItems(await listQueuedSubmissions(userUid));
  }, [userUid]);

  useEffect(() => {
    if (!userUid) return;

    void (async () => {
      const draft = await loadSubmissionDraft<{
        formData: SubmissionFormData;
        specialNeedInput: string;
      }>(draftKey);

      if (draft) {
        setFormData(draft.formData);
        setSpecialNeedInput(draft.specialNeedInput);
        toast.info('Restored your local draft on this device.');
      }

      await refreshQueuedItems();
      setDraftReady(true);
    })();
  }, [draftKey, refreshQueuedItems, userUid]);

  useEffect(() => {
    if (!draftReady || !userUid) return;

    void saveSubmissionDraft(draftKey, {
      formData,
      specialNeedInput,
    });
  }, [draftKey, draftReady, formData, specialNeedInput, userUid]);

  const submitSubmissionPayload = useCallback(async (payload: Record<string, unknown>) => {
    await addDoc(collection(db, 'submissions'), payload);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (!userUid || !isOnline) return;

    setSyncingQueue(true);
    try {
      const syncedCount = await syncQueuedSubmissions(userUid, submitSubmissionPayload);
      await refreshQueuedItems();

      if (syncedCount > 0) {
        setLastSyncMessage(
          syncedCount === 1
            ? '1 queued submission synced.'
            : `${syncedCount} queued submissions synced.`,
        );
        toast.success(
          syncedCount === 1
            ? '1 queued submission synced.'
            : `${syncedCount} queued submissions synced.`,
        );
      }
    } finally {
      setSyncingQueue(false);
    }
  }, [isOnline, refreshQueuedItems, submitSubmissionPayload, userUid]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      void syncOfflineQueue();
    }
  }, [isOnline, syncOfflineQueue]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (queuedItems.length === 0) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [queuedItems.length]);

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedCenter = centers.find((center) => center.id === formData.centerId);
  const isCenterCase = formData.locationType === 'center';
  const failedQueueItems = queuedItems.filter((item) => item.status === 'failed');

  const resetSubmissionState = async () => {
    setFormData(defaultFormData);
    setSpecialNeedInput('');
    await clearSubmissionDraft(draftKey);
  };

  const buildSubmissionPayload = useCallback(
    (validatedData: z.output<typeof submissionSchema>) => ({
      ...validatedData,
      ...buildSubmissionWorkflowDefaults('agent'),
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      agent: auth.currentUser?.uid ?? userUid ?? '',
    }),
    [userUid],
  );

  const addSpecialNeed = () => {
    const normalized = specialNeedInput.trim();
    if (!normalized) return;

    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(normalized)
        ? prev.specialNeeds
        : [...prev.specialNeeds, normalized],
    }));
    setSpecialNeedInput('');
  };

  const removeSpecialNeed = (specialNeed: string) => {
    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((item) => item !== specialNeed),
    }));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload =
      isCenterCase && selectedCenter
        ? {
            ...formData,
            currentGovernorate: selectedCenter.governorate,
            city: selectedCenter.district ?? selectedCenter.governorate,
            street: selectedCenter.address ?? '',
            building: selectedCenter.name,
            floor: 'Center intake',
          }
        : formData;

    const result = submissionSchema.safeParse(payload);
    if (!result.success) {
      const consentError = result.error.issues.find((i) => i.path.includes('consentGiven'));
      const centerError = result.error.issues.find((i) => i.path.includes('centerId'));
      if (consentError) {
        toast.error(t('submission.consentRequired'));
      } else if (centerError) {
        toast.error(t('submission.centerRequired'));
      } else {
        toast.error(t('submission.validationError'));
      }
      return;
    }

    setLoading(true);
    try {
      if (isOnline) {
        try {
          const checkDuplicate = httpsCallable<
            { phoneNumber: string; emailAddress?: string },
            { phoneDuplicate: boolean; emailDuplicate: boolean }
          >(functions, 'checkSubmissionDuplicates');
          const dupResult = await checkDuplicate({
            phoneNumber: result.data.phoneNumber,
            emailAddress: result.data.emailAddress,
          });
          if (dupResult.data.phoneDuplicate) {
            toast.warning(t('submission.duplicatePhoneWarning'));
          }
        } catch {
          // Non-blocking: if the duplicate check fails, proceed with submission
        }
      }

      const submissionPayload = buildSubmissionPayload(result.data);

      if (!isOnline) {
        await queueSubmission(userUid ?? 'anonymous', submissionPayload);
        await refreshQueuedItems();
        await resetSubmissionState();
        setLastSyncMessage(t('submission.offlineQueued'));
        toast.success(t('submission.offlineQueued'));
        return;
      }

      await submitSubmissionPayload(submissionPayload);
      toast.success(t('submission.success'));
      await resetSubmissionState();
    } catch (error) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';

      if (!isOnline || errorCode === 'unavailable' || errorCode === 'failed-precondition') {
        await queueSubmission(userUid ?? 'anonymous', buildSubmissionPayload(result.data));
        await refreshQueuedItems();
        await resetSubmissionState();
        setLastSyncMessage(t('submission.offlineRecovered'));
        toast.success(t('submission.offlineRecovered'));
      } else {
        toast.error(t('submission.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto my-5 px-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{t('submission.title')}</h1>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-600"
          onClick={() => navigate('/agent/submissions')}
        >
          {t('submission.mySubmissions')}
        </Button>
      </div>

      {!isOnline ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t('submission.offlineBanner')}
        </div>
      ) : null}

      {queuedItems.length > 0 || syncingQueue || lastSyncMessage ? (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium">
                {syncingQueue
                  ? t('submission.syncingQueue')
                  : t('submission.queueCount', { count: queuedItems.length })}
              </p>
              {lastSyncMessage ? <p>{lastSyncMessage}</p> : null}
              {failedQueueItems.length > 0 ? (
                <p className="text-rose-700">
                  {t('submission.queueFailed', { count: failedQueueItems.length })}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void syncOfflineQueue()}
              disabled={!isOnline || syncingQueue || queuedItems.length === 0}
            >
              {t('submission.retrySync')}
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleAddMember} className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
            {t('submission.personalInformation')}
          </h2>
          {[
            { name: 'fullName', label: t('submission.fullName') },
            { name: 'phoneNumber', label: t('submission.phoneNumber') },
            { name: 'emailAddress', label: t('submission.emailAddress'), type: 'email' },
          ].map(({ name, label, type }) => (
            <div key={name} className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">{label}</Label>
              <Input
                type={type ?? 'text'}
                value={String(formData[name as keyof SubmissionFormData] ?? '')}
                onChange={(e) => handleChange(name, e.target.value)}
                required
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('submission.gender')}</Label>
            <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">{t('submission.male')}</SelectItem>
                <SelectItem value="Female">{t('submission.female')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
            {t('submission.locationDetails')}
          </h2>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.locationType')}
            </Label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              {(
                [
                  { value: 'with_family', label: t('submission.locationTypeFamily') },
                  { value: 'center', label: t('submission.locationTypeCenter') },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      locationType: value,
                      centerId: '',
                      numberOfPeopleInHousehold:
                        value === 'center' ? 0 : prev.numberOfPeopleInHousehold,
                    }))
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    formData.locationType === value
                      ? 'bg-white text-[#12a89d] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ name: 'previousGovernorate', label: t('submission.previousGovernorate') }].map(
              ({ name, label }) => (
                <div key={name} className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">{label}</Label>
                  <Input
                    value={String(formData[name as keyof SubmissionFormData] ?? '')}
                    onChange={(e) => handleChange(name, e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                  />
                </div>
              ),
            )}
          </div>
          {isCenterCase ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  {t('submission.center')}
                </Label>
                <CenterPicker
                  value={formData.centerId}
                  onValueChange={(value) => handleChange('centerId', value)}
                />
              </div>
              {selectedCenter ? (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">{selectedCenter.name}</p>
                  <p>
                    {selectedCenter.district ? `${selectedCenter.district}, ` : ''}
                    {selectedCenter.governorate}
                  </p>
                  {selectedCenter.address && <p>{selectedCenter.address}</p>}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'currentGovernorate', label: t('submission.currentGovernorate') },
                { name: 'street', label: t('submission.street') },
                { name: 'building', label: t('submission.building') },
                { name: 'floor', label: t('submission.floor') },
                { name: 'city', label: t('submission.city') },
              ].map(({ name, label }) => (
                <div key={name} className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">{label}</Label>
                  <Input
                    value={String(formData[name as keyof SubmissionFormData] ?? '')}
                    onChange={(e) => handleChange(name, e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCenterCase ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
              {t('submission.householdAndNeeds')}
            </h2>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                {t('submission.numberOfPeopleInHousehold')}
              </Label>
              <Input
                type="number"
                value={formData.numberOfPeopleInHousehold}
                onChange={(e) => handleChange('numberOfPeopleInHousehold', Number(e.target.value))}
                required
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(formData.ageRanges) as Array<keyof AgeRanges>).map((range) => (
                <div key={range} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">{`${range} (${t('submission.numberOfMembers')})`}</Label>
                  <Input
                    type="number"
                    value={formData.ageRanges[range]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ageRanges: { ...prev.ageRanges, [range]: Number(e.target.value) },
                      }))
                    }
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.needsTitle')}
            </Label>
            <AidTypeCheckboxGrid
              selected={formData.needs}
              onChange={(selected) => setFormData((prev) => ({ ...prev, needs: selected }))}
              i18nPrefix="submission.needs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.specialNeedsTitle')}
            </Label>
            <div className="flex gap-2">
              <Input
                value={specialNeedInput}
                onChange={(e) => setSpecialNeedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSpecialNeed();
                  }
                }}
                placeholder={t('submission.specialNeedsPlaceholder')}
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
              <Button type="button" variant="outline" onClick={addSpecialNeed}>
                {t('submission.addSpecialNeed')}
              </Button>
            </div>
            <p className="text-xs text-gray-500">{t('submission.specialNeedsHint')}</p>
            {formData.specialNeeds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.specialNeeds.map((specialNeed) => (
                  <Badge
                    key={specialNeed}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-full px-3 py-1"
                  >
                    <span>{specialNeed}</span>
                    <button
                      type="button"
                      onClick={() => removeSpecialNeed(specialNeed)}
                      className="rounded-full p-0.5 hover:bg-black/10"
                      aria-label={`${t('submission.removeSpecialNeed')} ${specialNeed}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.aidUrgency')}
            </Label>
            <Select
              value={formData.aidUrgency}
              onValueChange={(v) => handleChange('aidUrgency', v)}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">{t('submission.high')}</SelectItem>
                <SelectItem value="Medium">{t('submission.medium')}</SelectItem>
                <SelectItem value="Low">{t('submission.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('submission.comments')}</Label>
            <Textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              rows={4}
              maxLength={500}
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d] resize-none"
            />
            <p
              className={`text-xs text-end ${500 - formData.comments.length < 50 ? 'text-red-500' : 'text-gray-400'}`}
              aria-label={t('submission.commentsCharCounter', {
                remaining: 500 - formData.comments.length,
                max: 500,
              })}
            >
              {500 - formData.comments.length} / 500
            </p>
          </div>

          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <Checkbox
              id="consent"
              checked={formData.consentGiven}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, consentGiven: Boolean(checked) }))
              }
              required
              className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d] mt-0.5"
            />
            <Label htmlFor="consent" className="text-sm text-gray-700 font-normal cursor-pointer">
              {t('submission.consent')}
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white"
          disabled={loading}
        >
          {loading ? t('submission.submitting') : t('submission.submit')}
        </Button>
      </form>
    </div>
  );
}

export default CreateSubmission;
