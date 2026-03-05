import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';

interface AidDeliveryFormProps {
  onSubmit: (notes: string) => Promise<void>;
  disabled?: boolean;
}

export default function AidDeliveryForm({ onSubmit, disabled = false }: AidDeliveryFormProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(notes.trim());
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Aid Delivery Notes</h3>
        <p className="text-sm text-gray-500">
          Record what was delivered before marking this case complete.
        </p>
      </div>
      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Delivered food kits, blankets, water, or any follow-up context..."
        className="min-h-24 bg-white"
        disabled={disabled || loading}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || loading}
        className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
      >
        {loading ? 'Saving...' : 'Save delivery note'}
      </Button>
    </div>
  );
}
