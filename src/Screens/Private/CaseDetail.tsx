import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

  const handleStatusChange = async (status: 'in_progress' | 'completed' | 'cancelled') => {
    if (!caseId) return;
    const updatedCase = await updateMemberCaseStatus(caseId, status);
    setMemberCase(updatedCase);
  };

  const handleRecordAid = async (notes: string) => {
    if (!caseId) return;
    const updatedCase = await recordMemberAidDelivery(caseId);
    setMemberCase({
      ...updatedCase,
      comments: notes
        ? `${updatedCase.comments ?? ''}\n\nDelivery note: ${notes}`.trim()
        : updatedCase.comments,
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Loading case details...
      </div>
    );
  }

  if (!memberCase) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Case not found.
      </div>
    );
  }

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
            <Link to="/ngo/my-cases">Back to my cases</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Needs</p>
                <p className="text-sm text-gray-900">
                  {memberCase.needs.join(', ') || 'None listed'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Special Needs</p>
                <p className="text-sm text-gray-900">
                  {memberCase.specialNeeds.join(', ') || 'None listed'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Urgency</p>
                <p className="text-sm text-gray-900">{memberCase.aidUrgency}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Household Size</p>
                <p className="text-sm text-gray-900">{memberCase.numberOfPeopleInHousehold}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Comments</p>
                <p className="whitespace-pre-wrap text-sm text-gray-900">
                  {memberCase.comments || 'No comments yet.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <AidDeliveryForm onSubmit={handleRecordAid} />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void handleStatusChange('in_progress')}>
              Mark In Progress
            </Button>
            <Button
              className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
              onClick={() => void handleStatusChange('completed')}
            >
              Mark Completed
            </Button>
            <Button variant="outline" onClick={() => void handleStatusChange('cancelled')}>
              Cancel Case
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseTimeline
              registrationDate={memberCase.registrationDate}
              assignedAt={memberCase.assignedAt}
              updatedAt={null}
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
