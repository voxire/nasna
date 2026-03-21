import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getCookie, setCookie, deleteCookie } from '../../utils/cookies';
import { useAuthStore } from '@/stores/authStore';
import { trackLogin } from '@/services/analytics';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/Components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/Components/ui/dialog';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loading = useAuthStore((state) => state.loading);
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

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
      case 'auth/account-inactive':
        toast.error(t('login.toast.accountInactive'));
        break;
      default:
        toast.error(t('login.toast.genericError'));
        break;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      trackLogin('google');
      toast.success(t('login.toast.success'));
      navigate(result.destination);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? '';
      if (code === 'auth/account-exists-with-different-credential') {
        const email = (error as { customData?: { email?: string } })?.customData?.email ?? '';
        if (email) form.setValue('email', email);
        toast.error(t('login.toast.accountExistsDifferentCredential'), { duration: 7000 });
      } else if (code === 'auth/account-inactive') {
        toast.error(t('login.toast.accountInactive'));
      } else if (code !== 'auth/popup-closed-by-user') {
        toast.error(t('login.toast.genericError'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (getCookie('nasna_login_locked')) {
      toast.error(t('login.toast.tooManyAttempts'));
      return;
    }

    try {
      const result = await loginWithPassword(data.email, data.password);
      deleteCookie('nasna_login_attempts');
      trackLogin('password');
      toast.success(t('login.toast.success'));
      navigate(result.destination);
    } catch (error) {
      const attempts = Number(getCookie('nasna_login_attempts') || '0') + 1;
      if (attempts >= 5) {
        setCookie('nasna_login_locked', '1', 15 * 60);
        deleteCookie('nasna_login_attempts');
        toast.error(t('login.toast.tooManyAttempts'));
      } else {
        setCookie('nasna_login_attempts', String(attempts), 15 * 60);
        handleFirebaseError((error as { code?: string })?.code ?? '');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      toast.success(t('login.toast.resetSent'));
      setForgotOpen(false);
      setForgotEmail('');
    } catch {
      toast.error(t('login.toast.resetError'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:min-h-[85vh]">
      {/* Teal banner */}
      <div className="flex flex-col items-center justify-center bg-[#12a89d] py-8 px-8 md:w-1/2 md:py-0">
        <img
          src="/Nasna Logo.png"
          alt={t('login.logoAlt')}
          className="h-16 md:h-24 w-auto brightness-0 invert"
        />
        <p className="hidden md:block text-white/80 text-center text-sm leading-relaxed max-w-xs mt-6">
          {t('login.bannerSubtitle')}
        </p>
      </div>

      {/* Form */}
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
                    <FormLabel className="text-sm font-medium text-gray-700">
                      {t('login.fields.email')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="off"
                        className="border-gray-200 focus-visible:ring-[#12a89d] h-11"
                        {...field}
                      />
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        {t('login.fields.password')}
                      </FormLabel>
                      <button
                        type="button"
                        className="text-xs text-[#12a89d] hover:underline"
                        onClick={() => setForgotOpen(true)}
                      >
                        {t('login.forgotPassword')}
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="off"
                        className="border-gray-200 focus-visible:ring-[#12a89d] h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[#12a89d] hover:bg-[#0e9088] text-white h-11"
                disabled={loading}
              >
                {loading ? t('login.buttons.loading') : t('login.buttons.signIn')}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">{t('login.or')}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? t('login.googleLoading') : t('login.googleButton')}
          </Button>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('login.noAccount')}{' '}
            <span
              className="text-[#12a89d] font-medium cursor-pointer hover:underline"
              onClick={() => navigate('/auth/register')}
            >
              {t('login.registerLink')}
            </span>
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          setForgotOpen(open);
          if (!open) setForgotEmail('');
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('login.forgotPasswordTitle')}</DialogTitle>
            <DialogDescription>{t('login.forgotPasswordDesc')}</DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="you@example.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleForgotPassword();
            }}
            className="border-gray-200 focus-visible:ring-[#12a89d]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              {t('login.buttons.cancel')}
            </Button>
            <Button
              className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
              onClick={handleForgotPassword}
              disabled={forgotLoading || !forgotEmail.trim()}
            >
              {forgotLoading ? t('login.forgotSending') : t('login.forgotSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Login;
