import { useState } from 'react';
import { db, functions } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getCookie, setCookie } from '../../utils/cookies';
import type { AgeRanges } from '../../types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { buildSubmissionWorkflowDefaults } from '@/lib/v2Defaults';
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

function Home() {
  const { t, i18n } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [gender, setGender] = useState('');
  const [currentGovernorate, setCurrentGovernorate] = useState('');
  const [previousGovernorate, setPreviousGovernorate] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [city, setCity] = useState('');
  const [ageRanges, setAgeRanges] = useState<AgeRanges>({
    '0-3': 0, '4-12': 0, '13-18': 0, '19-60': 0, '60+': 0,
  });
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [aidUrgency, setAidUrgency] = useState('');
  const [comments, setComments] = useState('');
  const [page, setPage] = useState(1);
  const [emailError, setEmailError] = useState(false);
  const [numberOfPeopleInHousehold, setNumberOfPeopleInHousehold] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const navigate = useNavigate();

  const getTotalAgeGroupCount = () =>
    Object.values(ageRanges).reduce((acc, count) => acc + Number(count), 0);

  const removeEmojis = (text: string) =>
    text.replace(/\p{Extended_Pictographic}/gu, '').replace(/[\uE000-\uF8FF]/gu, '');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddMember = async () => {
    // Honeypot — silently block bots that fill hidden fields
    if (honeypot) return;

    const trimmedPhone = phoneNumber.trim();
    if (getTotalAgeGroupCount() > numberOfPeopleInHousehold) {
      toast.error(t('home.toast.invalidNumberOfPeopleInHousehold'));
      return;
    }

    if (
      fullName && trimmedPhone && currentGovernorate && previousGovernorate &&
      street && building && floor && specialNeeds.length && needs.length && aidUrgency && consentGiven
    ) {
      // 24h cooldown — cookie auto-expires after 24h, no timestamp math needed
      if (getCookie('nasna_submitted')) {
        toast.error(t('home.toast.submissionCooldown'));
        return;
      }

      try {
        // Duplicate check via Cloud Function — no client-side Firestore query
        const checkDuplicate = httpsCallable<
          { phoneNumber: string; emailAddress?: string },
          { phoneDuplicate: boolean; emailDuplicate: boolean }
        >(functions, 'checkSubmissionDuplicates');

        const { data: dupResult } = await checkDuplicate({
          phoneNumber: trimmedPhone,
          emailAddress: emailAddress.trim().toLowerCase() || undefined,
        });

        if (dupResult.phoneDuplicate) {
          toast.error(t('home.toast.duplicatePhoneNumber'));
          return;
        }
        if (dupResult.emailDuplicate) {
          toast.error(t('home.toast.duplicateEmail'));
          return;
        }

        await addDoc(collection(db, 'submissions'), {
          fullName, phoneNumber: trimmedPhone, emailAddress: emailAddress.trim().toLowerCase(), gender,
          currentGovernorate, previousGovernorate, city, street, building, floor,
          ageRanges, specialNeeds, needs, aidUrgency, consentGiven,
          comments,
          ...buildSubmissionWorkflowDefaults('web'),
          registrationDate: Timestamp.fromDate(new Date()),
          createdAt: new Date(),
          updatedAt: new Date(),
          agent: '',
        });
        setCookie('nasna_submitted', '1', 86_400);
        toast.success(t('home.toast.memberAddedSuccess'));
        navigate('/confirmation');
      } catch {
        toast.error(t('home.toast.errorAddingMember'));
      }
    } else {
      toast.error(t('home.toast.fillRequiredFields'));
    }
  };

  const pageOne = () => (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
        <p className="text-sm text-amber-800">{t('home.disclaimer')}</p>
      </div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('home.addressDetails')}</h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4 space-y-4">
        <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">{t('home.personalInformation')}</h2>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.fullName')}</Label>
          <Input value={fullName} onChange={(e) => setFullName(removeEmojis(e.target.value))} maxLength={100} autoComplete="off" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.phoneNumber')}</Label>
          <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(removeEmojis(e.target.value))} maxLength={20} autoComplete="off" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.emailAddress')}</Label>
          <Input
            type="email"
            value={emailAddress}
            onChange={(e) => {
              setEmailAddress(e.target.value);
              setEmailError(!validateEmail(e.target.value));
            }}
            className={`bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d] ${emailError ? 'border-red-400' : ''}`}
          />
          {emailError && <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.gender')}</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">{t('home.male')}</SelectItem>
              <SelectItem value="Female">{t('home.female')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4 space-y-4">
        <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">{t('home.locationDetails')}</h2>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.previousGovernorate')}</Label>
          <Select value={previousGovernorate} onValueChange={setPreviousGovernorate}>
            <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOVERNORATES.map((g) => (
                <SelectItem key={g.value} value={g.value}>{t(g.key)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.currentGovernorate')}</Label>
          <Select value={currentGovernorate} onValueChange={setCurrentGovernorate}>
            <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOVERNORATES.map((g) => (
                <SelectItem key={g.value} value={g.value}>{t(g.key)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('home.city')}</Label>
            <Input value={city} onChange={(e) => setCity(removeEmojis(e.target.value))} maxLength={100} autoComplete="off" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('home.street')}</Label>
            <Input value={street} onChange={(e) => setStreet(removeEmojis(e.target.value))} maxLength={100} autoComplete="off" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('home.building')}</Label>
            <Input value={building} onChange={(e) => setBuilding(removeEmojis(e.target.value))} maxLength={100} autoComplete="off" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">{t('home.floor')}</Label>
            <Input value={floor} onChange={(e) => setFloor(removeEmojis(e.target.value))} maxLength={10} autoComplete="off" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <Button
          className="bg-[#12a89d] hover:bg-[#0e9088] text-white px-8"
          onClick={() => {
            if (fullName && phoneNumber && currentGovernorate && previousGovernorate && street && building && floor && !emailError) {
              setPage(2);
            } else {
              toast.error(emailError ? t('home.toast.validEmailRequired') : t('home.toast.fillRequiredFields'));
            }
          }}
        >
          {t('home.continue')}
        </Button>
      </div>
    </div>
  );

  const pageTwo = () => (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('home.householdAndNeedsDetails')}</h1>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4 space-y-4">
        <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">{t('home.householdInformation')}</h2>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.numberOfPeopleInHousehold')}</Label>
          <Input
            type="number"
            value={numberOfPeopleInHousehold}
            onChange={(e) => setNumberOfPeopleInHousehold(Number(e.target.value))}
            className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
          />
        </div>
        <p className="text-sm font-semibold text-gray-700">{t('home.ageRanges')}</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(ageRanges) as Array<keyof AgeRanges>).map((range) => (
            <div key={range} className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">{`${range} (${t('home.numberOfMembers')})`}</Label>
              <Input
                type="number"
                value={ageRanges[range]}
                onChange={(e) => setAgeRanges({ ...ageRanges, [range]: Number(e.target.value) })}
                className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-4 space-y-4">
        <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide">{t('home.needs.special.title')}</h2>
        <div className="grid grid-cols-1 gap-2">
          {[
            t('home.needs.special.need1'), t('home.needs.special.need2'),
            t('home.needs.special.need3'), t('home.needs.special.need4'),
            t('home.needs.special.need5'), t('home.needs.special.need6'),
          ].map((need) => (
            <div key={need} className="flex items-center gap-2 py-1">
              <Checkbox
                id={`special-${need}`}
                checked={specialNeeds.includes(need)}
                onCheckedChange={(checked) =>
                  setSpecialNeeds(checked ? [...specialNeeds, need] : specialNeeds.filter((n) => n !== need))
                }
                className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d]"
              />
              <Label htmlFor={`special-${need}`} className="text-sm text-gray-700 cursor-pointer">{need}</Label>
            </div>
          ))}
        </div>

        <h2 className="text-base font-semibold text-[#12a89d] uppercase tracking-wide pt-2">{t('home.needs.immediate.title')}</h2>
        <div className="grid grid-cols-1 gap-2">
          {[
            t('home.needs.immediate.need1'), t('home.needs.immediate.need2'),
            t('home.needs.immediate.need3'), t('home.needs.immediate.need4'),
            t('home.needs.immediate.need5'), t('home.needs.immediate.need6'),
          ].map((need) => (
            <div key={need} className="flex items-center gap-2 py-1">
              <Checkbox
                id={`need-${need}`}
                checked={needs.includes(need)}
                onCheckedChange={(checked) =>
                  setNeeds(checked ? [...needs, need] : needs.filter((n) => n !== need))
                }
                className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d]"
              />
              <Label htmlFor={`need-${need}`} className="text-sm text-gray-700 cursor-pointer">{need}</Label>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pt-2">
          <Label className="text-sm font-medium text-gray-700">{t('home.aidUrgency')}</Label>
          <Select value={aidUrgency} onValueChange={setAidUrgency}>
            <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">{t('home.high')}</SelectItem>
              <SelectItem value="Medium">{t('home.medium')}</SelectItem>
              <SelectItem value="Low">{t('home.low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{t('home.comments')}</Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(removeEmojis(e.target.value))}
            maxLength={500}
            rows={4}
            className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d] resize-none"
          />
        </div>

        <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
          <Checkbox
            id="consent"
            checked={consentGiven}
            onCheckedChange={(checked) => setConsentGiven(Boolean(checked))}
            className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d] mt-0.5"
          />
          <Label htmlFor="consent" className="text-xs text-gray-700 font-normal cursor-pointer">{t('home.consent')}</Label>
        </div>
      </div>

      <div className="flex justify-between items-center mt-5">
        <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50" onClick={() => setPage(1)}>{t('home.back')}</Button>
        <Button className="bg-[#12a89d] hover:bg-[#0e9088] text-white px-8" onClick={handleAddMember}>{t('home.submit')}</Button>
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col px-6 pt-7 pb-12 max-w-[600px] mx-auto"
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Honeypot — hidden from humans, bots fill it */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
        <label htmlFor="hp_website">Website</label>
        <input
          id="hp_website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden mb-4">
        <div
          className="bg-[#12a89d] h-2 transition-all duration-300"
          style={{ width: page === 1 ? '50%' : '100%' }}
        />
      </div>
      {page === 1 ? pageOne() : pageTwo()}
    </div>
  );
}

export default Home;
