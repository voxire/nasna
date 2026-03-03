import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import useWindowDimensions from '../utils/useWindowDimensions';
import { Link } from 'react-router-dom';

function Footer() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setRole(tokenResult.claims['role'] as string | null);
        } catch (error) {
          console.error('Error retrieving user role:', error);
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer
      className="bg-[#12a89d] text-white"
      style={{ paddingBottom: width < 600 ? 80 : undefined }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src="/Nasna Logo.png" alt="Nasna logo" className="h-16 w-auto brightness-0 invert" />

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/about" className="text-white/80 hover:text-white transition-colors no-underline">
              {t('footer.aboutUs')}
            </Link>
            <Link to="/terms" className="text-white/80 hover:text-white transition-colors no-underline">
              {t('footer.terms & conditions')}
            </Link>

            {user?.email ? (
              role === 'admin' ? (
                <Link to="/manage" className="text-white/80 hover:text-white transition-colors no-underline">
                  {t('footer.adminPanel')}
                </Link>
              ) : (
                <Link to="/ngo/submissions" className="text-white/80 hover:text-white transition-colors no-underline">
                  {t('footer.dashboard')}
                </Link>
              )
            ) : (
              <>
                <Link to="/auth/login" className="text-white/80 hover:text-white transition-colors no-underline">
                  {t('footer.signIn')}
                </Link>
                <Link to="/auth/register" className="text-white/80 hover:text-white transition-colors no-underline">
                  {t('footer.registerNgo')}
                </Link>
                <Link to="/auth/agent" className="text-white/80 hover:text-white transition-colors no-underline">
                  {t('footer.becomeAgent')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-white/20 mt-6 pt-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Nasna. {t('footer.allRightsReserved')}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
