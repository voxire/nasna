import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import type { MemberCase } from '@/services/memberCases';
import { listMemberClaimedCases, updateMemberCaseStatus } from '@/services/memberCases';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import CaseStatusBadge from '@/Components/CaseStatusBadge';

export default function MyCases() {
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold text-gray-800">{t('cases.mine.title')}</h1>
          <p className="text-sm text-gray-500">{t('cases.mine.description')}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/ngo/submissions">{t('cases.mine.backToFeed')}</Link>
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {t('cases.mine.loading')}
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {t('cases.mine.empty')}
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
                <p className="text-sm text-gray-600">
                  {memberCase.comments || t('cases.mine.noNotes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/ngo/cases/${memberCase.id}`}>{t('cases.mine.openCase')}</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'in_progress')}
                  >
                    {t('cases.mine.startWork')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'completed')}
                  >
                    {t('cases.mine.complete')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'cancelled')}
                  >
                    {t('cases.mine.cancel')}
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
