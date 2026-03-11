import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import type { HousingAmenity, HousingPriceType, HousingType } from '@/types';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
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

const AMENITIES: HousingAmenity[] = [
  'generator',
  'water',
  'internet',
  'washing_machine',
  'furnished',
  'private_bathroom',
];

const housingSchema = z.object({
  // PII: admin only — collected for admin contact, never returned publicly
  listerName: z.string().trim().min(2),
  // PII: admin only — collected for admin contact, never returned publicly
  listerPhone: z.string().trim().min(7),
  type: z.enum(['apartment', 'room', 'house', 'floor']),
  governorate: z.string().trim().min(2),
  district: z.string().trim().optional(),
  capacity: z.number().int().min(1),
  priceType: z.enum(['free', 'subsidized', 'market_rate']),
  pricePerMonth: z.number().min(0).optional(),
  availableFrom: z.string().min(1),
  availableUntil: z.string().optional(),
  amenities: z.array(
    z.enum([
      'generator',
      'water',
      'internet',
      'washing_machine',
      'furnished',
      'private_bathroom',
    ]),
  ),
  description: z.string().trim().max(500).optional(),
});

type FormData = {
  listerName: string;
  listerPhone: string;
  type: HousingType;
  governorate: string;
  district: string;
  capacity: number;
  priceType: HousingPriceType;
  pricePerMonth: number;
  availableFrom: string;
  availableUntil: string;
  amenities: HousingAmenity[];
  description: string;
};

const DEFAULT_FORM: FormData = {
  listerName: '',
  listerPhone: '',
  type: 'apartment',
  governorate: '',
  district: '',
  capacity: 1,
  priceType: 'free',
  pricePerMonth: 0,
  availableFrom: '',
  availableUntil: '',
  amenities: [],
  description: '',
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

export default function OfferHousing() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleAmenity = (amenity: HousingAmenity) => {
    setFormState((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...formState,
      pricePerMonth: formState.priceType !== 'free' ? formState.pricePerMonth : undefined,
      district: formState.district || undefined,
      availableUntil: formState.availableUntil || undefined,
    };

    const result = housingSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const { availableFrom, availableUntil, ...rest } = result.data;
      await addDoc(collection(db, 'housing'), {
        ...rest,
        listerId: 'anonymous',
        availableFrom: Timestamp.fromDate(new Date(availableFrom)),
        ...(availableUntil
          ? { availableUntil: Timestamp.fromDate(new Date(availableUntil)) }
          : {}),
        status: 'pending_review',
        createdAt: Timestamp.now(),
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
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Lister contact — collected for admin only, never shown publicly */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.listerName')}</Label>
            <Input
              value={formState.listerName}
              onChange={(e) => update('listerName', e.target.value)}
            />
            {errors.listerName && (
              <p className="text-sm text-red-500">{t('validation.nameTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.listerPhone')}</Label>
            <Input
              value={formState.listerPhone}
              onChange={(e) => update('listerPhone', e.target.value)}
            />
            {errors.listerPhone && (
              <p className="text-sm text-red-500">{t('validation.invalidPhone')}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.type')}</Label>
            <Select
              value={formState.type}
              onValueChange={(v) => update('type', v as HousingType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['apartment', 'room', 'house', 'floor'] as HousingType[]).map((ht) => (
                  <SelectItem key={ht} value={ht}>
                    {t(`housing.card.type_${ht}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.capacity')}</Label>
            <Input
              type="number"
              min={1}
              value={formState.capacity}
              onChange={(e) => update('capacity', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.governorate')}</Label>
            <Input
              value={formState.governorate}
              onChange={(e) => update('governorate', e.target.value)}
            />
            {errors.governorate && (
              <p className="text-sm text-red-500">{t('validation.fieldTooShort')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.district')}</Label>
            <Input
              value={formState.district}
              onChange={(e) => update('district', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.priceType')}</Label>
            <Select
              value={formState.priceType}
              onValueChange={(v) => update('priceType', v as HousingPriceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t('housing.card.free')}</SelectItem>
                <SelectItem value="subsidized">{t('housing.card.subsidized')}</SelectItem>
                <SelectItem value="market_rate">{t('housing.card.marketRate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formState.priceType !== 'free' && (
            <div className="space-y-1.5">
              <Label>{t('housing.offer.pricePerMonth')}</Label>
              <Input
                type="number"
                min={0}
                value={formState.pricePerMonth}
                onChange={(e) => update('pricePerMonth', Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t('housing.offer.availableFrom')}</Label>
            <Input
              type="date"
              value={formState.availableFrom}
              onChange={(e) => update('availableFrom', e.target.value)}
            />
            {errors.availableFrom && (
              <p className="text-sm text-red-500">{t('validation.dateRequired')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t('housing.offer.availableUntil')}</Label>
            <Input
              type="date"
              value={formState.availableUntil}
              onChange={(e) => update('availableUntil', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('housing.offer.amenities')}</Label>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3">
            {AMENITIES.map((amenity) => (
              <label key={amenity} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={formState.amenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                {t(`housing.card.amenity_${amenity}`)}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('housing.offer.description')}</Label>
          <Textarea
            rows={4}
            value={formState.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder={t('housing.offer.descriptionPlaceholder')}
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
