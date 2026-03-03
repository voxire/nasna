import { db, auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/Components/ui/form';

const agentSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    phoneNumber: z.string().min(1),
    areaOfOperation: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AgentFormData = z.infer<typeof agentSchema>;

function AgentRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      areaOfOperation: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: AgentFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await setDoc(doc(db, 'members', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        areaOfOperation: data.areaOfOperation,
        role: 'agent',
        isAdmin: false,
        validated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        consentGiven: true,
      });
      await signOut(auth);
      toast.success('Registration successful! Please log in.');
      navigate('/auth/login');
    } catch (error) {
      console.error('Error registering agent: ', error);
      toast.error('Error registering. Please try again.');
    }
  };

  return (
    <div className="max-w-[600px] mx-auto my-8 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Become An Agent</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Area of Operation</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">{t('home.consent')}</p>
          <Button type="submit" className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </Form>
      </div>
    </div>
  );
}

export default AgentRegister;
