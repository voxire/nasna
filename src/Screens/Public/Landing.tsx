import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import {
  ClipboardList, CheckCircle, HandHelping, BadgeCheck,
  Utensils, Droplets, Home as HomeIcon, Stethoscope, Shirt, Baby,
  Lock, Eye, ShieldCheck, ChevronDown, ArrowDown,
  Building2, Wheat, Pill, Users,
} from 'lucide-react';

// ─── Animated counter ────────────────────────────────────────────────────────
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(eased * target);
      setCount(next);
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, target]);

  if (target === 0) return <span>{suffix}</span>;

  return (
    <span ref={ref}>
      {count >= 1_000_000
        ? `${(count / 1_000_000).toFixed(1)}M`
        : count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Reusable motion variants ─────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const isRtl = i18n.language === 'ar';

  const stats = [
    { target: 5, suffix: t('landing.stats.minSuffix'), label: t('landing.stats.registerTime') },
    { target: 0, suffix: t('landing.stats.allSuffix'), label: t('landing.stats.governorates') },
    { target: 6, suffix: '+', label: t('landing.stats.aidTypes') },
    { target: 0, suffix: t('landing.stats.costSuffix'), label: t('landing.stats.cost') },
  ];

  const steps = [
    { num: '01', icon: <ClipboardList className="h-6 w-6" />, title: t('landing.steps.step1.title'), desc: t('landing.steps.step1.desc') },
    { num: '02', icon: <CheckCircle className="h-6 w-6" />, title: t('landing.steps.step2.title'), desc: t('landing.steps.step2.desc') },
    { num: '03', icon: <HandHelping className="h-6 w-6" />, title: t('landing.steps.step3.title'), desc: t('landing.steps.step3.desc') },
    { num: '04', icon: <BadgeCheck className="h-6 w-6" />, title: t('landing.steps.step4.title'), desc: t('landing.steps.step4.desc') },
  ];

  const services = [
    { icon: <Utensils className="h-7 w-7" />, label: t('landing.services.food'),      bg: 'bg-orange-50', fg: 'text-orange-500', border: 'border-orange-100' },
    { icon: <Droplets className="h-7 w-7" />, label: t('landing.services.water'),     bg: 'bg-blue-50',   fg: 'text-blue-500',   border: 'border-blue-100'   },
    { icon: <HomeIcon  className="h-7 w-7" />, label: t('landing.services.shelter'),  bg: 'bg-violet-50', fg: 'text-violet-500', border: 'border-violet-100' },
    { icon: <Stethoscope className="h-7 w-7" />, label: t('landing.services.medical'),bg: 'bg-red-50',    fg: 'text-red-500',    border: 'border-red-100'    },
    { icon: <Shirt  className="h-7 w-7" />, label: t('landing.services.clothing'),    bg: 'bg-green-50',  fg: 'text-green-500',  border: 'border-green-100'  },
    { icon: <Baby   className="h-7 w-7" />, label: t('landing.services.childcare'),   bg: 'bg-pink-50',   fg: 'text-pink-500',   border: 'border-pink-100'   },
  ];

  const security = [
    { icon: <Lock className="h-6 w-6 text-[#12a89d]" />, title: t('landing.security.point1.title'), desc: t('landing.security.point1.desc') },
    { icon: <Eye  className="h-6 w-6 text-[#12a89d]" />, title: t('landing.security.point2.title'), desc: t('landing.security.point2.desc') },
    { icon: <ShieldCheck className="h-6 w-6 text-[#12a89d]" />, title: t('landing.security.point3.title'), desc: t('landing.security.point3.desc') },
  ];

  const faqs = [
    { key: 'q1', q: t('landing.faq.q1.q'), a: t('landing.faq.q1.a') },
    { key: 'q2', q: t('landing.faq.q2.q'), a: t('landing.faq.q2.a') },
    { key: 'q3', q: t('landing.faq.q3.q'), a: t('landing.faq.q3.a') },
    { key: 'q4', q: t('landing.faq.q4.q'), a: t('landing.faq.q4.a') },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-white overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'url("/nabatiye.jpg")', backgroundSize: 'cover', backgroundPosition: 'center 40%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/80" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto gap-7 pt-8">
          <motion.img
            src="/Nasna Logo.png"
            alt="Nasna"
            className="h-20 md:h-28 w-auto brightness-0 invert"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {t('landing.hero.headline')}
          </motion.h1>

          <motion.div
            className="w-16 h-[3px] bg-[#12a89d] rounded-full"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          />

          <motion.p
            className="text-white/75 text-base md:text-xl leading-relaxed max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.75 }}
          >
            {t('landing.hero.subtext')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}
          >
            <Button
              size="lg"
              className="bg-[#12a89d] hover:bg-[#0e9088] text-white font-bold px-10 text-base rounded-full shadow-lg shadow-[#12a89d]/40 transition-all duration-200 hover:scale-105"
              onClick={() => navigate('/submit')}
            >
              {t('landing.hero.cta')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 font-medium px-10 text-base rounded-full bg-transparent transition-all duration-200"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('landing.hero.secondaryCta')}
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2 text-white/40 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">{t('landing.hero.scrollHint')}</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══ STATS BAR ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0d8c83] text-white py-12 px-6">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="flex flex-col gap-1.5">
              <span className="text-3xl md:text-4xl font-black tabular-nums">
                <CountUp target={s.target} suffix={s.suffix} />
              </span>
              <span className="text-white/65 text-xs md:text-sm">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══ CRISIS CONTEXT ═════════════════════════════════════════════════════ */}
      <section className="bg-gray-950 text-white px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp} className="space-y-5">
              <span className="text-[#12a89d] text-xs font-bold uppercase tracking-[0.15em]">
                {t('landing.crisis.eyebrow')}
              </span>
              <h2 className="text-3xl md:text-4xl font-black leading-tight">{t('landing.crisis.title')}</h2>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">{t('landing.crisis.body')}</p>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-500">{t('landing.crisis.footer')}</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
              {[
                { icon: <Building2 className="h-6 w-6 text-[#12a89d]" />, label: t('landing.crisis.issue1') },
                { icon: <Wheat     className="h-6 w-6 text-[#12a89d]" />, label: t('landing.crisis.issue2') },
                { icon: <Pill      className="h-6 w-6 text-[#12a89d]" />, label: t('landing.crisis.issue3') },
                { icon: <Users     className="h-6 w-6 text-[#12a89d]" />, label: t('landing.crisis.issue4') },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#12a89d]/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-300 leading-snug">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-white px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#12a89d] text-xs font-bold uppercase tracking-[0.15em]">
              {t('landing.steps.eyebrow')}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">{t('landing.steps.title')}</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">{t('landing.steps.subtitle')}</p>
          </motion.div>

          <div className="relative">
            {/* connecting line */}
            <div className="absolute top-6 bottom-6 start-6 w-px bg-gray-100 hidden md:block" />

            <div className="space-y-0">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  className="flex gap-5 items-start py-8 border-b border-gray-100 last:border-0"
                  initial={{ opacity: 0, x: isRtl ? (i % 2 === 0 ? 30 : -30) : (i % 2 === 0 ? -30 : 30) }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55 }}
                >
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-[#12a89d]/10 flex items-center justify-center text-[#12a89d]">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black text-[#12a89d] tracking-[0.2em]">{step.num}</span>
                      <h3 className="font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ AID CATEGORIES ════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#12a89d] text-xs font-bold uppercase tracking-[0.15em]">
              {t('landing.services.eyebrow')}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">{t('landing.services.title')}</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">{t('landing.services.subtitle')}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {services.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`bg-white border rounded-2xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-default ${s.border}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.fg}`}>
                  {s.icon}
                </div>
                <span className="font-semibold text-gray-800 text-sm">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ SECURITY & TRUST ══════════════════════════════════════════════════ */}
      <section className="bg-gray-950 text-white px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#12a89d] text-xs font-bold uppercase tracking-[0.15em]">
              {t('landing.security.eyebrow')}
            </span>
            <h2 className="text-3xl font-black mt-2">{t('landing.security.title')}</h2>
            <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">{t('landing.security.subtitle')}</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {security.map((p) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3 transition-colors hover:bg-white/8"
              >
                <div className="w-10 h-10 rounded-xl bg-[#12a89d]/20 flex items-center justify-center">
                  {p.icon}
                </div>
                <h3 className="font-bold text-sm">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-black text-gray-900">{t('landing.faq.title')}</h2>
            <p className="text-gray-500 text-sm mt-3">{t('landing.faq.subtitle')}</p>
          </motion.div>

          <motion.div
            className="space-y-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((item) => (
              <motion.div
                key={item.key}
                variants={fadeUp}
                className="border border-gray-200 rounded-2xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-start gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === item.key ? null : item.key)}
                >
                  <span className="font-semibold text-gray-800 text-sm">{item.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === item.key ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === item.key && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-28 flex items-center justify-center bg-gray-950">
        <motion.div
          className="relative z-10 flex flex-col items-center text-center gap-6 max-w-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-white/75 text-base leading-relaxed max-w-sm">{t('landing.cta.subtitle')}</p>
          <Button
            size="lg"
            className="bg-white text-[#12a89d] hover:bg-gray-100 font-bold px-12 text-base rounded-full shadow-2xl hover:scale-105 transition-all duration-200"
            onClick={() => navigate('/submit')}
          >
            {t('landing.cta.button')}
          </Button>
          <p className="text-white/40 text-xs">{t('landing.cta.note')}</p>
        </motion.div>
      </section>

    </div>
  );
}

export default Landing;
