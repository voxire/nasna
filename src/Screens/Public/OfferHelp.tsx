import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, useMapEvents, CircleMarker } from 'react-leaflet';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

const GOVERNORATES = [
  { value: 'Beirut', key: 'home.governorate1' },
  { value: 'Mount Lebanon', key: 'home.governorate2' },
  { value: 'Baabdat', key: 'home.governorate3' },
  { value: 'North Lebanon', key: 'home.governorate4' },
  { value: 'Akkar', key: 'home.governorate5' },
  { value: 'Baalbek', key: 'home.governorate6' },
  { value: 'Beqaa', key: 'home.governorate7' },
  { value: 'Tyre', key: 'home.governorate8' },
  { value: 'Saida', key: 'home.governorate9' },
  { value: 'Nabatiyeh', key: 'home.governorate10' },
];

const OFFER_TYPES = ['Shelter', 'Food', 'Medical', 'Clothing', 'Water', 'Other'] as const;

const schema = z
  .object({
    type: z.enum(OFFER_TYPES),
    phone: z.string().min(1, 'Phone is required'),
    region: z.string().min(1, 'Region is required'),
    neighborhood: z.string().optional(),
    capacity: z.coerce.number().optional(),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'Shelter' && (!data.capacity || data.capacity < 1)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Capacity is required for shelter listings',
        path: ['capacity'],
      });
    }
  });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function MapPinPicker({ onPin }: { onPin: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPin(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function OfferHelp() {
  const { t } = useTranslation();
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  const offerType = watch('type');

  const onSubmit = async (data: FormOutput) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'offers'), {
        type: data.type,
        phone: data.phone,
        region: data.region,
        neighborhood: data.neighborhood || '',
        capacity: data.capacity || null,
        description: data.description || '',
        lat: pin?.lat ?? null,
        lng: pin?.lng ?? null,
        createdAt: Timestamp.now(),
      });
      toast.success(t('offerHelp.successTitle'), { description: t('offerHelp.successMessage') });
      reset();
      setPin(null);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('offerHelp.title')}</h1>
      <p className="text-gray-500 mb-6">{t('offerHelp.subtitle')}</p>

      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">{t('offerHelp.securityNotice')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Type */}
        <div className="space-y-1.5">
          <Label>{t('offerHelp.typeLabel')}</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('offerHelp.typePlaceholder') ?? 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`offerHelp.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label>{t('offerHelp.phoneLabel')}</Label>
          <Input
            {...register('phone')}
            placeholder={t('offerHelp.phonePlaceholder') ?? ''}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Region */}
        <div className="space-y-1.5">
          <Label>{t('offerHelp.regionLabel')}</Label>
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('offerHelp.regionPlaceholder') ?? 'Select region'} />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNORATES.map(({ value, key }) => (
                    <SelectItem key={value} value={value}>
                      {t(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.region && <p className="text-xs text-red-500">{errors.region.message}</p>}
        </div>

        {/* Neighborhood */}
        <div className="space-y-1.5">
          <Label>{t('offerHelp.neighborhoodLabel')}</Label>
          <Input
            {...register('neighborhood')}
            placeholder={t('offerHelp.neighborhoodPlaceholder') ?? ''}
          />
        </div>

        {/* Capacity — Shelter only */}
        {offerType === 'Shelter' && (
          <div className="space-y-1.5">
            <Label>{t('offerHelp.capacityLabel')}</Label>
            <Input
              type="number"
              min={1}
              {...register('capacity')}
              placeholder={t('offerHelp.capacityPlaceholder') ?? ''}
              className={errors.capacity ? 'border-red-500' : ''}
            />
            {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
          </div>
        )}

        {/* Map */}
        <div className="space-y-1.5">
          <Label>{t('offerHelp.mapLabel')}</Label>
          <p className="text-xs text-gray-400">{t('offerHelp.mapHint')}</p>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={[33.8547, 35.8623]}
              zoom={8}
              style={{ height: '280px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapPinPicker onPin={(lat, lng) => setPin({ lat, lng })} />
              {pin && (
                <CircleMarker
                  center={[pin.lat, pin.lng]}
                  radius={8}
                  pathOptions={{ color: '#12a89d', fillColor: '#12a89d', fillOpacity: 0.8 }}
                />
              )}
            </MapContainer>
          </div>
          {pin && (
            <p className="text-xs text-[#12a89d] font-medium">
              {t('offerHelp.mapPinned')}: {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>{t('offerHelp.descriptionLabel')}</Label>
          <Textarea
            {...register('description')}
            placeholder={t('offerHelp.descriptionPlaceholder') ?? ''}
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white"
        >
          {submitting ? t('offerHelp.submitting') : t('offerHelp.submit')}
        </Button>
      </form>
    </div>
  );
}
