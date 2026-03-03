import { useTranslation } from 'react-i18next';
import { Separator } from '@/Components/ui/separator';
import { GitBranch, Handshake, Users, HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqItems = [
    { key: 'eligibility', q: t('about.faq.questions.eligibility'), a: t('about.faq.answers.eligibility') },
    { key: 'legitimacy', q: t('about.faq.questions.legitimacy'), a: t('about.faq.answers.legitimacy') },
    { key: 'dataHandling', q: t('about.faq.questions.dataHandling'), a: t('about.faq.answers.dataHandling') },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero banner */}
      <section
        className="relative flex items-center justify-center min-h-[40vh] text-white overflow-hidden"
        style={{ backgroundImage: 'url("/nabatiye.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center px-6 py-12 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">{t('about.banner.aboutUs')}</h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">{t('about.banner.quote')}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-5 py-12 max-w-3xl mx-auto w-full">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-[#12a89d] mb-2">{t('about.title.mission')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.content.missionStatement')}</p>
          </div>
          <Separator />
          <div>
            <h2 className="text-xl font-bold text-[#12a89d] mb-2">{t('about.title.vision')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.content.visionStatement')}</p>
          </div>
          <Separator />
          <div>
            <h2 className="text-xl font-bold text-[#12a89d] mb-2">{t('about.title.joinUs')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.joinUs')}</p>
          </div>
        </div>
      </section>

      {/* How We Operate */}
      <section className="bg-gray-50 px-5 py-12">
        <div className="max-w-3xl mx-auto w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('about.howWeOperate.title')}</h2>
          <p className="text-gray-500 text-sm mb-8">{t('about.howWeOperate.intro')}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <GitBranch className="h-7 w-7 text-[#12a89d]" />, title: t('about.howWeOperate.registrationTitle'), desc: t('about.howWeOperate.registrationDescription') },
              { icon: <Handshake className="h-7 w-7 text-[#12a89d]" />, title: t('about.howWeOperate.partnershipsTitle'), desc: t('about.howWeOperate.partnershipsDescription') },
              { icon: <Users className="h-7 w-7 text-[#12a89d]" />, title: t('about.howWeOperate.supportTitle'), desc: t('about.howWeOperate.supportDescription') },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                {icon}
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-12 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-5 w-5 text-[#12a89d]" />
          <h2 className="text-xl font-bold text-gray-800">{t('about.faq.title')}</h2>
        </div>
        <div className="space-y-3">
          {faqItems.map(({ key, q, a }) => (
            <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === key ? null : key)}
              >
                {q}
                <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 ml-3 transition-transform ${openFaq === key ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === key && (
                <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#12a89d] px-5 py-12 text-center text-white">
        <h2 className="text-xl font-bold mb-2">{t('about.getInvolved.title')}</h2>
        <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">{t('about.getInvolved.intro')}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-white text-[#12a89d] font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('about.banner.FormButton')}
        </button>
      </section>
    </div>
  );
}

export default About;
