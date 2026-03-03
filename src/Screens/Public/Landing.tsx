import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { ClipboardList, CheckCircle, HandHelping, ShieldCheck, Globe, HeartHandshake } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Hero ── */}
      <section
        className="relative flex items-center justify-center min-h-[70vh] text-white overflow-hidden"
        style={{ backgroundImage: 'url("/nabatiye.jpg")', backgroundSize: 'cover', backgroundPosition: 'center 40%' }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto gap-6">
          <img src="/Nasna Logo.png" alt="Nasna" className="h-20 w-auto brightness-0 invert" />
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {t('landing.hero.headline')}
          </h1>
          <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-lg">
            {t('landing.hero.subtext')}
          </p>
          <Button
            size="lg"
            className="bg-white text-[#12a89d] hover:bg-white/90 font-semibold px-10 text-base rounded-full shadow-lg"
            onClick={() => navigate('/submit')}
          >
            {t('landing.hero.cta')}
          </Button>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">{t('landing.steps.title')}</h2>
          <p className="text-gray-500 text-sm text-center mb-12">{t('landing.steps.subtitle')}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <ClipboardList className="h-7 w-7 text-[#12a89d]" />, title: t('landing.steps.step1.title'), desc: t('landing.steps.step1.desc'), num: '01' },
              { icon: <CheckCircle className="h-7 w-7 text-[#12a89d]" />, title: t('landing.steps.step2.title'), desc: t('landing.steps.step2.desc'), num: '02' },
              { icon: <HandHelping className="h-7 w-7 text-[#12a89d]" />, title: t('landing.steps.step3.title'), desc: t('landing.steps.step3.desc'), num: '03' },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-gray-100">{step.num}</span>
                  <div className="w-10 h-10 rounded-xl bg-[#12a89d]/10 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Nasna ── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">{t('landing.features.title')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck className="h-6 w-6 text-[#12a89d]" />, title: t('landing.features.secure.title'), desc: t('landing.features.secure.desc') },
              { icon: <Globe className="h-6 w-6 text-[#12a89d]" />, title: t('landing.features.free.title'), desc: t('landing.features.free.desc') },
              { icon: <HeartHandshake className="h-6 w-6 text-[#12a89d]" />, title: t('landing.features.trusted.title'), desc: t('landing.features.trusted.desc') },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#12a89d]/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-800">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="bg-[#12a89d] px-6 py-14">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white">{t('landing.cta.title')}</h2>
          <p className="text-white/80 text-sm leading-relaxed">{t('landing.cta.subtitle')}</p>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-[#12a89d] font-semibold px-10 rounded-full bg-transparent"
            onClick={() => navigate('/submit')}
          >
            {t('landing.cta.button')}
          </Button>
        </div>
      </section>

    </div>
  );
}

export default Landing;
