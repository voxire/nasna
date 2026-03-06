import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import type { GlobalStatsDocument, HousingDocument, SubmissionDocument } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

const DEFAULT_STATS: GlobalStatsDocument = {
  submissionsRegistered: 0,
  submissionsAssigned: 0,
  submissionsCompleted: 0,
  peopleHelped: 0,
  activeNgoCount: 0,
  housingAvailable: 0,
};

export default function ImpactDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<GlobalStatsDocument>(DEFAULT_STATS);
  const [pendingUrgentCases, setPendingUrgentCases] = useState(0);
  const [staleCases, setStaleCases] = useState(0);
  const [housingPendingReview, setHousingPendingReview] = useState(0);
  const [reservedHousing, setReservedHousing] = useState(0);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
        setStats(
          snapshot.exists()
            ? { ...DEFAULT_STATS, ...(snapshot.data() as GlobalStatsDocument) }
            : DEFAULT_STATS,
        );
      }),
      onSnapshot(
        query(collection(db, 'submissions'), where('status', '==', 'pending')),
        (snapshot) => {
          const rows = snapshot.docs.map((document) => document.data() as SubmissionDocument);
          setPendingUrgentCases(rows.filter((row) => row.aidUrgency === 'High').length);
          setStaleCases(rows.filter((row) => row.staleFlagged).length);
        },
      ),
      onSnapshot(
        query(collection(db, 'housing'), where('status', '==', 'pending_review')),
        (snapshot) => {
          setHousingPendingReview(snapshot.size);
        },
      ),
      onSnapshot(
        query(collection(db, 'housing'), where('status', '==', 'reserved')),
        (snapshot) => {
          const rows = snapshot.docs.map((document) => document.data() as HousingDocument);
          setReservedHousing(
            rows.reduce((total, row) => total + Number(row.availableSpots ?? 0), 0),
          );
        },
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const assignmentRate = useMemo(() => {
    if (stats.submissionsRegistered === 0) return 0;
    return Math.round((stats.submissionsAssigned / stats.submissionsRegistered) * 100);
  }, [stats.submissionsAssigned, stats.submissionsRegistered]);

  const completionRate = useMemo(() => {
    if (stats.submissionsRegistered === 0) return 0;
    return Math.round((stats.submissionsCompleted / stats.submissionsRegistered) * 100);
  }, [stats.submissionsCompleted, stats.submissionsRegistered]);

  const exportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['submissionsRegistered', stats.submissionsRegistered],
      ['submissionsAssigned', stats.submissionsAssigned],
      ['submissionsCompleted', stats.submissionsCompleted],
      ['peopleHelped', stats.peopleHelped],
      ['activeNgoCount', stats.activeNgoCount],
      ['housingAvailable', stats.housingAvailable],
      ['pendingUrgentCases', pendingUrgentCases],
      ['staleCases', staleCases],
      ['housingPendingReview', housingPendingReview],
      ['reservedHousingSpots', reservedHousing],
      ['assignmentRatePercent', assignmentRate],
      ['completionRatePercent', completionRate],
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nasna-impact-dashboard.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const topCards = [
    {
      id: 'registered',
      label: t('impact.admin.registeredCases'),
      value: stats.submissionsRegistered,
      tone: 'bg-slate-100 text-slate-900',
    },
    {
      id: 'assigned',
      label: t('impact.admin.assignedCases'),
      value: stats.submissionsAssigned,
      tone: 'bg-sky-100 text-sky-900',
    },
    {
      id: 'completed',
      label: t('impact.admin.completedCases'),
      value: stats.submissionsCompleted,
      tone: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'helped',
      label: t('impact.admin.peopleHelped'),
      value: stats.peopleHelped,
      tone: 'bg-amber-100 text-amber-900',
    },
  ];

  const queueCards = [
    { id: 'pendingUrgent', label: t('impact.admin.pendingUrgent'), value: pendingUrgentCases },
    { id: 'stalePending', label: t('impact.admin.stalePending'), value: staleCases },
    {
      id: 'housingReview',
      label: t('impact.admin.housingPendingReview'),
      value: housingPendingReview,
    },
    { id: 'reservedHousing', label: t('impact.admin.reservedHousing'), value: reservedHousing },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('impact.admin.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('impact.admin.description')}</p>
        </div>
        <Button className="bg-[#12a89d] text-white hover:bg-[#0e9088]" onClick={exportCsv}>
          {t('impact.admin.exportCsv')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <Card key={card.id} className={card.tone}>
            <CardContent className="p-6">
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-3 text-4xl font-bold">{card.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('impact.admin.pipelineHealth')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                id: 'assignment',
                label: t('impact.admin.assignmentRate'),
                value: assignmentRate,
                color: 'bg-sky-500',
              },
              {
                id: 'completion',
                label: t('impact.admin.completionRate'),
                value: completionRate,
                color: 'bg-emerald-500',
              },
            ].map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{item.label}</span>
                  <span className="text-gray-500">{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-sm text-gray-500">{t('impact.admin.activeNgos')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.activeNgoCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-sm text-gray-500">{t('impact.admin.housingSpots')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.housingAvailable.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('impact.admin.operationalQueues')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {queueCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
