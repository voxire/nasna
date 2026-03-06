import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '@/firebase';
import { Link, useNavigate } from 'react-router-dom';
import type { MemberCase } from '@/services/memberCases';
import { claimMemberCase, listMemberPendingCases } from '@/services/memberCases';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import CaseStatusBadge from '@/Components/CaseStatusBadge';
import { useAuthStore } from '@/stores/authStore';

export default function Submissions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState<MemberCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const role = useAuthStore((state) => state.role);
  const loadingAuth = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    const loadCases = async () => {
      if (!initialized || loadingAuth) return;

      if (!auth.currentUser?.uid) {
        navigate('/auth/login');
        return;
      }

      if (role !== 'member') {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pendingCases = await listMemberPendingCases();
        setCases(pendingCases);
      } catch (loadError) {
        console.error(loadError);
        setError(t('cases.feed.error'));
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, [initialized, loadingAuth, navigate, role]);

  const filteredCases = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return cases.filter((memberCase) =>
      normalizedQuery.length === 0
        ? true
        : [memberCase.fullName, memberCase.phoneNumber, memberCase.currentGovernorate].some(
            (field) => (field ?? '').toLowerCase().includes(normalizedQuery),
          ),
    );
  }, [cases, searchQuery]);

  const handleClaimCase = async (caseId: string) => {
    setClaimingId(caseId);
    try {
      await claimMemberCase(caseId);
      setCases((current) => current.filter((memberCase) => memberCase.id !== caseId));
    } catch (claimError) {
      console.error(claimError);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('cases.feed.title')}</h1>
          <p className="text-sm text-gray-500">{t('cases.feed.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/ngo/my-cases">{t('cases.feed.myCases')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/ngo/profile-coverage">{t('cases.feed.coverageProfile')}</Link>
          </Button>
        </div>
      </div>

      <Input
        placeholder={t('cases.feed.searchPlaceholder')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="bg-white"
      />

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {t('cases.feed.loading')}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
          {error}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {t('cases.feed.noResults')}
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
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">{t('cases.feed.urgency')}</p>
                    <p className="font-medium text-gray-900">{memberCase.aidUrgency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t('cases.feed.householdSize')}</p>
                    <p className="font-medium text-gray-900">
                      {memberCase.numberOfPeopleInHousehold}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">{t('cases.feed.needs')}</p>
                    <p className="font-medium text-gray-900">
                      {memberCase.needs.join(', ') || t('cases.feed.noneListed')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/ngo/cases/${memberCase.id}`}>{t('cases.feed.viewDetails')}</Link>
                  </Button>
                  <Button
                    className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                    onClick={() => void handleClaimCase(memberCase.id)}
                    disabled={claimingId === memberCase.id}
                  >
                    {claimingId === memberCase.id
                      ? t('cases.feed.claiming')
                      : t('cases.feed.claimCase')}
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
