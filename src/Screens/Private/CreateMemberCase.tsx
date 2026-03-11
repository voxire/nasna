import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { z } from 'zod';
import { db } from '@/firebase';
import type { AgeRanges, AidUrgency, CenterDocument, Gender, LocationType } from '@/types';
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
import CenterPicker from '@/Components/CenterPicker';
import { createMemberCase } from '@/services/memberCases';

const baseSubmissionSchema = z.object({
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
  locationType: z.enum(['with_family', 'center']),
  centerId: z.string(),
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
  comments: z.string().max(500),
  numberOfPeopleInHousehold: z.number().min(0),
});

const submissionSchema = baseSubmissionSchema.superRefine((value, context) => {
  if (value.locationType === 'center' && !value.centerId.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['centerId'],
      message: 'Center selection is required',
    });
  }
});

interface SubmissionFormData {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  gender: Gender | '';
  locationType: LocationType;
  centerId: string;
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
  locationType: 'with_family',
  centerId: '',
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

function CreateMemberCase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>(defaultFormData);
  const [specialNeedInput, setSpecialNeedInput] = useState('');
  const [centers, setCenters] = useState<Array<CenterDocument & { id: string }>>([]);

  useEffect(() => {
    const centerQuery = query(collection(db, 'centers'), where('active', '==', true));

    return onSnapshot(centerQuery, (snapshot) => {
      setCenters(
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as CenterDocument),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
    });
  }, []);

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedCenter = centers.find((center) => center.id === formData.centerId);
  const isCenterCase = formData.locationType === 'center';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload =
      isCenterCase && selectedCenter
        ? {
            ...formData,
            currentGovernorate: selectedCenter.governorate,
            city: selectedCenter.city,
            street: selectedCenter.address,
            building: selectedCenter.name,
            floor: 'Center intake',
          }
        : formData;

    const result = submissionSchema.safeParse(payload);
    if (!result.success) {
      const consentError = result.error.issues.find((i) => i.path.includes('consentGiven'));
      const centerError = result.error.issues.find((i) => i.path.includes('centerId'));
      if (consentError) {
        toast.error(t('submission.consentRequired'));
      } else if (centerError) {
        toast.error(t('submission.centerRequired'));
      } else {
        toast.error(t('submission.validationError'));
      }
      return;
    }

    setLoading(true);
    try {
      await createMemberCase({
        ...result.data,
        emailAddress: result.data.emailAddress ?? '',
      });
      toast.success(t('cases.create.success'));
      navigate('/ngo/my-cases');
    } catch (error) {
      console.error(error);
      toast.error(t('cases.create.error'));
    } finally {
      setLoading(false);
    }
  };

  const renderLabel = (label: string, required = false) => (
    <Label className="text-sm font-medium text-gray-700">
      {label}
      {required ? <span className="ml-1 text-red-600">*</span> : null}
    </Label>
  );

  return (
    <div className="max-w-[600px] mx-auto my-5 px-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{t('cases.create.title')}</h1>
        <Button variant="outline" onClick={() => navigate('/ngo/my-cases')}>
          {t('cases.feed.myCases')}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              {renderLabel(label, name !== 'emailAddress')}
              <Input
                type={type ?? 'text'}
                value={String(formData[name as keyof SubmissionFormData] ?? '')}
                onChange={(e) => handleChange(name, e.target.value)}
                required={name !== 'emailAddress'}
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
          ))}
          <div className="space-y-1.5">
            {renderLabel(t('submission.gender'), true)}
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
          <div className="space-y-1.5">
            {renderLabel(t('submission.locationType'), true)}
            <Select
              value={formData.locationType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  locationType: value as LocationType,
                  centerId: '',
                  numberOfPeopleInHousehold:
                    value === 'center' ? 0 : prev.numberOfPeopleInHousehold,
                }))
              }
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="with_family">{t('submission.withFamily')}</SelectItem>
                <SelectItem value="center">{t('submission.inCenter')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              {renderLabel(t('submission.previousGovernorate'), true)}
              <Input
                value={formData.previousGovernorate}
                onChange={(e) => handleChange('previousGovernorate', e.target.value)}
                required
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
          </div>
          {isCenterCase ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                {renderLabel(t('submission.center'), true)}
                <CenterPicker
                  value={formData.centerId}
                  onValueChange={(value) => handleChange('centerId', value)}
                />
              </div>
              {selectedCenter ? (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">{selectedCenter.name}</p>
                  <p>
                    {selectedCenter.city}, {selectedCenter.governorate}
                  </p>
                  <p>{selectedCenter.address}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'currentGovernorate', label: t('submission.currentGovernorate') },
                { name: 'street', label: t('submission.street') },
                { name: 'building', label: t('submission.building') },
                { name: 'floor', label: t('submission.floor') },
                { name: 'city', label: t('submission.city') },
              ].map(({ name, label }) => (
                <div key={name} className="space-y-1.5">
                  {renderLabel(label, true)}
                  <Input
                    value={String(formData[name as keyof SubmissionFormData] ?? '')}
                    onChange={(e) => handleChange(name, e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCenterCase ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
              {t('submission.householdAndNeeds')}
            </h2>
            <div className="space-y-1.5">
              {renderLabel(t('submission.numberOfPeopleInHousehold'), true)}
              <Input
                type="number"
                min={0}
                value={formData.numberOfPeopleInHousehold}
                onChange={(e) => handleChange('numberOfPeopleInHousehold', Number(e.target.value))}
                required
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(formData.ageRanges).map(([range, value]) => (
                <div key={range} className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">{range}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ageRanges: {
                          ...prev.ageRanges,
                          [range]: Number(e.target.value),
                        },
                      }))
                    }
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">
            {t('submission.needsTitle')}
          </h2>
          <div className="space-y-1.5">
            {renderLabel(t('submission.needsTitle'), true)}
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
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
                placeholder={t('submission.specialNeedsPlaceholder')}
              />
              <Button type="button" variant="outline" onClick={addSpecialNeed}>
                {t('submission.addSpecialNeed')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specialNeeds.map((specialNeed) => (
                <Badge key={specialNeed} variant="secondary" className="gap-1">
                  {specialNeed}
                  <button type="button" onClick={() => removeSpecialNeed(specialNeed)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {renderLabel(t('submission.aidUrgency'), true)}
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
              className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          <Checkbox
            checked={formData.consentGiven}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, consentGiven: checked === true }))
            }
          />
          <span>{t('home.consent')}</span>
        </label>

        <Button
          type="submit"
          className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white"
          disabled={loading}
        >
          {loading ? t('cases.create.creating') : t('cases.create.submit')}
        </Button>
      </form>
    </div>
  );
}

export default CreateMemberCase;
