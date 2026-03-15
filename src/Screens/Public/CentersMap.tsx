import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import {
  Building2,
  Clock,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPublicCentersMapData,
  type CenterMarker,
  type HousingAreaSummary,
} from '@/services/operationsMap';
import displacementSitesData from '@/data/displacementSites.json';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';

interface DisplacementSite {
  place_name_arabic: string;
  place_name_english: string;
  contact_person: string;
  phone_number: string;
  latitude: number;
  longitude: number;
}

const displacementSites = displacementSitesData as DisplacementSite[];

const centerIcon = new L.Icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Displacement site: pulsing teardrop pin with a person icon inside
const displacementIcon = L.divIcon({
  className: '',
  html: `
    <div class="ds-wrap">
      <span class="ds-pulse"></span>
      <span class="ds-pulse ds-pulse-2"></span>
      <div class="ds-pin">
        <svg class="ds-icon" width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -44],
});

interface StatCard {
  label: string;
  value: number;
  color: string;
  borderColor: string;
  bgColor: string;
  Icon: LucideIcon;
  iconColor: string;
  dot: string;
}

export default function CentersMap() {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<CenterMarker[]>([]);
  const [housingAreas, setHousingAreas] = useState<HousingAreaSummary[]>([]);
  const [showCenters, setShowCenters] = useState(true);
  const [showHousing, setShowHousing] = useState(true);
  const [showDisplacementSites, setShowDisplacementSites] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await getPublicCentersMapData();
        setCenters(data.centers);
        setHousingAreas(data.housingAreas);
      } catch {
        setError(t('centersMap.loadError'));
        toast.error(t('centersMap.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('centersMap.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('centersMap.description')}</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  const totalHousingSpots = housingAreas.reduce((sum, h) => sum + h.availableCapacity, 0);

  const layerControls = [
    {
      id: 'centers',
      label: t('centersMap.aidCenters'),
      checked: showCenters,
      set: setShowCenters,
      dot: 'bg-[#12a89d]',
    },
    {
      id: 'displacementSites',
      label: t('centersMap.displacementSites'),
      checked: showDisplacementSites,
      set: setShowDisplacementSites,
      dot: 'bg-orange-400',
    },
    {
      id: 'housing',
      label: t('centersMap.housingAreas'),
      checked: showHousing,
      set: setShowHousing,
      dot: 'bg-purple-400',
    },
  ];

  const statCards: StatCard[] = [
    {
      label: t('centersMap.totalCenters'),
      value: centers.length,
      color: 'text-[#12a89d]',
      borderColor: 'border-l-[#12a89d]',
      bgColor: 'bg-teal-50',
      Icon: Building2,
      iconColor: 'text-[#12a89d]',
      dot: 'bg-[#12a89d]',
    },
    {
      label: t('centersMap.displacementSitesCount'),
      value: displacementSites.length,
      color: 'text-orange-500',
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-orange-50',
      Icon: Users,
      iconColor: 'text-orange-500',
      dot: 'bg-orange-400',
    },
    {
      label: t('centersMap.housingListings'),
      value: totalHousingSpots,
      color: 'text-purple-600',
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-purple-50',
      Icon: Home,
      iconColor: 'text-purple-600',
      dot: 'bg-purple-400',
    },
  ];

  return (
    <>
      {/* Popup style — removes default Leaflet padding so colored headers bleed edge-to-edge */}
      <style>{`
        .nasna-popup .leaflet-popup-content{margin:0 !important}
        .nasna-popup .leaflet-popup-content-wrapper{overflow:hidden !important}
        .ds-wrap{position:relative;width:30px;height:42px}
        .ds-pulse{position:absolute;bottom:-4px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:rgba(251,146,60,0.55);animation:ds-pulse 2.2s ease-out infinite}
        .ds-pulse-2{animation-delay:1.1s}
        .ds-pin{position:absolute;top:0;left:50%;margin-left:-13px;width:26px;height:26px;background:linear-gradient(135deg,#fb923c,#ea580c);border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(234,88,12,0.5)}
        .ds-icon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);margin-top:-2px;margin-left:2px}
        @keyframes ds-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(5.5);opacity:0}}
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 lg:py-12 lg:space-y-8">
        {/* ── Hero header ── */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-white border border-teal-100/60 px-6 py-8 shadow-sm lg:px-10">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#12a89d]/10 border border-[#12a89d]/20">
              <MapPin className="h-7 w-7 text-[#12a89d]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('centersMap.title')}</h1>
              <p className="mt-1.5 text-base text-muted-foreground max-w-lg">
                {t('centersMap.description')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat cards — pill row on mobile, cards on desktop ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="flex-none rounded-full border border-gray-200 bg-white px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${stat.dot}`} />
              <span className={`font-bold text-base ${stat.color}`}>{stat.value}</span>
              <span className="text-gray-600 whitespace-nowrap">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="hidden sm:grid gap-4 sm:grid-cols-3">
          {statCards.map((stat) => {
            const StatIcon = stat.Icon;
            return (
              <Card key={stat.label} className={`border-l-4 ${stat.borderColor} overflow-hidden`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`rounded-xl p-2.5 ${stat.bgColor}`}>
                      <StatIcon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Map + floating layer controls ── */}
        <div className="relative">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Full viewport height on mobile, taller fixed height on desktop */}
              <div className="h-[calc(100vh-4rem)] lg:h-[620px]">
                <MapContainer
                  center={[33.8547, 35.8623]}
                  zoom={8}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* === AID CENTER MARKERS === */}
                  {showCenters &&
                    centers.map((center) => {
                      const pct =
                        center.totalCapacity > 0
                          ? center.currentOccupancy / center.totalCapacity
                          : 0;
                      const intakeOpen =
                        center.intakeOpen !== undefined
                          ? center.intakeOpen
                          : center.currentOccupancy < center.totalCapacity;
                      const barColor =
                        pct > 0.9 ? '#ef4444' : pct >= 0.75 ? '#facc15' : '#4ade80';

                      return (
                        <Marker
                          key={`center-${center.id}`}
                          position={[center.lat, center.lng]}
                          icon={centerIcon}
                        >
                          <Popup className="nasna-popup" minWidth={220}>
                            <div className="text-sm">
                              {/* Teal header band */}
                              <div className="bg-[#12a89d] px-4 py-3">
                                <p className="font-semibold text-white leading-tight">
                                  {center.name}
                                </p>
                                <p className="text-teal-100 text-xs mt-0.5">
                                  {center.city ? `${center.city}, ` : ''}
                                  {center.governorate}
                                </p>
                              </div>
                              {/* Body */}
                              <div className="px-4 py-3 space-y-2">
                                {center.address && (
                                  <p className="text-xs text-gray-500">{center.address}</p>
                                )}
                                {/* Occupancy */}
                                <div>
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>{t('centersMap.capacity')}</span>
                                    <span className="font-medium">
                                      {center.currentOccupancy}/{center.totalCapacity}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(100, pct * 100)}%`,
                                        backgroundColor: barColor,
                                      }}
                                    />
                                  </div>
                                </div>
                                {/* Intake badge */}
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                    intakeOpen
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {intakeOpen
                                    ? t('centersMap.intakeOpen')
                                    : t('centersMap.intakeClosed')}
                                </span>
                                {/* Phone */}
                                {center.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    <a
                                      href={`tel:${center.phone}`}
                                      className="text-[#12a89d] underline text-xs"
                                    >
                                      {center.phone}
                                    </a>
                                  </div>
                                )}
                                {/* Operating hours */}
                                {center.operatingHours && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    <span>{center.operatingHours}</span>
                                  </div>
                                )}
                                {/* Aid services */}
                                {(center.aidServices ?? []).length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      {t('centersMap.aidServices')}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {center.aidServices!.map((service) => (
                                        <span
                                          key={service}
                                          className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                                        >
                                          {service}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                  {/* === DISPLACEMENT SITES === */}
                  {showDisplacementSites &&
                    displacementSites.map((site, index) => (
                      <Marker
                        key={`site-${index}`}
                        position={[site.latitude, site.longitude]}
                        icon={displacementIcon}
                      >
                        <Popup className="nasna-popup" minWidth={220}>
                          <div className="text-sm">
                            {/* Orange header band */}
                            <div className="bg-orange-500 px-4 py-3">
                              <p className="font-semibold text-white leading-tight">
                                {site.place_name_arabic}
                              </p>
                              <p className="text-orange-100 text-xs mt-0.5">
                                {site.place_name_english}
                              </p>
                            </div>
                            {/* Body */}
                            <div className="px-4 py-3 space-y-2">
                              <div className="flex items-center gap-2 text-gray-700">
                                <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span>{site.contact_person}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <a
                                  href={`tel:${site.phone_number}`}
                                  className="text-[#12a89d] underline"
                                >
                                  {site.phone_number}
                                </a>
                              </div>
                              <a
                                href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-[#12a89d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0e9088]"
                              >
                                <Navigation className="h-3.5 w-3.5" />
                                {t('centersMap.getDirections')}
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                  {/* === HOUSING AREAS === */}
                  {showHousing &&
                    housingAreas.map((area) => (
                      <CircleMarker
                        key={`housing-${area.area}`}
                        center={[area.lat, area.lng]}
                        radius={Math.max(6, Math.min(18, area.listingCount * 2))}
                        pathOptions={{
                          color: '#7c3aed',
                          fillColor: '#c4b5fd',
                          fillOpacity: 0.55,
                        }}
                      >
                        <Popup className="nasna-popup" minWidth={180}>
                          <div className="text-sm">
                            {/* Purple header band */}
                            <div className="bg-purple-600 px-4 py-3">
                              <p className="font-semibold text-white">{area.area}</p>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-gray-700">
                                {t('centersMap.availableSpots')}{' '}
                                <span className="font-semibold">{area.availableCapacity}</span>
                              </p>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* ── Floating layer panel — desktop only, overlaid top-left ── */}
          <div className="hidden lg:block absolute top-4 left-4 z-[500]">
            <div className="w-52 rounded-2xl border border-white/60 bg-white/90 shadow-xl backdrop-blur-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">{t('centersMap.layers')}</p>
              <div className="space-y-3">
                {layerControls.map((layer) => (
                  <div key={layer.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={layer.checked}
                      onCheckedChange={(checked) => layer.set(Boolean(checked))}
                    />
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${layer.dot} shrink-0`}
                    />
                    <Label className="text-sm cursor-pointer">{layer.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Mobile bottom sheet — layer controls (hidden on lg+) ── */}
          <div className="lg:hidden">
            {/* Toggle button fixed at bottom of viewport */}
            <button
              type="button"
              onClick={() => setBottomSheetOpen((prev) => !prev)}
              className="fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-[#12a89d] px-5 py-2.5 text-sm font-medium text-white shadow-lg"
            >
              {t('centersMap.layers')} {bottomSheetOpen ? '▼' : '▲'}
            </button>

            {/* Sheet slides up from bottom */}
            <div
              className={`fixed bottom-0 left-0 right-0 z-[999] rounded-t-2xl border-t border-gray-200 bg-white shadow-xl transition-transform duration-300 ${
                bottomSheetOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              {/* Drag handle */}
              <div className="mx-auto mt-3 mb-1 h-1 w-12 rounded-full bg-gray-300" />
              <div className="px-6 pb-8 pt-2 space-y-4">
                <p className="font-semibold text-gray-900">{t('centersMap.layers')}</p>
                {layerControls.map((layer) => (
                  <div key={layer.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={layer.checked}
                      onCheckedChange={(checked) => layer.set(Boolean(checked))}
                    />
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${layer.dot} shrink-0`}
                    />
                    <Label>{layer.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
