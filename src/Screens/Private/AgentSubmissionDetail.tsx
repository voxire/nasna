import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loader2, ArrowLeft, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { SubmissionDocument, AgeRanges } from '../../types';
import CaseStatusBadge from '@/Components/CaseStatusBadge';
import CaseTimeline from '@/Components/CaseTimeline';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { LEBANON_GOVERNORATE_TRANSLATION_KEYS, type LebanonGovernorate } from '@/lib/governorates';

interface SubmissionWithId extends SubmissionDocument {
  id: string;
}

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0];
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

const AGE_RANGE_KEYS: (keyof AgeRanges)[] = ['0-3', '4-12', '13-18', '19-60', '60+'];

export default function AgentSubmissionDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore((state) => state.profile);
  const [submission, setSubmission] = useState<SubmissionWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!id) {
      setError(t('submission.agent.detail.notFound'));
      setLoading(false);
      return;
    }

    const agentUid = auth.currentUser?.uid;
    if (!agentUid) {
      setError(t('submission.agent.detail.accessDenied'));
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'submissions', id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setError(t('submission.agent.detail.notFound'));
          setLoading(false);
          return;
        }

        const data = snapshot.data() as SubmissionDocument;

        // Allow access if this agent submitted it OR if it belongs to their assigned center
        const isOwnSubmission = data.agent === agentUid;
        const isCenterSubmission = data.centerId != null && data.centerId === profile?.centerId;

        if (!isOwnSubmission && !isCenterSubmission) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        setSubmission({ id: snapshot.id, ...data });
        setLoading(false);
        setError(null);
        setAccessDenied(false);
      },
      (err) => {
        console.error('Error fetching submission:', err.message);
        setError(t('submission.agent.detail.loadError'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-red-500 font-medium">{t('submission.agent.detail.accessDenied')}</p>
        <Button variant="outline" asChild>
          <Link to="/agent/submissions">
            <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('submission.agent.detail.backToSubmissions')}
          </Link>
        </Button>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-red-500 font-medium">{error ?? t('submission.agent.detail.notFound')}</p>
        <Button variant="outline" asChild>
          <Link to="/agent/submissions">
            <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('submission.agent.detail.backToSubmissions')}
          </Link>
        </Button>
      </div>
    );
  }

  const locationLabel =
    submission.locationType === 'center'
      ? t('submission.agent.detail.inCenter')
      : t('submission.agent.detail.withFamily');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/agent/submissions">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{maskName(submission.fullName)}</h1>
            <p className="text-sm text-gray-500">
              {LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                submission.currentGovernorate as LebanonGovernorate
              ]
                ? t(
                    LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                      submission.currentGovernorate as LebanonGovernorate
                    ],
                  )
                : submission.currentGovernorate}
            </p>
          </div>
        </div>
        <CaseStatusBadge status={submission.status} staleFlagged={submission.staleFlagged} />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left column — Details */}
        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#12a89d]">
                {t('submission.agent.detail.personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailField label={t('submission.fullName')} value={maskName(submission.fullName)} />
              <DetailField
                label={t('submission.gender')}
                value={t(`submission.${submission.gender === 'Male' ? 'male' : 'female'}`)}
              />
              <DetailField
                label={t('submission.agent.detail.registrationDate')}
                value={submission.registrationDate?.toDate().toLocaleDateString()}
              />
              {submission.locationType !== 'center' ? (
                <DetailField
                  label={t('submission.agent.detail.household')}
                  value={String(submission.numberOfPeopleInHousehold)}
                />
              ) : null}
              {submission.phoneNumber && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t('submission.phoneNumber')}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-sm text-gray-900">{submission.phoneNumber}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label={t('submission.copyPhone')}
                      onClick={() => {
                        void navigator.clipboard.writeText(submission.phoneNumber);
                        toast.success(t('submission.phoneCopied'));
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#12a89d]">
                {t('submission.agent.detail.locationInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailField
                label={t('submission.agent.detail.governorate')}
                value={
                  LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                    submission.currentGovernorate as LebanonGovernorate
                  ]
                    ? t(
                        LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                          submission.currentGovernorate as LebanonGovernorate
                        ],
                      )
                    : submission.currentGovernorate
                }
              />
              <DetailField
                label={t('submission.previousGovernorate')}
                value={
                  LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                    submission.previousGovernorate as LebanonGovernorate
                  ]
                    ? t(
                        LEBANON_GOVERNORATE_TRANSLATION_KEYS[
                          submission.previousGovernorate as LebanonGovernorate
                        ],
                      )
                    : submission.previousGovernorate
                }
              />
              <DetailField
                label={t('submission.agent.detail.locationType')}
                value={locationLabel}
              />
              {submission.locationType === 'center' && submission.centerId && (
                <DetailField
                  label={t('submission.agent.detail.centerName')}
                  value={submission.centerId}
                />
              )}
            </CardContent>
          </Card>

          {/* Household & Needs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#12a89d]">
                {t('submission.agent.detail.householdNeeds')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Age Ranges Table */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  {t('submission.agent.detail.ageRanges')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGE_KEYS.map((range) => (
                    <div
                      key={range}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5"
                    >
                      <span className="text-xs text-gray-500">{range}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {submission.ageRanges[range]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Needs Badges */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  {t('submission.agent.detail.needs')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {submission.needs.length > 0 ? (
                    submission.needs.map((need) => (
                      <Badge
                        key={need}
                        variant="secondary"
                        className="bg-[#12a89d]/10 text-[#12a89d] border-[#12a89d]/20"
                      >
                        {t(`submission.needs.${need}`, need)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </div>

              {submission.specialNeeds && submission.specialNeeds.length > 0 ? (
                <>
                  <Separator />

                  {/* Special Needs */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      {t('submission.agent.detail.specialNeeds')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {submission.specialNeeds.map((need) => (
                        <Badge
                          key={need}
                          variant="secondary"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          {need}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              <Separator />

              {/* Urgency */}
              <DetailField
                label={t('submission.agent.detail.urgency')}
                value={t(`submission.${submission.aidUrgency.toLowerCase()}`)}
              />

              <Separator />

              {/* Comments */}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('submission.agent.detail.comments')}
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-900 mt-1">
                  {submission.comments || t('submission.agent.detail.noComments')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#12a89d]">
              {t('submission.agent.detail.timeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CaseTimeline
              registrationDate={submission.registrationDate}
              assignedAt={submission.assignedAt}
              updatedAt={submission.updatedAt ?? null}
              status={submission.status}
              aidDelivered={submission.aidDelivered}
              staleFlagged={submission.staleFlagged}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value ?? '-'}</p>
    </div>
  );
}
