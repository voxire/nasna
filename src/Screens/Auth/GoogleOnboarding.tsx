import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Building2, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/Components/ui/form';
import { cn } from '@/lib/utils';
import { buildMemberWorkflowDefaults } from '@/lib/v2Defaults';
import { useAuthStore } from '@/stores/authStore';

const onboardingSchema = z
  .object({
    role: z.enum(['member', 'agent']),
    name: z.string().optional(),
    contactPersonName: z.string().optional(),
    fullName: z.string().optional(),
    areaOfOperation: z.string().optional(),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    consentGiven: z.boolean().refine((v) => v === true, { message: 'Consent is required' }),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'member') {
      if (!data.name?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['name'], message: 'Organization name is required' });
      }
      if (!data.contactPersonName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['contactPersonName'],
          message: 'Contact person name is required',
        });
      }
    }
    if (data.role === 'agent') {
      if (!data.fullName?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'Full name is required' });
      }
      if (!data.areaOfOperation?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['areaOfOperation'],
          message: 'Area of operation is required',
        });
      }
    }
  });

type OnboardingFormData = z.infer<typeof onboardingSchema>;

function GoogleOnboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.firebaseUser);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: 'member',
      name: '',
      contactPersonName: '',
      fullName: '',
      areaOfOperation: '',
      phoneNumber: '',
      consentGiven: false,
    },
  });

  const {
    formState: { isSubmitting },
    watch,
    setValue,
  } = form;
  const selectedRole = watch('role');

  useEffect(() => {
    if (!initialized || loading) return;

    if (!user) {
      navigate('/auth/login', { replace: true });
      return;
    }

    if (profile?.onboarded === true) {
      navigate(profile.role === 'agent' ? '/agent/create' : '/ngo/submissions', { replace: true });
    }
  }, [initialized, loading, navigate, profile, user]);

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;

    try {
      const isMember = data.role === 'member';

      await setDoc(doc(db, 'members', user.uid), {
        uid: user.uid,
        name: isMember ? data.name : data.fullName,
        contactPersonName: isMember ? data.contactPersonName : '',
        email: user.email ?? '',
        phoneNumber: data.phoneNumber,
        areaOfOperation: isMember ? '' : data.areaOfOperation,
        consentGiven: data.consentGiven,
        kindOfHelp: '',
        initiativeOrNgo: '',
        role: data.role,
        numberOfVolunteers: '',
        isOfficiallyRegistered: false,
        ...buildMemberWorkflowDefaults(),
        isAdmin: false,
        validated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await refreshProfile(user.uid);
      toast.success('Profile created! Welcome to Nasna.');
      navigate(data.role === 'agent' ? '/agent/create' : '/ngo/submissions');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  const handleCancel = async () => {
    await signOut(auth);
    navigate('/auth/login');
  };

  if (!initialized || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:min-h-[85vh]">
      <div className="flex flex-col items-center justify-center bg-[#12a89d] py-8 px-8 md:w-1/2 md:py-0">
        <img
          src="/Nasna Logo.png"
          alt="Nasna logo"
          className="h-16 md:h-24 w-auto brightness-0 invert"
        />
        <p className="hidden md:block text-white/80 text-center text-sm leading-relaxed max-w-xs mt-6">
          Just a few more details and you&apos;re all set.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Complete your profile</h1>
          <p className="text-sm text-gray-400 mb-6">
            Signed in as <span className="font-medium text-gray-600">{user?.email}</span>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'member', label: 'NGO / Organization', icon: Building2 },
              { value: 'agent', label: 'Field Agent', icon: UserCheck },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setValue('role', value as 'member' | 'agent', { shouldValidate: false })
                }
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors',
                  selectedRole === value
                    ? 'border-[#12a89d] bg-[#12a89d]/5 text-[#12a89d]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {selectedRole === 'member' ? (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Organization / Initiative Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Nasna NGO"
                            className="border-gray-200 focus-visible:ring-[#12a89d]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Contact Person Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Sarah Ahmad"
                            className="border-gray-200 focus-visible:ring-[#12a89d]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Ahmad Ali"
                            className="border-gray-200 focus-visible:ring-[#12a89d]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="areaOfOperation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Area of Operation
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Beirut"
                            className="border-gray-200 focus-visible:ring-[#12a89d]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 70 123 456"
                        className="border-gray-200 focus-visible:ring-[#12a89d]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentGiven"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I confirm these details are correct and can be reviewed.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => void handleCancel()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#12a89d] hover:bg-[#0f978d]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default GoogleOnboarding;
