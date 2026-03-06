import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { toast } from 'sonner';

const housingSchema = z.object({
  hostName: z.string().trim().min(2),
  hostPhone: z.string().trim().min(7),
  area: z.string().trim().min(2),
  address: z.string().trim().min(5),
  capacity: z.number().int().min(1),
  availableSpots: z.number().int().min(1),
  priceType: z.enum(['free', 'subsidized', 'paid']),
  notes: z.string().trim().max(500),
});

const DEFAULT_FORM = {
  hostName: '',
  hostPhone: '',
  area: '',
  address: '',
  capacity: 1,
  availableSpots: 1,
  priceType: 'free' as const,
  notes: '',
};

export default function OfferHousing() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = housingSchema.safeParse(formState);
    if (!result.success) {
      toast.error(t('housing.offer.errorFields'));
      return;
    }

    if (result.data.availableSpots > result.data.capacity) {
      toast.error(t('housing.offer.errorCapacity'));
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'housing'), {
        ...result.data,
        status: 'pending_review',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success(t('housing.offer.success'));
      setFormState(DEFAULT_FORM);
    } catch (error) {
      console.error('Failed to submit housing offer:', error);
      toast.error(t('housing.offer.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{t('housing.offer.title')}</h1>
        <p className="text-gray-500">
          {t('housing.offer.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.hostName')}</Label>
            <Input
              value={formState.hostName}
              onChange={(event) =>
                setFormState((current) => ({ ...current, hostName: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.hostPhone')}</Label>
            <Input
              value={formState.hostPhone}
              onChange={(event) =>
                setFormState((current) => ({ ...current, hostPhone: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.area')}</Label>
            <Input
              value={formState.area}
              onChange={(event) =>
                setFormState((current) => ({ ...current, area: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.address')}</Label>
            <Input
              value={formState.address}
              onChange={(event) =>
                setFormState((current) => ({ ...current, address: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.totalCapacity')}</Label>
            <Input
              type="number"
              min={1}
              value={formState.capacity}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  capacity: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.availableSpots')}</Label>
            <Input
              type="number"
              min={1}
              value={formState.availableSpots}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  availableSpots: Number(event.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.priceType')}</Label>
          <Select
            value={formState.priceType}
            onValueChange={(value) =>
              setFormState((current) => ({
                ...current,
                priceType: value as typeof current.priceType,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">{t('housing.offer.free')}</SelectItem>
              <SelectItem value="subsidized">{t('housing.offer.subsidized')}</SelectItem>
              <SelectItem value="paid">{t('housing.offer.paid')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.notes')}</Label>
          <Textarea
            rows={4}
            value={formState.notes}
            onChange={(event) =>
              setFormState((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder={t('housing.offer.notesPlaceholder')}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#12a89d] text-white hover:bg-[#0e9088]"
        >
          {submitting ? t('housing.offer.submitting') : t('housing.offer.submit')}
        </Button>
      </form>
    </div>
  );
}
