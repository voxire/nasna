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

function toLabel(status?: string) {
  return (status ?? 'pending').replace('_', ' ');
}

export default function CaseStatusBadge({
  status = 'pending',
  staleFlagged = false,
}: CaseStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
        STATUS_STYLES[status] ?? STATUS_STYLES.pending,
      )}
    >
      {toLabel(status)}
      {staleFlagged ? ' • stale' : ''}
    </span>
  );
}
