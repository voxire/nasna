import 'leaflet/dist/leaflet.css';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Flame,
  Heart,
  Brain,
  Shield,
  HandHeart,
  Phone,
  Search,
  Clock,
} from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Card, CardContent } from '@/Components/ui/card';

// ─── Data ───────────────────────────────────────────────────────────────────

interface Hotline {
  id: string;
  name: string;
  number: string;
  categoryId: 'emergency' | 'mental_health' | 'protection' | 'humanitarian';
  descriptionKey: string;
  featured?: boolean;
  available24h?: boolean;
}

const HOTLINES: Hotline[] = [
  // Immediate Emergency
  {
    id: 'police',
    name: 'Police / ISF',
    number: '112',
    categoryId: 'emergency',
    descriptionKey: 'hotlines.descriptions.police',
    featured: true,
    available24h: true,
  },
  {
    id: 'civil_defense',
    name: 'Civil Defense',
    number: '175',
    categoryId: 'emergency',
    descriptionKey: 'hotlines.descriptions.civilDefense',
    featured: true,
    available24h: true,
  },
  {
    id: 'red_cross',
    name: 'Lebanese Red Cross',
    number: '140',
    categoryId: 'emergency',
    descriptionKey: 'hotlines.descriptions.redCross',
    featured: true,
    available24h: true,
  },
  {
    id: 'police_alt',
    name: 'Police (alt)',
    number: '999',
    categoryId: 'emergency',
    descriptionKey: 'hotlines.descriptions.policeAlt',
    available24h: true,
  },

  // Mental Health
  {
    id: 'embrace',
    name: 'Embrace Lebanon',
    number: '1564',
    categoryId: 'mental_health',
    descriptionKey: 'hotlines.descriptions.embrace',
    featured: true,
    available24h: true,
  },
  {
    id: 'restart',
    name: 'Restart Centre',
    number: '01 388 006',
    categoryId: 'mental_health',
    descriptionKey: 'hotlines.descriptions.restart',
  },

  // Protection & GBV
  {
    id: 'kafa',
    name: 'Kafa',
    number: '1554',
    categoryId: 'protection',
    descriptionKey: 'hotlines.descriptions.kafa',
    available24h: true,
  },
  {
    id: 'abaad',
    name: 'ABAAD',
    number: '01 205 704',
    categoryId: 'protection',
    descriptionKey: 'hotlines.descriptions.abaad',
  },

  // Humanitarian Organizations
  {
    id: 'unhcr',
    name: 'UNHCR Lebanon',
    number: '01 850 178',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.unhcr',
  },
  {
    id: 'unicef',
    name: 'UNICEF Lebanon',
    number: '01 970 400',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.unicef',
  },
  {
    id: 'wfp',
    name: 'WFP Lebanon',
    number: '01 962 520',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.wfp',
  },
  {
    id: 'caritas',
    name: 'Caritas Lebanon',
    number: '01 402 218',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.caritas',
  },
  {
    id: 'islamic_relief',
    name: 'Islamic Relief Lebanon',
    number: '01 486 289',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.islamicRelief',
  },
  {
    id: 'world_vision',
    name: 'World Vision Lebanon',
    number: '01 480 419',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.worldVision',
  },
  {
    id: 'iom',
    name: 'IOM Lebanon',
    number: '01 979 081',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.iom',
  },
  {
    id: 'msf',
    name: 'MSF Lebanon',
    number: '01 611 360',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.msf',
  },
  {
    id: 'food_bank',
    name: 'Lebanese Food Bank',
    number: '01 890 300',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.foodBank',
  },
  {
    id: 'save_children',
    name: 'Save the Children',
    number: '01 372 014',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.saveChildren',
  },
  {
    id: 'amel',
    name: 'Amel Association',
    number: '01 858 870',
    categoryId: 'humanitarian',
    descriptionKey: 'hotlines.descriptions.amel',
  },
];

const FEATURED_SOS = HOTLINES.filter((h) => h.featured);

// ─── Styles ─────────────────────────────────────────────────────────────────

interface CategoryStyle {
  id: string;
  labelKey: string;
  Icon: React.ElementType;
  accent: string;
  bg: string;
  border: string;
  chipBg: string;
  chipText: string;
  hoverBg: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  emergency: {
    id: 'emergency',
    labelKey: 'hotlines.categories.emergency',
    Icon: ShieldAlert,
    accent: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    chipBg: 'bg-red-100',
    chipText: 'text-red-700',
    hoverBg: 'hover:bg-red-50',
  },
  mental_health: {
    id: 'mental_health',
    labelKey: 'hotlines.categories.mentalHealth',
    Icon: Brain,
    accent: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    chipBg: 'bg-purple-100',
    chipText: 'text-purple-700',
    hoverBg: 'hover:bg-purple-50',
  },
  protection: {
    id: 'protection',
    labelKey: 'hotlines.categories.protection',
    Icon: Shield,
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    chipBg: 'bg-orange-100',
    chipText: 'text-orange-700',
    hoverBg: 'hover:bg-orange-50',
  },
  humanitarian: {
    id: 'humanitarian',
    labelKey: 'hotlines.categories.humanitarian',
    Icon: HandHeart,
    accent: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    chipBg: 'bg-teal-100',
    chipText: 'text-teal-700',
    hoverBg: 'hover:bg-teal-50',
  },
};

// Per-card styles for the top SOS strip (static, no dynamic Tailwind)
const SOS_STYLES: Record<
  string,
  { border: string; bg: string; accent: string; Icon: React.ElementType }
> = {
  police: { border: 'border-red-300', bg: 'bg-red-50', accent: 'text-red-600', Icon: ShieldAlert },
  civil_defense: {
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    accent: 'text-orange-600',
    Icon: Flame,
  },
  red_cross: {
    border: 'border-rose-300',
    bg: 'bg-rose-50',
    accent: 'text-rose-600',
    Icon: Heart,
  },
  embrace: {
    border: 'border-purple-300',
    bg: 'bg-purple-50',
    accent: 'text-purple-600',
    Icon: Brain,
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function Hotlines() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HOTLINES.filter((h) => {
      const matchSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.number.replace(/\s/g, '').includes(q.replace(/\s/g, ''));
      const matchCat = activeCategory === 'all' || h.categoryId === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      {/* ── Hero ── */}
      <section className="rounded-[2rem] bg-gradient-to-br from-red-700 via-red-600 to-rose-500 px-6 py-10 text-white shadow-lg md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-100">
          {t('hotlines.badge')}
        </p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">{t('hotlines.title')}</h1>
        <p className="mt-3 max-w-2xl text-base text-red-100">{t('hotlines.subtitle')}</p>
      </section>

      {/* ── SOS Strip ── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t('hotlines.sosTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_SOS.map((h) => {
            const style = SOS_STYLES[h.id] ?? {
              border: 'border-gray-200',
              bg: 'bg-gray-50',
              accent: 'text-gray-700',
              Icon: Phone,
            };
            const { Icon } = style;
            return (
              <a
                key={h.id}
                href={`tel:${h.number.replace(/\s/g, '')}`}
                className={`group flex flex-col items-center gap-3 rounded-2xl border-2 ${style.border} ${style.bg} p-5 text-center transition-all hover:scale-[1.02] hover:shadow-lg`}
              >
                <Icon className={`h-7 w-7 ${style.accent}`} />
                <p className="text-sm font-semibold leading-tight text-gray-700">{h.name}</p>
                <p className={`text-5xl font-black tabular-nums tracking-tight ${style.accent}`}>
                  {h.number}
                </p>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-current ${style.bg} ${style.accent}`}
                >
                  <Phone className="h-3 w-3" />
                  {t('hotlines.callNow')}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('hotlines.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-50 ps-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('hotlines.all')}
          </button>

          {Object.values(CATEGORY_STYLES).map((cat) => {
            const CatIcon = cat.Icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? `${cat.chipBg} ${cat.chipText} shadow-sm`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CatIcon className="h-3.5 w-3.5" />
                {t(cat.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((h) => {
          const cat = CATEGORY_STYLES[h.categoryId];
          const CatIcon = cat.Icon;
          return (
            <Card key={h.id} className={`overflow-hidden border ${cat.border} shadow-sm`}>
              <CardContent className="p-0">
                {/* Category strip */}
                <div className={`${cat.bg} flex items-center justify-between px-4 py-2.5`}>
                  <div className="flex items-center gap-2">
                    <CatIcon className={`h-3.5 w-3.5 ${cat.accent}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${cat.accent}`}>
                      {t(cat.labelKey)}
                    </span>
                  </div>
                  {h.available24h && (
                    <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-gray-600">
                      <Clock className="h-3 w-3" />
                      24/7
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="space-y-3 px-4 pb-4 pt-3">
                  <div>
                    <p className="font-bold text-gray-900">{h.name}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{t(h.descriptionKey)}</p>
                  </div>

                  <a
                    href={`tel:${h.number.replace(/\s/g, '')}`}
                    className={`flex items-center justify-between rounded-xl border ${cat.border} bg-white px-4 py-3 transition ${cat.hoverBg}`}
                  >
                    <span className={`text-2xl font-black tabular-nums tracking-tight ${cat.accent}`}>
                      {h.number}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${cat.accent}`}>
                      <Phone className="h-4 w-4" />
                      {t('hotlines.call')}
                    </span>
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          {t('hotlines.emptyState')}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">{t('hotlines.disclaimer')}</p>
    </div>
  );
}
