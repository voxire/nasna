import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resolvePostLoginPath, useAuthStore } from '@/stores/authStore';

function Footer() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const profile = useAuthStore((state) => state.profile);

  return (
    <footer className="bg-[#12a89d]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-0 md:justify-between">
          <div className="flex flex-col gap-3">
            <img
              src="/Nasna Logo.png"
              alt="Nasna logo"
              className="h-14 w-auto max-w-[200px] object-contain brightness-0 invert"
            />
            <p className="text-white/70 text-sm leading-relaxed max-w-[220px]">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">
                {t('footer.navigate')}
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.aboutUs')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/impact"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.impact')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/housing"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.housing')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/offer-housing"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.offerHousing')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/emergency"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.emergency')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/offer-help"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.offerHelp')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resources"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.resources')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feedback"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.feedback')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {t('footer.terms & conditions')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">
                {t('footer.account')}
              </p>
              <ul className="space-y-2 text-sm">
                {user ? (
                  <li>
                    <Link
                      to={resolvePostLoginPath(
                        role,
                        role === 'admin' || profile?.onboarded === true,
                      )}
                      className="text-white/80 hover:text-white transition-colors no-underline"
                    >
                      {role === 'admin' ? t('footer.adminPanel') : t('footer.dashboard')}
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/auth/login"
                        className="text-white/80 hover:text-white transition-colors no-underline"
                      >
                        {t('footer.signIn')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/auth/register"
                        className="text-white/80 hover:text-white transition-colors no-underline"
                      >
                        {t('footer.registerNgo')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/auth/agent"
                        className="text-white/80 hover:text-white transition-colors no-underline"
                      >
                        {t('footer.becomeAgent')}
                      </Link>
                    </li>
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
