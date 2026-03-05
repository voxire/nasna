import { useState } from 'react';
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

function Donate() {
  const [reason, setReason] = useState('');
  const [fundingTarget, setFundingTarget] = useState<'family' | 'center' | 'ngo' | ''>('');
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
    if (!reason || !phoneNumber || !donorName || !fundingTarget || amountUsd < 1) return;
    const donationReason = reason === 'Other' ? customReason : reason;
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
      toast.error('There was an error starting checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Donate</h1>
          <p className="text-gray-600 mb-2">
            Choose where you want funds directed, enter the amount, and continue through secure
            checkout.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Your Name</Label>
            <Input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Donor name"
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+123 456 7890"
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Funding Target</Label>
            <Select value={fundingTarget} onValueChange={(value) => setFundingTarget(value as typeof fundingTarget)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Choose who to fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Fund a Family</SelectItem>
                <SelectItem value="center">Fund a Center</SelectItem>
                <SelectItem value="ngo">Fund an NGO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Amount (USD)</Label>
            <Input
              type="number"
              min={1}
              value={amountUsd}
              onChange={(e) => setAmountUsd(Number(e.target.value))}
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Reason for Donation</Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Select the reason for your donation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Support Project">Support Project</SelectItem>
                <SelectItem value="Help Families">Help Families</SelectItem>
                <SelectItem value="Emergency Assistance">Emergency Assistance</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reason === 'Other' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Please specify</Label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason"
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
            {loading ? 'Starting Checkout...' : 'Continue to Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Donate;
