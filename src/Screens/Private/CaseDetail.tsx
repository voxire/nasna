import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { MemberCase } from '@/services/memberCases';
import {
  getMemberCaseDetail,
  recordMemberAidDelivery,
  updateMemberCaseStatus,
} from '@/services/memberCases';
import AidDeliveryForm from '@/Components/AidDeliveryForm';
import CaseStatusBadge from '@/Components/CaseStatusBadge';
import CaseTimeline from '@/Components/CaseTimeline';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

export default function CaseDetail() {
  const { t } = useTranslation();
  const { caseId } = useParams();
  const [memberCase, setMemberCase] = useState<MemberCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCase = async () => {
      if (!caseId) return;
      try {
        setMemberCase(await getMemberCaseDetail(caseId));
      } finally {
        setLoading(false);
      }
    };

    void loadCase();
  }, [caseId]);

  const handleStatusChange = async (
    status: 'assigned' | 'in_progress' | 'completed' | 'cancelled',
  ) => {
    if (!caseId) return;
    if (memberCase?.status === status) {
      toast.info(t('cases.statusAlreadyUpdated'));
      return;
    }
    try {
      const updatedCase = await updateMemberCaseStatus(caseId, status);
      setMemberCase(updatedCase);
      toast.success(t('cases.statusUpdatedSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('cases.statusUpdateFailed'));
    }
  };

  const handleRecordAid = async (notes: string) => {
    if (!caseId) return;
    try {
      const updatedCase = await recordMemberAidDelivery(caseId, notes || undefined);
      setMemberCase(updatedCase);
      toast.success(t('cases.detail.aidDeliverySaved'));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('cases.detail.aidDeliveryFailed'));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        {t('cases.detail.loading')}
      </div>
    );
  }

  if (!memberCase) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        {t('cases.detail.notFound')}
      </div>
    );
  }

  const isTerminal = memberCase.status === 'completed' || memberCase.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{memberCase.fullName}</h1>
          <p className="text-sm text-gray-500">
            {memberCase.currentGovernorate} • {memberCase.phoneNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CaseStatusBadge status={memberCase.status} staleFlagged={memberCase.staleFlagged} />
          <Button variant="outline" asChild>
            <Link to="/ngo/my-cases">{t('cases.detail.backToMyCases')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('cases.detail.caseDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('cases.detail.needs')}
                </p>
                <p className="text-sm text-gray-900">
                  {memberCase.needs.join(', ') || t('cases.detail.noneListed')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('cases.detail.specialNeeds')}
                </p>
                <p className="text-sm text-gray-900">
                  {memberCase.specialNeeds.join(', ') || t('cases.detail.noneListed')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('cases.detail.urgency')}
                </p>
                <p className="text-sm text-gray-900">{memberCase.aidUrgency}</p>
              </div>
              {memberCase.locationType !== 'center' ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t('cases.detail.householdSize')}
                  </p>
                  <p className="text-sm text-gray-900">{memberCase.numberOfPeopleInHousehold}</p>
                </div>
              ) : null}
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t('cases.detail.comments')}
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-900">
                  {memberCase.comments || t('cases.detail.noComments')}
                </p>
              </div>
            </CardContent>
          </Card>

          {!isTerminal ? <AidDeliveryForm onSubmit={handleRecordAid} /> : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('cases.detail.noteHistoryTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {memberCase.aidDeliveries.length === 0 ? (
                <p className="text-sm text-gray-500">{t('cases.detail.noDeliveryNotes')}</p>
              ) : (
                memberCase.aidDeliveries
                  .slice()
                  .reverse()
                  .map((note, index) => (
                    <div
                      key={`${note.date ?? 'note'}-${index}`}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          {note.deliveredBy || t('cases.detail.noteAuthorFallback')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {note.date
                            ? new Date(note.date).toLocaleString()
                            : t('cases.detail.noteDateUnknown')}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{note.notes}</p>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {memberCase.status === 'cancelled' ? (
              <Button variant="outline" onClick={() => void handleStatusChange('assigned')}>
                {t('cases.detail.reopenCase')}
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => void handleStatusChange('in_progress')}
              disabled={isTerminal}
            >
              {t('cases.detail.markInProgress')}
            </Button>
            <Button
              className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={() => void handleStatusChange('completed')}
              disabled={isTerminal}
            >
              {t('cases.detail.markCompleted')}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleStatusChange('cancelled')}
              disabled={isTerminal}
            >
              {t('cases.detail.cancelCase')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('cases.detail.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseTimeline
              registrationDate={memberCase.registrationDate}
              assignedAt={memberCase.assignedAt}
              updatedAt={memberCase.updatedAt}
              status={memberCase.status}
              aidDelivered={memberCase.aidDelivered}
              staleFlagged={memberCase.staleFlagged}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
