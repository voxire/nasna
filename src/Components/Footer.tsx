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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <img src="/Nasna Logo.png" alt="Nasna logo" className="h-14 w-auto brightness-0 invert" />
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Connecting individuals with government and NGO support across Lebanon.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Navigate</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/offer-help" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.offerHelp')}</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.resources')}</Link></li>
              <li><Link to="/feedback" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.feedback')}</Link></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.terms & conditions')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Account</h3>
            <ul className="space-y-2.5 text-sm">
              {user ? (
                <li>
                  <Link
                    to={role === 'admin' ? '/manage' : '/ngo/submissions'}
                    className="text-gray-300 hover:text-white transition-colors no-underline"
                  >
                    {role === 'admin' ? t('footer.adminPanel') : t('footer.dashboard')}
                  </Link>
                </li>
              ) : (
                <>
                  <li><Link to="/auth/login" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.signIn')}</Link></li>
                  <li><Link to="/auth/register" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.registerNgo')}</Link></li>
                  <li><Link to="/auth/agent" className="text-gray-300 hover:text-white transition-colors no-underline">{t('footer.becomeAgent')}</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Nasna. {t('footer.allRightsReserved')}</span>
          <span className="flex items-center gap-1">
            Built for Lebanon
            <span className="inline-block w-3 h-3 rounded-full bg-[#12a89d]" />
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
