import { useTranslation } from 'react-i18next';
import type { Timestamp } from 'firebase/firestore';

interface CaseTimelineProps {
  registrationDate?: Timestamp | Date | string | null;
  assignedAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
  status?: string;
  aidDelivered?: boolean;
  staleFlagged?: boolean;
}

function formatDate(value?: Timestamp | Date | string | null, fallback?: string) {
  if (!value) return fallback ?? '';
  const date =
    typeof value === 'string' ? new Date(value) : value instanceof Date ? value : value.toDate();
  return date.toLocaleString();
}

export default function CaseTimeline({
  registrationDate,
  assignedAt,
  updatedAt,
  status,
  aidDelivered,
  staleFlagged,
}: CaseTimelineProps) {
  const { t } = useTranslation();

  const items = [
    {
      label: t('submission.timeline.caseRegistered'),
      value: formatDate(registrationDate, t('submission.timeline.notYetRecorded')),
    },
    {
      label: t('submission.timeline.assignedToNgo'),
      value: assignedAt
        ? formatDate(assignedAt, t('submission.timeline.notYetRecorded'))
        : t('submission.timeline.notAssigned'),
    },
    {
      label: t('submission.timeline.latestUpdate'),
      value: formatDate(updatedAt, t('submission.timeline.notYetRecorded')),
    },
    {
      label: t('submission.timeline.currentStatus'),
      value: status
        ? t(`submission.status.${status}`, { defaultValue: status.replace('_', ' ') })
        : t('submission.status.pending'),
    },
    {
      label: t('submission.timeline.aidDelivery'),
      value: aidDelivered
        ? t('submission.timeline.markedDelivered')
        : t('submission.timeline.notDeliveredYet'),
    },
    {
      label: t('submission.timeline.staleFlag'),
      value: staleFlagged ? t('submission.timeline.needsReview') : t('submission.timeline.clear'),
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#12a89d]" />
          <div>
            <p className="text-sm font-medium text-gray-800">{item.label}</p>
            <p className="text-sm text-gray-500">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
