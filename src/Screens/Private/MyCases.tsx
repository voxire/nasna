import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { MemberCase } from '@/services/memberCases';
import { listMemberClaimedCases, updateMemberCaseStatus } from '@/services/memberCases';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import CaseStatusBadge from '@/Components/CaseStatusBadge';

type StatusTab = 'all' | 'in_progress' | 'assigned' | 'completed' | 'cancelled';

export default function MyCases() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState<MemberCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');

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
    status: 'assigned' | 'in_progress' | 'completed' | 'cancelled',
  ) => {
    try {
      const updatedCase = await updateMemberCaseStatus(caseId, status);
      setCases((current) =>
        current.map((memberCase) => (memberCase.id === caseId ? updatedCase : memberCase)),
      );
    } catch (error) {
      console.error(error);
      toast.error(t('cases.statusUpdateFailed'));
    }
  };

  const stats = useMemo(
    () => ({
      active: cases.filter((c) => c.status === 'assigned' || c.status === 'in_progress').length,
      completed: cases.filter((c) => c.status === 'completed').length,
      cancelled: cases.filter((c) => c.status === 'cancelled').length,
    }),
    [cases],
  );

  const filteredCases = useMemo(
    () => (activeTab === 'all' ? cases : cases.filter((c) => c.status === activeTab)),
    [cases, activeTab],
  );

  const tabs: Array<{ key: StatusTab; label: string }> = [
    { key: 'all', label: t('cases.mine.tabs.all') },
    { key: 'assigned', label: t('cases.mine.tabs.assigned') },
    { key: 'in_progress', label: t('cases.mine.tabs.inProgress') },
    { key: 'completed', label: t('cases.mine.tabs.completed') },
    { key: 'cancelled', label: t('cases.mine.tabs.cancelled') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('cases.mine.title')}</h1>
          <p className="text-sm text-gray-500">{t('cases.mine.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#12a89d] text-white hover:bg-[#0e9088]" asChild>
            <Link to="/ngo/add-case">{t('cases.feed.addCase')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/ngo/submissions">{t('cases.mine.backToFeed')}</Link>
          </Button>
        </div>
      </div>

      {!loading && cases.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[#12a89d]">{stats.active}</p>
            <p className="text-xs text-gray-500">{t('cases.mine.stats.active')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">{t('cases.mine.stats.completed')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-rose-500">{stats.cancelled}</p>
            <p className="text-xs text-gray-500">{t('cases.mine.stats.cancelled')}</p>
          </div>
        </div>
      ) : null}

      {!loading && cases.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              className={activeTab === tab.key ? 'bg-[#12a89d] text-white hover:bg-[#0e9088]' : ''}
              onClick={() => setActiveTab(tab.key)}
              size="sm"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {t('cases.mine.loading')}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {cases.length === 0 ? t('cases.mine.empty') : t('cases.mine.noFilterResults')}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCases.map((memberCase) => (
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
                {memberCase.status === 'cancelled' ? (
                  <p className="text-sm font-medium text-rose-700">
                    {t('cases.mine.cancelledNote')}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/ngo/cases/${memberCase.id}`}>{t('cases.mine.openCase')}</Link>
                  </Button>
                  {memberCase.status === 'cancelled' ? (
                    <Button
                      variant="outline"
                      onClick={() => void handleStatusChange(memberCase.id, 'assigned')}
                    >
                      {t('cases.mine.reopen')}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'in_progress')}
                    disabled={
                      memberCase.status === 'completed' || memberCase.status === 'cancelled'
                    }
                  >
                    {t('cases.mine.startWork')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'completed')}
                    disabled={
                      memberCase.status === 'completed' || memberCase.status === 'cancelled'
                    }
                  >
                    {t('cases.mine.complete')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleStatusChange(memberCase.id, 'cancelled')}
                    disabled={
                      memberCase.status === 'completed' || memberCase.status === 'cancelled'
                    }
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
