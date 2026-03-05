import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import type { GlobalStatsDocument } from '@/types';

const DEFAULT_STATS: GlobalStatsDocument = {
  submissionsRegistered: 0,
  submissionsAssigned: 0,
  submissionsCompleted: 0,
  peopleHelped: 0,
  activeNgoCount: 0,
  housingAvailable: 0,
};

export default function Impact() {
  const [stats, setStats] = useState<GlobalStatsDocument>(DEFAULT_STATS);

  useEffect(() => {
    return onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
      if (!snapshot.exists()) {
        setStats(DEFAULT_STATS);
        return;
      }

      setStats({
        ...DEFAULT_STATS,
        ...(snapshot.data() as GlobalStatsDocument),
      });
    });
  }, []);

  const completionRate = useMemo(() => {
    if (stats.submissionsRegistered === 0) return 0;
    return Math.round((stats.submissionsCompleted / stats.submissionsRegistered) * 100);
  }, [stats.submissionsCompleted, stats.submissionsRegistered]);

  const assignmentRate = useMemo(() => {
    if (stats.submissionsRegistered === 0) return 0;
    return Math.round((stats.submissionsAssigned / stats.submissionsRegistered) * 100);
  }, [stats.submissionsAssigned, stats.submissionsRegistered]);

  const impactCards = [
    { label: 'Cases registered', value: stats.submissionsRegistered, tone: 'bg-slate-100 text-slate-900' },
    { label: 'Cases assigned', value: stats.submissionsAssigned, tone: 'bg-sky-100 text-sky-900' },
    { label: 'Cases completed', value: stats.submissionsCompleted, tone: 'bg-emerald-100 text-emerald-900' },
    { label: 'People helped', value: stats.peopleHelped, tone: 'bg-amber-100 text-amber-900' },
    { label: 'Active NGOs', value: stats.activeNgoCount, tone: 'bg-violet-100 text-violet-900' },
    { label: 'Housing spots available', value: stats.housingAvailable, tone: 'bg-rose-100 text-rose-900' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <section className="grid gap-6 rounded-[2rem] bg-gradient-to-br from-[#0f766e] via-[#12a89d] to-[#7dd3c7] px-6 py-10 text-white shadow-lg md:grid-cols-[1.4fr_0.9fr] md:px-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
            Public Impact
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Real operational signals from the Nasna support network.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/85">
            These figures show aggregate progress only. They do not expose household addresses,
            personal details, or private case histories.
          </p>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] bg-black/10 p-5 backdrop-blur-sm">
          <div>
            <p className="text-sm text-white/70">Assignment rate</p>
            <p className="text-4xl font-bold">{assignmentRate}%</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Completion rate</p>
            <p className="text-4xl font-bold">{completionRate}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {impactCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-3xl p-6 shadow-sm ${card.tone}`}
          >
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="mt-3 text-4xl font-bold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">Case pipeline</h2>
            <p className="text-sm text-gray-500">
              Aggregate movement from registration to assignment and completion.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Registered', value: stats.submissionsRegistered, color: 'bg-slate-500' },
              { label: 'Assigned', value: stats.submissionsAssigned, color: 'bg-sky-500' },
              { label: 'Completed', value: stats.submissionsCompleted, color: 'bg-emerald-500' },
            ].map((item) => {
              const percentage =
                stats.submissionsRegistered === 0
                  ? 0
                  : Math.min(100, Math.round((item.value / stats.submissionsRegistered) * 100));

              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <span className="text-gray-500">
                      {item.value.toLocaleString()} · {percentage}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">Operational snapshot</h2>
            <p className="text-sm text-gray-500">
              High-level capacity indicators across NGOs and housing resources.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Average people helped per completed case</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.submissionsCompleted === 0
                  ? '0'
                  : (stats.peopleHelped / stats.submissionsCompleted).toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Available housing capacity</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.housingAvailable.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Active NGOs with live cases</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.activeNgoCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
