import { useState } from 'react';
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
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = housingSchema.safeParse(formState);
    if (!result.success) {
      toast.error('Fill all required housing fields.');
      return;
    }

    if (result.data.availableSpots > result.data.capacity) {
      toast.error('Available spots cannot exceed total capacity.');
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

      toast.success('Housing offer submitted for admin review.');
      setFormState(DEFAULT_FORM);
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit housing offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Offer Housing</h1>
        <p className="text-gray-500">
          Submit temporary housing capacity for review before it appears in Nasna operations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Host Name</Label>
            <Input
              value={formState.hostName}
              onChange={(event) =>
                setFormState((current) => ({ ...current, hostName: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Host Phone</Label>
            <Input
              value={formState.hostPhone}
              onChange={(event) =>
                setFormState((current) => ({ ...current, hostPhone: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Area</Label>
            <Input
              value={formState.area}
              onChange={(event) =>
                setFormState((current) => ({ ...current, area: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={formState.address}
              onChange={(event) =>
                setFormState((current) => ({ ...current, address: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total Capacity</Label>
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
            <Label>Available Spots</Label>
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
          <Label>Price Type</Label>
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
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="subsidized">Subsidized</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea
            rows={4}
            value={formState.notes}
            onChange={(event) =>
              setFormState((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Accessibility, household constraints, utilities, or anything intake should know."
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#12a89d] text-white hover:bg-[#0e9088]"
        >
          {submitting ? 'Submitting...' : 'Submit Housing Offer'}
        </Button>
      </form>
    </div>
  );
}
