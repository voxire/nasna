import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Footer() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setRole(tokenResult.claims['role'] as string | null);
        } catch {
          // ignore
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-[#12a89d]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-0 md:justify-between">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <img src="/Nasna Logo.png" alt="Nasna logo" className="h-14 w-auto max-w-[200px] object-contain brightness-0 invert" />
            <p className="text-white/70 text-sm leading-relaxed max-w-[220px]">
              Connecting individuals with NGO support across Lebanon.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">Navigate</p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.aboutUs')}</Link></li>
                <li><Link to="/offer-help" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.offerHelp')}</Link></li>
                <li><Link to="/resources" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.resources')}</Link></li>
                <li><Link to="/feedback" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.feedback')}</Link></li>
                <li><Link to="/terms" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.terms & conditions')}</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">Account</p>
              <ul className="space-y-2 text-sm">
                {user ? (
                  <li>
                    <Link
                      to={role === 'admin' ? '/manage' : '/ngo/submissions'}
                      className="text-white/80 hover:text-white transition-colors no-underline"
                    >
                      {role === 'admin' ? t('footer.adminPanel') : t('footer.dashboard')}
                    </Link>
                  </li>
                ) : (
                  <>
                    <li><Link to="/auth/login" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.signIn')}</Link></li>
                    <li><Link to="/auth/register" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.registerNgo')}</Link></li>
                    <li><Link to="/auth/agent" className="text-white/80 hover:text-white transition-colors no-underline">{t('footer.becomeAgent')}</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Nasna. {t('footer.allRightsReserved')}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
