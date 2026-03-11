import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { MemberCase } from '@/services/memberCases';
import { claimMemberCase, listMemberPendingCases } from '@/services/memberCases';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
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
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const ALL_NEEDS = ['food', 'water', 'shelter', 'hygiene', 'medical', 'clothing'] as const;

  const toggleNeed = (need: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );
  };
  const currentUser = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const loadingAuth = useAuthStore((state) => state.loading);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    const loadCases = async () => {
      if (!initialized || loadingAuth || (currentUser && profileLoading)) return;

      if (!currentUser?.uid) {
        navigate('/auth/login');
        return;
      }

      if (!role) {
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
  }, [currentUser, initialized, loadingAuth, navigate, profileLoading, role]);

  const filteredCases = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return cases.filter((memberCase) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [memberCase.fullName, memberCase.currentGovernorate].some((field) =>
          (field ?? '').toLowerCase().includes(normalizedQuery),
        );

      const matchesNeeds =
        selectedNeeds.length === 0 ||
        selectedNeeds.some((need) => memberCase.needs.some((n) => n.toLowerCase().includes(need)));

      return matchesSearch && matchesNeeds;
    });
  }, [cases, searchQuery, selectedNeeds]);

  const handleClaimCase = async (caseId: string) => {
    setClaimingId(caseId);
    try {
      await claimMemberCase(caseId);
      setCases((current) => current.filter((memberCase) => memberCase.id !== caseId));
    } catch (claimError) {
      console.error(claimError);
      toast.error(t('cases.claimFailed'));
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
          <Button className="bg-[#12a89d] text-white hover:bg-[#0e9088]" asChild>
            <Link to="/ngo/add-case">{t('cases.feed.addCase')}</Link>
          </Button>
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-gray-600">{t('cases.feed.filterByNeed')}</span>
        {ALL_NEEDS.map((need) => (
          <label key={need} className="flex cursor-pointer items-center gap-1.5">
            <Checkbox
              checked={selectedNeeds.includes(need)}
              onCheckedChange={() => toggleNeed(need)}
              className="data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d]"
            />
            <span className="text-sm text-gray-700">{t(`submission.needs.${need}`)}</span>
          </label>
        ))}
        {selectedNeeds.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setSelectedNeeds([])}>
            {t('cases.feed.clearFilter')}
          </Button>
        ) : null}
      </div>

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
                  {memberCase.locationType !== 'center' ? (
                    <div>
                      <p className="text-gray-500">{t('cases.feed.householdSize')}</p>
                      <p className="font-medium text-gray-900">
                        {memberCase.numberOfPeopleInHousehold}
                      </p>
                    </div>
                  ) : null}
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
