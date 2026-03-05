import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { MemberCase } from '@/services/memberCases';
import { listMemberClaimedCases, updateMemberCaseStatus } from '@/services/memberCases';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import CaseStatusBadge from '@/Components/CaseStatusBadge';

export default function MyCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<MemberCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setCases(await listMemberClaimedCases());
      } catch (error) {
        console.error(error);
        navigate('/ngo/submissions');
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, [navigate]);

  const handleStatusChange = async (
    caseId: string,
    status: 'in_progress' | 'completed' | 'cancelled',
  ) => {
    try {
      const updatedCase = await updateMemberCaseStatus(caseId, status);
      setCases((current) =>
        current.map((memberCase) => (memberCase.id === caseId ? updatedCase : memberCase)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Cases</h1>
          <p className="text-sm text-gray-500">
            Track the cases your organization has claimed and move them through the workflow.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/ngo/submissions">Back to feed</Link>
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading claimed cases...
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          You have not claimed any cases yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cases.map((memberCase) => (
            <Card key={memberCase.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{memberCase.fullName}</CardTitle>
                    <CardDescription>
                      {memberCase.currentGovernorate} • {memberCase.phoneNumber}
                    </CardDescription>
                  </div>
                  <CaseStatusBadge
                    status={memberCase.status}
                    staleFlagged={memberCase.staleFlagged}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{memberCase.comments || 'No notes yet.'}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/ngo/cases/${memberCase.id}`}>Open case</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'in_progress')}
                  >
                    Start work
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'completed')}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'cancelled')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
