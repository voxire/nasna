import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
} from 'firebase/firestore';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { db } from '@/firebase';
import type { GlobalStatsDocument, MemberDocument, StatsSnapshotDocument } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';

const DEFAULT_STATS: GlobalStatsDocument = {
  totalRegistered: 0,
  totalAssigned: 0,
  totalCompleted: 0,
  totalPeopleHelped: 0,
  totalPending: 0,
  totalPendingUrgent: 0,
  totalStalePending: 0,
  activeNGOs: 0,
  housingAvailable: 0,
  housingPendingReview: 0,
  housingReservedCapacity: 0,
  byGovernorate: {},
  byNeed: {},
};

export default function ImpactDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<GlobalStatsDocument>(DEFAULT_STATS);
  const [snapshots, setSnapshots] = useState<StatsSnapshotDocument[]>([]);
  const [ngos, setNgos] = useState<(MemberDocument & { id: string })[]>([]);
  const [ngosLoading, setNgosLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
        setStats(
          snapshot.exists()
            ? { ...DEFAULT_STATS, ...(snapshot.data() as GlobalStatsDocument) }
            : DEFAULT_STATS,
        );
      }),
    ];

    // Time-series snapshots (one-time fetch, 90-day window)
    getDocs(query(collection(db, 'stats', 'global', 'snapshots'), orderBy('date'), limit(90)))
      .then((snap) => {
        setSnapshots(snap.docs.map((d) => d.data() as StatsSnapshotDocument));
      })
      .catch(() => {
        toast.error(t('common.error'));
      });

    // NGO breakdown (one-time fetch)
    getDocs(
      query(
        collection(db, 'members'),
        where('role', '==', 'member'),
        where('validated', '==', true),
        orderBy('name'),
        limit(50),
      ),
    )
      .then((snap) => {
        setNgos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as MemberDocument) })));
      })
      .catch(() => {
        toast.error(t('common.error'));
      })
      .finally(() => {
        setNgosLoading(false);
      });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [t]);

  const assignmentRate = useMemo(() => {
    if (stats.totalRegistered === 0) return 0;
    return Math.round((stats.totalAssigned / stats.totalRegistered) * 100);
  }, [stats.totalAssigned, stats.totalRegistered]);

  const completionRate = useMemo(() => {
    if (stats.totalRegistered === 0) return 0;
    return Math.round((stats.totalCompleted / stats.totalRegistered) * 100);
  }, [stats.totalCompleted, stats.totalRegistered]);

  const exportCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    let rows: (string | number)[][];

    if (snapshots.length > 0) {
      rows = [
        [
          'date',
          'totalRegistered',
          'totalCompleted',
          'totalPeopleHelped',
          'totalPending',
          'totalAssigned',
        ],
        ...snapshots.map((s) => [
          s.date,
          s.totalRegistered,
          s.totalCompleted,
          s.totalPeopleHelped,
          s.totalPending,
          s.totalAssigned,
        ]),
      ];
    } else {
      // Fallback: single-row current stats
      rows = [
        [
          'date',
          'totalRegistered',
          'totalCompleted',
          'totalPeopleHelped',
          'totalPending',
          'totalAssigned',
        ],
        [
          today,
          stats.totalRegistered,
          stats.totalCompleted,
          stats.totalPeopleHelped,
          stats.totalPending,
          stats.totalAssigned,
        ],
      ];
    }

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nasna_impact_export_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const topCards = [
    {
      id: 'registered',
      label: t('impact.admin.registeredCases'),
      value: stats.totalRegistered,
      tone: 'bg-slate-100 text-slate-900',
    },
    {
      id: 'assigned',
      label: t('impact.admin.assignedCases'),
      value: stats.totalAssigned,
      tone: 'bg-sky-100 text-sky-900',
    },
    {
      id: 'completed',
      label: t('impact.admin.completedCases'),
      value: stats.totalCompleted,
      tone: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'helped',
      label: t('impact.admin.peopleHelped'),
      value: stats.totalPeopleHelped,
      tone: 'bg-amber-100 text-amber-900',
    },
  ];

  const queueCards = [
    {
      id: 'pendingUrgent',
      label: t('impact.admin.pendingUrgent'),
      value: stats.totalPendingUrgent,
    },
    { id: 'stalePending', label: t('impact.admin.stalePending'), value: stats.totalStalePending },
    {
      id: 'housingReview',
      label: t('impact.admin.housingPendingReview'),
      value: stats.housingPendingReview,
    },
    {
      id: 'reservedHousing',
      label: t('impact.admin.reservedHousing'),
      value: stats.housingReservedCapacity,
    },
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
                  {stats.activeNGOs.toLocaleString()}
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

      <Card>
        <CardHeader>
          <CardTitle>{t('impact.admin.timeSeries')}</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('impact.admin.noSnapshotData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={snapshots.map((s) => ({
                  date: s.date.slice(5), // MM-DD
                  totalRegistered: s.totalRegistered,
                  totalCompleted: s.totalCompleted,
                }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalRegistered"
                  stroke="#64748b"
                  dot={false}
                  name={t('impact.admin.registeredCases')}
                />
                <Line
                  type="monotone"
                  dataKey="totalCompleted"
                  stroke="#10b981"
                  dot={false}
                  name={t('impact.admin.completedCases')}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('impact.admin.ngoBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {ngosLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : ngos.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('impact.public.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pe-4 font-medium">{t('impact.admin.ngoName')}</th>
                    <th className="pb-2 pe-4 font-medium">
                      {t('impact.admin.governoratesCovered')}
                    </th>
                    <th className="pb-2 pe-4 font-medium">{t('impact.admin.currentCaseLoad')}</th>
                    <th className="pb-2 font-medium">{t('impact.admin.aidTypes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ngos.map((ngo) => (
                    <tr key={ngo.id} className="border-b last:border-0">
                      <td className="py-2 pe-4 font-medium">{ngo.name}</td>
                      <td className="py-2 pe-4 text-muted-foreground">
                        {(ngo.coverageGovernorates ?? []).join(', ') || '-'}
                      </td>
                      <td className="py-2 pe-4">{ngo.currentCaseLoad ?? 0}</td>
                      <td className="py-2 text-muted-foreground">
                        {(ngo.aidTypes ?? []).join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
