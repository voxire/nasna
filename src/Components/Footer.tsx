import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { resolvePostLoginPath, useAuthStore } from '@/stores/authStore';
import { VoxireCredit } from '@/Components/VoxireCredit';

function Footer() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const profile = useAuthStore((state) => state.profile);

  return (
    <footer className="bg-[#12a89d]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(220px,0.7fr)] lg:gap-20">
          <div className="flex flex-col gap-4">
            <img
              src="/Nasna Logo.png"
              alt="Nasna logo"
              className="h-14 w-auto max-w-[200px] object-contain brightness-0 invert"
            />
            <p className="max-w-[320px] text-sm leading-7 text-white/75">{t('footer.tagline')}</p>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/50">
              {t('footer.navigate')}
            </p>
            <ul className="grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
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
              <li className="sm:col-span-2">
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
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/50">
              {t('footer.account')}
            </p>
            <ul className="space-y-3 text-sm">
              {user ? (
                <li>
                  <Link
                    to={resolvePostLoginPath(
                      role,
                      role === 'admin' || role === 'super_admin' || profile?.onboarded === true,
                    )}
                    className="text-white/80 hover:text-white transition-colors no-underline"
                  >
                    {role === 'admin' || role === 'super_admin'
                      ? t('footer.adminPanel')
                      : t('footer.dashboard')}
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

        <div className="mt-10 border-t border-white/20 pt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-xs text-white/50">
          <span>
            © {new Date().getFullYear()} Nasna. {t('footer.allRightsReserved')}
          </span>
          <a
            href="https://github.com/voxire/nasna"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors no-underline"
          >
            <Github className="h-3.5 w-3.5" />
            {t('footer.openSource')}
          </a>
        </div>
      </div>
      <VoxireCredit />
    </footer>
  );
}

export default Footer;
