import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type PieLabelRenderProps,
} from 'recharts';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { useCountUp } from '@/hooks/useCountUp';
import type { GlobalStatsDocument } from '@/types';

const DEFAULT_STATS: GlobalStatsDocument = {
  totalRegistered: 0,
  totalAssigned: 0,
  totalCompleted: 0,
  totalPeopleHelped: 0,
  totalPending: 0,
  activeNGOs: 0,
  housingAvailable: 0,
  byGovernorate: {},
  byNeed: {},
};

export default function Impact() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<GlobalStatsDocument>(DEFAULT_STATS);

  useEffect(() => {
    return onSnapshot(
      doc(db, 'stats', 'global'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setStats(DEFAULT_STATS);
          return;
        }
        setStats({ ...DEFAULT_STATS, ...(snapshot.data() as GlobalStatsDocument) });
      },
      () => {
        toast.error(t('common.error'));
      },
    );
  }, [t]);

  const animatedRegistered = useCountUp(stats.totalRegistered);
  const animatedCompleted = useCountUp(stats.totalCompleted);
  const animatedPeopleHelped = useCountUp(stats.totalPeopleHelped);
  const animatedActiveNGOs = useCountUp(stats.activeNGOs);

  const completionRate = useMemo(() => {
    if (stats.totalRegistered === 0) return 0;
    return Math.round((stats.totalCompleted / stats.totalRegistered) * 100);
  }, [stats.totalCompleted, stats.totalRegistered]);

  const assignmentRate = useMemo(() => {
    if (stats.totalRegistered === 0) return 0;
    return Math.round((stats.totalAssigned / stats.totalRegistered) * 100);
  }, [stats.totalAssigned, stats.totalRegistered]);

  const impactCards = [
    {
      id: 'registered',
      label: t('impact.public.casesRegistered'),
      value: animatedRegistered.toLocaleString(i18n.language),
      tone: 'bg-slate-100 text-slate-900',
    },
    {
      id: 'assigned',
      label: t('impact.public.casesAssigned'),
      value: stats.totalAssigned.toLocaleString(i18n.language),
      tone: 'bg-sky-100 text-sky-900',
    },
    {
      id: 'completed',
      label: t('impact.public.casesCompleted'),
      value: animatedCompleted.toLocaleString(i18n.language),
      tone: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'people',
      label: t('impact.public.peopleHelped'),
      value: animatedPeopleHelped.toLocaleString(i18n.language),
      tone: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'ngos',
      label: t('impact.public.activeNgos'),
      value: animatedActiveNGOs.toLocaleString(i18n.language),
      tone: 'bg-violet-100 text-violet-900',
    },
    {
      id: 'housing',
      label: t('impact.public.housingSpots'),
      value: stats.housingAvailable.toLocaleString(i18n.language),
      tone: 'bg-rose-100 text-rose-900',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <section className="grid gap-6 rounded-[2rem] bg-gradient-to-br from-[#0f766e] via-[#12a89d] to-[#7dd3c7] px-6 py-10 text-white shadow-lg md:grid-cols-[1.4fr_0.9fr] md:px-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
            {t('impact.public.eyebrow')}
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            {t('impact.public.headline')}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/85">
            {t('impact.public.privacyNote')}
          </p>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] bg-black/10 p-5 backdrop-blur-sm">
          <div>
            <p className="text-sm text-white/70">{t('impact.public.assignmentRate')}</p>
            <p className="text-4xl font-bold">{assignmentRate}%</p>
          </div>
          <div>
            <p className="text-sm text-white/70">{t('impact.public.completionRate')}</p>
            <p className="text-4xl font-bold">{completionRate}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {impactCards.map((card) => (
          <div key={card.id} className={`rounded-3xl p-6 shadow-sm ${card.tone}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="mt-3 text-4xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('impact.public.pipelineTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('impact.public.pipelineDescription')}</p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'reg',
                label: t('impact.public.registered'),
                value: stats.totalRegistered,
                color: 'bg-slate-500',
              },
              {
                id: 'asgn',
                label: t('impact.public.assigned'),
                value: stats.totalAssigned,
                color: 'bg-sky-500',
              },
              {
                id: 'done',
                label: t('impact.public.completed'),
                value: stats.totalCompleted,
                color: 'bg-emerald-500',
              },
            ].map((item) => {
              const percentage =
                stats.totalRegistered === 0
                  ? 0
                  : Math.min(100, Math.round((item.value / stats.totalRegistered) * 100));

              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <span className="text-gray-500">
                      {item.value.toLocaleString(i18n.language)} · {percentage}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('impact.public.snapshotTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('impact.public.snapshotDescription')}</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">{t('impact.public.avgPeopleHelped')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.totalCompleted === 0
                  ? '0'
                  : (stats.totalPeopleHelped / stats.totalCompleted).toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">{t('impact.public.availableHousing')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.housingAvailable.toLocaleString(i18n.language)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">{t('impact.public.activeNgosLive')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.activeNGOs.toLocaleString(i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Needs Breakdown */}
      {Object.keys(stats.byNeed).length > 0 ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-semibold text-gray-900">
            {t('impact.public.needsBreakdown')}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={Object.entries(stats.byNeed)
                .sort(([, a], [, b]) => b - a)
                .map(([key, value]) => ({
                  name: t(`submission.needs.${key}`, { defaultValue: key }),
                  value,
                }))}
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#12a89d" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            {t('impact.public.needsBreakdown')}
          </h2>
          <p className="text-sm text-gray-400">{t('impact.public.noData')}</p>
        </section>
      )}

      {/* Coverage by Area */}
      {Object.keys(stats.byGovernorate).length > 0 ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-semibold text-gray-900">
            {t('impact.public.coverageByArea')}
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={Object.entries(stats.byGovernorate)
                .sort(([, a], [, b]) => b - a)
                .map(([key, value]) => ({
                  name: key.length > 12 ? `${key.slice(0, 12)}…` : key,
                  value,
                }))}
              margin={{ top: 0, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0e9088" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            {t('impact.public.coverageByArea')}
          </h2>
          <p className="text-sm text-gray-400">{t('impact.public.noData')}</p>
        </section>
      )}

      {/* Status Split */}
      {stats.totalPending + stats.totalAssigned + stats.totalCompleted > 0 ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-semibold text-gray-900">
            {t('impact.public.statusSplit')}
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: t('impact.public.pending'),
                    value: stats.totalPending,
                    fill: '#94a3b8',
                  },
                  {
                    name: t('impact.public.assigned'),
                    value: stats.totalAssigned,
                    fill: '#38bdf8',
                  },
                  {
                    name: t('impact.public.completed'),
                    value: stats.totalCompleted,
                    fill: '#34d399',
                  },
                ].filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: PieLabelRenderProps) =>
                  `${name ?? ''} ${Math.round((percent ?? 0) * 100)}%`
                }
              >
                {[{ fill: '#94a3b8' }, { fill: '#38bdf8' }, { fill: '#34d399' }].map(
                  (entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ),
                )}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            {t('impact.public.statusSplit')}
          </h2>
          <p className="text-sm text-gray-400">{t('impact.public.noData')}</p>
        </section>
      )}
    </div>
  );
}
