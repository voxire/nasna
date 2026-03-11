interface CapacityBarProps {
  totalCapacity: number;
  currentOccupancy: number;
  isActive: boolean;
}

export default function CapacityBar({
  totalCapacity,
  currentOccupancy,
  isActive,
}: CapacityBarProps) {
  const safeCapacity = Math.max(1, totalCapacity);
  const percentage = Math.min(100, Math.max(0, (currentOccupancy / safeCapacity) * 100));

  const barColor = !isActive
    ? 'bg-gray-300'
    : percentage > 90
      ? 'bg-rose-500'
      : percentage > 75
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {currentOccupancy}/{totalCapacity}
      </p>
    </div>
  );
}
