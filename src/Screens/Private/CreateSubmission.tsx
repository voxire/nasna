import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { AgeRanges, AidUrgency, Gender } from '../../types';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import AidTypeCheckboxGrid from '@/Components/AidTypeCheckboxGrid';

const submissionSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number'),
  emailAddress: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email().optional(),
  ),
  gender: z.enum(['Male', 'Female']),
  currentGovernorate: z.string().min(1),
  previousGovernorate: z.string().min(1),
  street: z.string().min(1),
  building: z.string().min(1),
  floor: z.string().min(1),
  city: z.string().min(1),
  ageRanges: z.object({
    '0-3': z.number().min(0),
    '4-12': z.number().min(0),
    '13-18': z.number().min(0),
    '19-60': z.number().min(0),
    '60+': z.number().min(0),
  }),
  specialNeeds: z.array(z.string()),
  needs: z.array(z.string()),
  aidUrgency: z.enum(['High', 'Medium', 'Low']),
  consentGiven: z.literal(true, { error: 'Consent is required' }),
  comments: z.string(),
  numberOfPeopleInHousehold: z.number().min(0),
});

interface SubmissionFormData {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  gender: Gender | '';
  currentGovernorate: string;
  previousGovernorate: string;
  street: string;
  building: string;
  floor: string;
  city: string;
  ageRanges: AgeRanges;
  specialNeeds: string[];
  needs: string[];
  aidUrgency: AidUrgency | '';
  consentGiven: boolean;
  comments: string;
  numberOfPeopleInHousehold: number;
}

const defaultFormData: SubmissionFormData = {
  fullName: '',
  phoneNumber: '',
  emailAddress: '',
  gender: '',
  currentGovernorate: '',
  previousGovernorate: '',
  street: '',
  building: '',
  floor: '',
  city: '',
  ageRanges: { '0-3': 0, '4-12': 0, '13-18': 0, '19-60': 0, '60+': 0 },
  specialNeeds: [],
  needs: [],
  aidUrgency: '',
  consentGiven: false,
  comments: '',
  numberOfPeopleInHousehold: 0,
};

function CreateSubmission() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>(defaultFormData);
  const [specialNeedInput, setSpecialNeedInput] = useState('');

  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!userUid) navigate('/auth/login');
  }, [userUid, navigate]);

  if (!user?.validated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 text-center">
        <h2 className="text-xl font-semibold">{t('submission.accountBeingVerified')}</h2>
      </div>
    );
  }

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSpecialNeed = () => {
    const normalized = specialNeedInput.trim();
    if (!normalized) return;

    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(normalized)
        ? prev.specialNeeds
        : [...prev.specialNeeds, normalized],
    }));
    setSpecialNeedInput('');
  };

  const removeSpecialNeed = (specialNeed: string) => {
    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((item) => item !== specialNeed),
    }));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = submissionSchema.safeParse(formData);
    if (!result.success) {
      const consentError = result.error.issues.find((i) => i.path.includes('consentGiven'));
      if (consentError) {
        toast.error(t('submission.consentRequired'));
      } else {
        toast.error(t('submission.validationError'));
      }
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        ...result.data,
        registrationDate: Timestamp.fromDate(new Date()),
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: auth.currentUser?.uid,
      });
      toast.success(t('submission.success'));
      setFormData(defaultFormData);
      setSpecialNeedInput('');
    } catch {
      toast.error(t('submission.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto my-5 px-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{t('submission.title')}</h1>
        <Button
          variant="outline"
          className="border-gray-300 text-gray-600"
          onClick={() => navigate('/agent/submissions')}
        >
          {t('submission.mySubmissions')}
        </Button>
      </div>

      <form onSubmit={handleAddMember} className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
            {t('submission.personalInformation')}
          </h2>
          {[
            { name: 'fullName', label: t('submission.fullName') },
            { name: 'phoneNumber', label: t('submission.phoneNumber') },
            { name: 'emailAddress', label: t('submission.emailAddress'), type: 'email' },
          ].map(({ name, label, type }) => (
            <div key={name} className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">{label}</Label>
              <Input
                type={type ?? 'text'}
                value={String(formData[name as keyof SubmissionFormData] ?? '')}
                onChange={(e) => handleChange(name, e.target.value)}
                required
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('submission.gender')}</Label>
            <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">{t('submission.male')}</SelectItem>
                <SelectItem value="Female">{t('submission.female')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
            {t('submission.locationDetails')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'currentGovernorate', label: t('submission.currentGovernorate') },
              { name: 'previousGovernorate', label: t('submission.previousGovernorate') },
              { name: 'street', label: t('submission.street') },
              { name: 'building', label: t('submission.building') },
              { name: 'floor', label: t('submission.floor') },
              { name: 'city', label: t('submission.city') },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">{label}</Label>
                <Input
                  value={String(formData[name as keyof SubmissionFormData] ?? '')}
                  onChange={(e) => handleChange(name, e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
            {t('submission.householdAndNeeds')}
          </h2>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.numberOfPeopleInHousehold')}
            </Label>
            <Input
              type="number"
              value={formData.numberOfPeopleInHousehold}
              onChange={(e) => handleChange('numberOfPeopleInHousehold', Number(e.target.value))}
              required
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(formData.ageRanges) as Array<keyof AgeRanges>).map((range) => (
              <div key={range} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">{`${range} (${t('submission.numberOfMembers')})`}</Label>
                <Input
                  type="number"
                  value={formData.ageRanges[range]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ageRanges: { ...prev.ageRanges, [range]: Number(e.target.value) },
                    }))
                  }
                  className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.needsTitle')}
            </Label>
            <AidTypeCheckboxGrid
              selected={formData.needs}
              onChange={(selected) => setFormData((prev) => ({ ...prev, needs: selected }))}
              i18nPrefix="submission.needs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.specialNeedsTitle')}
            </Label>
            <div className="flex gap-2">
              <Input
                value={specialNeedInput}
                onChange={(e) => setSpecialNeedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSpecialNeed();
                  }
                }}
                placeholder={t('submission.specialNeedsPlaceholder')}
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
              <Button type="button" variant="outline" onClick={addSpecialNeed}>
                {t('submission.addSpecialNeed')}
              </Button>
            </div>
            <p className="text-xs text-gray-500">{t('submission.specialNeedsHint')}</p>
            {formData.specialNeeds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.specialNeeds.map((specialNeed) => (
                  <Badge
                    key={specialNeed}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-full px-3 py-1"
                  >
                    <span>{specialNeed}</span>
                    <button
                      type="button"
                      onClick={() => removeSpecialNeed(specialNeed)}
                      className="rounded-full p-0.5 hover:bg-black/10"
                      aria-label={`${t('submission.removeSpecialNeed')} ${specialNeed}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t('submission.aidUrgency')}
            </Label>
            <Select
              value={formData.aidUrgency}
              onValueChange={(v) => handleChange('aidUrgency', v)}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">{t('submission.high')}</SelectItem>
                <SelectItem value="Medium">{t('submission.medium')}</SelectItem>
                <SelectItem value="Low">{t('submission.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('submission.comments')}</Label>
            <Textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              rows={4}
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d] resize-none"
            />
          </div>

          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <Checkbox
              id="consent"
              checked={formData.consentGiven}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, consentGiven: Boolean(checked) }))
              }
              required
              className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d] mt-0.5"
            />
            <Label htmlFor="consent" className="text-sm text-gray-700 font-normal cursor-pointer">
              {t('submission.consent')}
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white"
          disabled={loading}
        >
          {loading ? t('submission.submitting') : t('submission.submit')}
        </Button>
      </form>
    </div>
  );
}

export default CreateSubmission;
