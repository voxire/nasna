interface CapacityBarProps {
  capacity: number;
  occupied: number;
}

export default function CapacityBar({ capacity, occupied }: CapacityBarProps) {
  const safeCapacity = Math.max(1, capacity);
  const percentage = Math.min(100, Math.max(0, (occupied / safeCapacity) * 100));

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 85 ? 'bg-rose-500' : percentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {Math.max(0, capacity - occupied)} spots available out of {capacity}
      </p>
    </div>
  );
}
