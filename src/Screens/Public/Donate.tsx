import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
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

const donationSchema = z.object({
  donorName: z.string().trim().min(2, { message: 'validation.nameTooShort' }),
  donorPhone: z.string().regex(/^\+?[0-9\s\-()\/.]{7,20}$/, { message: 'validation.invalidPhone' }),
  fundingTarget: z.enum(['family', 'center', 'ngo']),
  amountUsd: z.number().int().min(1, { message: 'validation.amountTooLow' }),
  reason: z.string().min(1),
  customReason: z.string().optional(),
});

function Donate() {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [fundingTarget, setFundingTarget] = useState<'family' | 'center' | 'ngo' | undefined>(undefined);
  const [customReason, setCustomReason] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [donorName, setDonorName] = useState('');
  const [amountUsd, setAmountUsd] = useState(25);
  const [loading, setLoading] = useState(false);

  const handleReasonChange = (value: string) => {
    setReason(value);
    if (value !== 'Other') setCustomReason('');
  };

  const handleSubmit = async () => {
    const donationReason = reason === 'Other' ? customReason : reason;
    const validationResult = donationSchema.safeParse({
      donorName,
      donorPhone: phoneNumber,
      fundingTarget,
      amountUsd,
      reason: donationReason,
      customReason: reason === 'Other' ? customReason : undefined,
    });
    if (!validationResult.success) {
      toast.error(t('validation.fixErrors'));
      return;
    }
    setLoading(true);
    try {
      const startCheckout = httpsCallable<
        {
          donorName: string;
          donorPhone: string;
          fundingTarget: 'family' | 'center' | 'ngo';
          amountUsd: number;
          reason: string;
        },
        { sessionId: string; url?: string }
      >(functions, 'createDonationCheckoutSession');

      const { data } = await startCheckout({
        donorName,
        donorPhone: phoneNumber,
        fundingTarget,
        amountUsd,
        reason: donationReason,
      });

      if (!data.url) {
        throw new Error('Missing checkout URL.');
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error('Error adding donation: ', error);
      toast.error(t('donate.checkoutError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{t('donate.title')}</h1>
          <p className="text-gray-600 mb-2">
            {t('donate.description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('donate.yourName')}</Label>
            <Input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder={t('donate.donorNamePlaceholder')}
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('donate.phoneNumber')}</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('donate.phonePlaceholder')}
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('donate.fundingTarget')}</Label>
            <Select value={fundingTarget ?? ''} onValueChange={(value) => setFundingTarget(value as 'family' | 'center' | 'ngo')}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder={t('donate.fundingTargetPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">{t('donate.fundFamily')}</SelectItem>
                <SelectItem value="center">{t('donate.fundCenter')}</SelectItem>
                <SelectItem value="ngo">{t('donate.fundNgo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('donate.amountUsd')}</Label>
            <Input
              type="number"
              min={1}
              value={amountUsd}
              onChange={(e) => setAmountUsd(Number(e.target.value))}
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('donate.reasonLabel')}</Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder={t('donate.reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Support Project">{t('donate.reasonSupport')}</SelectItem>
                <SelectItem value="Help Families">{t('donate.reasonFamilies')}</SelectItem>
                <SelectItem value="Emergency Assistance">{t('donate.reasonEmergency')}</SelectItem>
                <SelectItem value="Other">{t('donate.reasonOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reason === 'Other' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">{t('donate.specifyLabel')}</Label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t('donate.specifyPlaceholder')}
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
          )}

          <Button
            className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white"
            onClick={handleSubmit}
            disabled={
              !reason ||
              !phoneNumber ||
              !donorName ||
              !fundingTarget ||
              amountUsd < 1 ||
              (reason === 'Other' && !customReason) ||
              loading
            }
          >
            {loading ? t('donate.checkoutLoading') : t('donate.checkoutButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Donate;
