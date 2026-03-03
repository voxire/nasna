import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
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
  const [customReason, setCustomReason] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReasonChange = (value: string) => {
    setReason(value);
    if (value !== 'Other') setCustomReason('');
  };

  const handleSubmit = async () => {
    if (!reason || !phoneNumber) return;
    const donationReason = reason === 'Other' ? customReason : reason;
    setLoading(true);
    try {
      await addDoc(collection(db, 'donations'), {
        reason: donationReason,
        phone: phoneNumber,
        timestamp: new Date(),
      });
      setReason('');
      setCustomReason('');
      setPhoneNumber('');
      toast.success('Thank you for your donation!');
    } catch (error) {
      console.error('Error adding donation: ', error);
      toast.error('There was an error processing your donation. Please try again.');
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
            Your donations support our project and will help families in need. Some funds will be
            directly allocated to assist those in critical situations.
          </p>
          <p className="text-gray-600">
            To donate, send the amount via whish money to: <strong className="text-[#12a89d]">+123 456 7890</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-5">
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
            disabled={!reason || !phoneNumber || (reason === 'Other' && !customReason) || loading}
          >
            {loading ? 'Submitting...' : 'Submit Donation'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Donate;
