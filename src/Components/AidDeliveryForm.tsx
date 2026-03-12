import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';

interface AidDeliveryFormProps {
  onSubmit: (notes: string) => Promise<void>;
  disabled?: boolean;
}

export default function AidDeliveryForm({ onSubmit, disabled = false }: AidDeliveryFormProps) {
  const { t } = useTranslation();
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
        <h3 className="text-sm font-semibold text-gray-800">{t('cases.detail.notesTitle')}</h3>
        <p className="text-sm text-gray-500">{t('cases.detail.notesDescription')}</p>
      </div>
      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder={t('cases.detail.notesPlaceholder')}
        className="min-h-24 bg-white"
        disabled={disabled || loading}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || loading || notes.trim().length === 0}
        className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
      >
        {loading ? t('cases.detail.notesSaving') : t('cases.detail.notesSubmit')}
      </Button>
    </div>
  );
}
