import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  startAfter,
  type DocumentSnapshot,
} from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import { toast } from 'sonner';
import type { AuditLogEntry, AuditAction } from '../../types';

const PAGE_SIZE = 25;

const ACTION_STYLES: Record<AuditAction, string> = {
  case_assigned: 'bg-blue-100 text-blue-700',
  case_reassigned: 'bg-purple-100 text-purple-700',
  case_status_changed: 'bg-amber-100 text-amber-700',
  member_created: 'bg-green-100 text-green-700',
  member_validated: 'bg-teal-100 text-teal-700',
  member_deleted: 'bg-red-100 text-red-700',
};

function buildMetaSummary(entry: AuditLogEntry): string {
  const { action, meta } = entry;
  if (action === 'case_assigned') {
    return `→ ${meta.toAssigneeName ?? meta.toAssignee ?? ''}`;
  }
  if (action === 'case_reassigned') {
    return `${meta.fromAssignee ?? '?'} → ${meta.toAssigneeName ?? meta.toAssignee ?? ''}`;
  }
  if (action === 'case_status_changed') {
    return `${meta.fromStatus} → ${meta.toStatus}`;
  }
  if (action === 'member_created' || action === 'member_validated' || action === 'member_deleted') {
    return `${meta.memberName ?? ''} (${meta.memberRole ?? ''})`;
  }
  return '';
}

function AuditLog() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const ALL_ACTIONS: AuditAction[] = [
    'case_assigned',
    'case_reassigned',
    'case_status_changed',
    'member_created',
    'member_validated',
    'member_deleted',
  ];

  const fetchPage = async (after: DocumentSnapshot | null = null) => {
    setLoading(true);
    try {
      const base = query(
        collection(db, 'auditLog'),
        orderBy('timestamp', 'desc'),
        ...(after ? [startAfter(after)] : []),
        limit(PAGE_SIZE + 1),
      );
      const snap = await getDocs(base);
      const docs = snap.docs.slice(0, PAGE_SIZE);
      const newEntries = docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AuditLogEntry, 'id'>),
      }));
      setEntries((prev) => (after ? [...prev, ...newEntries] : newEntries));
      setLastDoc(docs[docs.length - 1] ?? null);
      setHasMore(snap.docs.length > PAGE_SIZE);
    } catch {
      toast.error(t('admin.auditLog.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayed =
    actionFilter === 'all' ? entries : entries.filter((e) => e.action === actionFilter);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('admin.auditLog.title')}</h1>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[220px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.auditLog.allActions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.auditLog.allActions')}</SelectItem>
            {ALL_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {t(`admin.auditLog.actions.${a}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t('admin.auditLog.time')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t('admin.auditLog.action')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t('admin.auditLog.actor')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t('admin.auditLog.target')}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t('admin.auditLog.details')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && entries.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-32 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-36" />
                      </td>
                    </tr>
                  ))
                : displayed.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {entry.timestamp?.toDate().toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_STYLES[entry.action] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {t(`admin.auditLog.actions.${entry.action}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {entry.actorName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                        {entry.targetId.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{buildMetaSummary(entry)}</td>
                    </tr>
                  ))}
              {!loading && displayed.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    {t('admin.auditLog.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="px-4 py-3 border-t flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => fetchPage(lastDoc)}
            >
              {loading ? t('admin.auditLog.loading') : t('admin.auditLog.loadMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLog;
