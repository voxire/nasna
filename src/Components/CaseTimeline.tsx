import type { Timestamp } from 'firebase/firestore';

interface CaseTimelineProps {
  registrationDate?: Timestamp | Date | string | null;
  assignedAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
  status?: string;
  aidDelivered?: boolean;
  staleFlagged?: boolean;
}

function formatDate(value?: Timestamp | Date | string | null) {
  if (!value) return 'Not yet recorded';
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
  const items = [
    { label: 'Case registered', value: formatDate(registrationDate) },
    { label: 'Assigned to NGO', value: assignedAt ? formatDate(assignedAt) : 'Not assigned' },
    { label: 'Latest update', value: formatDate(updatedAt) },
    { label: 'Current status', value: status ? status.replace('_', ' ') : 'pending' },
    { label: 'Aid delivery', value: aidDelivered ? 'Marked delivered' : 'Not delivered yet' },
    { label: 'Stale flag', value: staleFlagged ? 'Needs review' : 'Clear' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#12a89d]" />
          <div>
            <p className="text-sm font-medium text-gray-800">{item.label}</p>
            <p className="text-sm text-gray-500 capitalize">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
