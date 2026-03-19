import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { SubmissionStatus } from '@/types';

interface CaseStatusBadgeProps {
  status?: SubmissionStatus | string;
  staleFlagged?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  assigned: 'bg-sky-100 text-sky-800 border-sky-200',
  in_progress: 'bg-violet-100 text-violet-800 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function CaseStatusBadge({
  status = 'pending',
  staleFlagged = false,
}: CaseStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        STATUS_STYLES[status] ?? STATUS_STYLES.pending,
      )}
    >
      {t(`submission.status.${status}`, { defaultValue: status.replace('_', ' ') })}
      {staleFlagged ? ` • ${t('submission.stale', { defaultValue: 'stale' })}` : ''}
    </span>
  );
}
