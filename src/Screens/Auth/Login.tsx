import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { loginUser } from '../../redux/reducers/userSlice';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/Components/ui/form';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading } = useAppSelector((state) => state.user);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (user) {
      navigate(-1);
    }
  }, [user, navigate]);

  const handleFirebaseError = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        toast.error(t('login.toast.userNotFound'));
        break;
      case 'auth/wrong-password':
        toast.error(t('login.toast.wrongPassword'));
        break;
      case 'auth/invalid-email':
        toast.error(t('login.toast.invalidEmailFormat'));
        break;
      case 'auth/invalid-credential':
        toast.error(t('login.toast.invalidCredential'));
        break;
      default:
        toast.error(t('login.toast.genericError'));
        break;
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(loginUser({ email: data.email, password: data.password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success(t('login.toast.success'));
      navigate('/ngo/submissions');
    } else {
      handleFirebaseError((result.payload as string) ?? '');
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:min-h-[85vh]">
      {/* Teal banner — top on mobile, left panel on desktop */}
      <div className="flex flex-col items-center justify-center bg-[#12a89d] py-8 px-8 md:w-1/2 md:py-0">
        <img src="/Nasna Logo.png" alt={t('login.logoAlt')} className="h-16 md:h-24 w-auto brightness-0 invert" />
        <p className="hidden md:block text-white/80 text-center text-sm leading-relaxed max-w-xs mt-6">
          Connecting individuals with government and NGO support across Lebanon.
        </p>
      </div>

      {/* Form — below on mobile, right panel on desktop */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('login.title')}</h1>
          <p className="text-sm text-gray-400 mb-8">{t('login.subtitle')}</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">{t('login.fields.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
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
                    <FormLabel className="text-sm font-medium text-gray-700">{t('login.fields.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="border-gray-200 focus-visible:ring-[#12a89d]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white h-10" disabled={loading}>
                {loading ? t('login.buttons.loading') : t('login.buttons.signIn')}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <span className="text-[#12a89d] font-medium cursor-pointer hover:underline" onClick={() => navigate('/auth/register')}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
