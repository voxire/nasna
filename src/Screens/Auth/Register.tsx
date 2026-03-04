import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/Components/ui/form';

const registerSchema = z
  .object({
    name: z.string().min(1),
    contactPersonName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    phoneNumber: z.string().min(1),
    consentGiven: z.boolean().refine((v) => v === true, { message: 'Consent is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      contactPersonName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      consentGiven: false,
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(userCredential.user);
      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: data.name,
        contactPersonName: data.contactPersonName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        consentGiven: data.consentGiven,
        areaOfOperation: '',
        kindOfHelp: '',
        initiativeOrNgo: '',
        role: 'member',
        numberOfVolunteers: '',
        isOfficiallyRegistered: false,
        isAdmin: false,
        validated: false,
        onboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await signOut(auth);
      toast.success(t('register.toast.success'));
      navigate('/auth/login');
    } catch (error) {
      console.error('Error registering NGO: ', error);
      toast.error(t('register.toast.error'));
    }
  };

  return (
    <div className="max-w-[600px] mx-auto my-8 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">{t('register.title')}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">{t('register.fields.name')}</FormLabel>
                  <FormControl>
                    <Input className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
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
                  <FormLabel className="text-sm font-medium text-gray-700">{t('register.fields.contactPersonName')}</FormLabel>
                  <FormControl>
                    <Input className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">{t('register.fields.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">{t('register.fields.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">{t('register.fields.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">{t('register.fields.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input className="bg-gray-50 border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consentGiven"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-gray-300 data-[state=checked]:bg-[#12a89d] data-[state=checked]:border-[#12a89d] mt-0.5"
                    />
                  </FormControl>
                  <div className="leading-none">
                    <FormLabel className="text-sm text-gray-700 font-normal cursor-pointer">{t('register.consent')}</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white mt-2" disabled={isSubmitting}>
              {isSubmitting ? t('register.loading') : t('register.submit')}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default Register;
