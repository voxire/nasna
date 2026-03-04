import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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

const FEEDBACK_TYPES = [
  'General',
  'Bug Report',
  'Feature Request',
  'Complaint',
  'Compliment',
] as const;

const schema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  name: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'Invalid email address',
    ),
  message: z.string().min(10, 'messageTooShort').max(2000, 'messageTooLong'),
});

type FormData = z.infer<typeof schema>;

export default function Feedback() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const message = watch('message') ?? '';

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        type: data.type,
        name: data.name || '',
        email: data.email || '',
        message: data.message,
        read: false,
        createdAt: Timestamp.now(),
      });
      toast.success(t('feedback.successTitle'), { description: t('feedback.successMessage') });
      reset();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('feedback.title')}</h1>
      <p className="text-gray-500 mb-8">{t('feedback.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Type */}
        <div className="space-y-1.5">
          <Label>{t('feedback.typeLabel')}</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('feedback.typePlaceholder') ?? 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`feedback.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label>{t('feedback.nameLabel')}</Label>
          <Input {...register('name')} placeholder={t('feedback.namePlaceholder') ?? ''} />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label>{t('feedback.emailLabel')}</Label>
          <Input
            type="email"
            {...register('email')}
            placeholder={t('feedback.emailPlaceholder') ?? ''}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{t('feedback.messageLabel')}</Label>
            <span className={`text-xs ${message.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
              {message.length} / 2000
            </span>
          </div>
          <Textarea
            {...register('message')}
            placeholder={t('feedback.messagePlaceholder') ?? ''}
            rows={5}
            className={errors.message ? 'border-red-500' : ''}
          />
          {errors.message && (
            <p className="text-xs text-red-500">
              {errors.message.message === 'messageTooShort'
                ? t('feedback.errors.messageTooShort')
                : t('feedback.errors.messageTooLong')}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white"
        >
          {submitting ? t('feedback.submitting') : t('feedback.submit')}
        </Button>
      </form>
    </div>
  );
}
