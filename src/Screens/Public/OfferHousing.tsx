import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
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
  availableFrom: z.string().min(1),
  notes: z.string().trim().max(500),
});

type FormErrors = Partial<Record<keyof typeof housingSchema.shape, string>>;

const DEFAULT_FORM = {
  hostName: '',
  hostPhone: '',
  area: '',
  address: '',
  capacity: 1,
  availableSpots: 1,
  priceType: 'free' as const,
  availableFrom: '',
  notes: '',
};

export default function OfferHousing() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof typeof DEFAULT_FORM>(
    field: K,
    value: (typeof DEFAULT_FORM)[K],
  ) => {
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = housingSchema.safeParse(formState);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (result.data.availableSpots > result.data.capacity) {
      toast.error(t('housing.offer.errorCapacity'));
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const { availableFrom, ...rest } = result.data;
      await addDoc(collection(db, 'housing'), {
        ...rest,
        availableFrom: Timestamp.fromDate(new Date(availableFrom)),
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
        <p className="text-gray-500">{t('housing.offer.description')}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.hostName')}</Label>
            <Input
              value={formState.hostName}
              onChange={(event) => updateField('hostName', event.target.value)}
            />
            {errors.hostName && (
              <p className="mt-1 text-sm text-red-500">{t('validation.nameTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.hostPhone')}</Label>
            <Input
              value={formState.hostPhone}
              onChange={(event) => updateField('hostPhone', event.target.value)}
            />
            {errors.hostPhone && (
              <p className="mt-1 text-sm text-red-500">{t('validation.invalidPhone')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.area')}</Label>
            <Input
              value={formState.area}
              onChange={(event) => updateField('area', event.target.value)}
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-500">{t('validation.fieldTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.address')}</Label>
            <Input
              value={formState.address}
              onChange={(event) => updateField('address', event.target.value)}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{t('validation.addressTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.totalCapacity')}</Label>
            <Input
              type="number"
              min={1}
              value={formState.capacity}
              onChange={(event) => updateField('capacity', Number(event.target.value))}
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-500">{t('validation.minOne')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.availableSpots')}</Label>
            <Input
              type="number"
              min={1}
              value={formState.availableSpots}
              onChange={(event) => updateField('availableSpots', Number(event.target.value))}
            />
            {errors.availableSpots && (
              <p className="mt-1 text-sm text-red-500">{t('validation.minOne')}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.priceType')}</Label>
          <Select
            value={formState.priceType}
            onValueChange={(value) =>
              updateField('priceType', value as (typeof DEFAULT_FORM)['priceType'])
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
          {errors.priceType && (
            <p className="mt-1 text-sm text-red-500">{t('validation.selectOption')}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.availableFrom')}</Label>
          <Input
            type="date"
            value={formState.availableFrom}
            onChange={(event) => updateField('availableFrom', event.target.value)}
          />
          {errors.availableFrom && (
            <p className="mt-1 text-sm text-red-500">{t('validation.dateRequired')}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.notes')}</Label>
          <Textarea
            rows={4}
            value={formState.notes}
            onChange={(event) => updateField('notes', event.target.value)}
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
