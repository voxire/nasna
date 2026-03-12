import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPublicCentersMapData,
  type CenterMarker,
  type HousingAreaSummary,
} from '@/services/operationsMap';
import displacementSitesData from '@/data/displacementSites.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

  const totalHousingSpots = housingAreas.reduce((sum, h) => sum + h.availableSpots, 0);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 lg:py-10 lg:space-y-6">
      <div className="flex items-start gap-3">
        <MapPin className="h-7 w-7 text-[#12a89d] mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('centersMap.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('centersMap.description')}</p>
        </div>
      </div>

      {/* Stat cards — compact pill row on mobile (< sm), grid on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
        {[
          { label: t('centersMap.totalCenters'), value: centers.length, color: 'text-[#12a89d]' },
          {
            label: t('centersMap.displacementSitesCount'),
            value: displacementSites.length,
            color: 'text-orange-500',
          },
          {
            label: t('centersMap.housingListings'),
            value: totalHousingSpots,
            color: 'text-purple-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-none rounded-full border border-gray-200 bg-white px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
          >
            <span className={`font-bold text-base ${stat.color}`}>{stat.value}</span>
            <span className="text-gray-600 whitespace-nowrap">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="hidden sm:grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('centersMap.totalCenters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#12a89d]">{centers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('centersMap.displacementSitesCount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{displacementSites.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('centersMap.housingListings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{totalHousingSpots}</p>
          </CardContent>
        </Card>
      </div>

      {/* Map + layer controls */}
      <div className="lg:grid lg:gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Desktop sidebar — hidden on mobile */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>{t('centersMap.layers')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {layerControls.map((layer) => (
              <div key={layer.id} className="flex items-center gap-3">
                <Checkbox
                  checked={layer.checked}
                  onCheckedChange={(checked) => layer.set(Boolean(checked))}
                />
                <span className={`inline-block h-3 w-3 rounded-full ${layer.dot} shrink-0`} />
                <Label>{layer.label}</Label>
              </div>
            ))}

            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 mt-2">
              <p className="font-medium text-gray-800">{t('centersMap.legendTitle')}</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>{t('centersMap.legendCenters')}</li>
                <li>{t('centersMap.legendDisplacement')}</li>
                <li>{t('centersMap.legendHousing')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Map container */}
        <div className="relative">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Full viewport height on mobile, fixed on desktop */}
              <div className="h-[calc(100vh-4rem)] lg:h-[580px]">
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
                        center.capacity > 0 ? center.occupiedCapacity / center.capacity : 0;
                      const intakeOpen =
                        center.intakeOpen !== undefined
                          ? center.intakeOpen
                          : center.occupiedCapacity < center.capacity;
                      const barColor =
                        pct > 0.9 ? '#ef4444' : pct >= 0.75 ? '#facc15' : '#4ade80';

                      return (
                        <Marker
                          key={`center-${center.id}`}
                          position={[center.lat, center.lng]}
                          icon={centerIcon}
                        >
                          <Popup>
                            <div className="space-y-1.5 text-sm min-w-[180px]">
                              <p className="font-semibold">{center.name}</p>
                              <p>
                                {center.city ? `${center.city}, ` : ''}
                                {center.governorate}
                              </p>
                              {center.address && (
                                <p className="text-muted-foreground">{center.address}</p>
                              )}
                              {/* Occupancy progress bar */}
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  {t('centersMap.capacity')} {center.occupiedCapacity}/
                                  {center.capacity}
                                </p>
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
                              {/* Tappable phone */}
                              {center.phone && (
                                <p>
                                  {t('centersMap.phone')}{' '}
                                  <a
                                    href={`tel:${center.phone}`}
                                    className="text-[#12a89d] underline"
                                  >
                                    {center.phone}
                                  </a>
                                </p>
                              )}
                              {/* Aid services badges */}
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
                              {/* Operating hours */}
                              {center.operatingHours && (
                                <p className="text-xs text-gray-600">
                                  {t('centersMap.operatingHours')} {center.operatingHours}
                                </p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                  {/* === DISPLACEMENT SITES === */}
                  {showDisplacementSites &&
                    displacementSites.map((site, index) => (
                      <CircleMarker
                        key={`site-${index}`}
                        center={[site.latitude, site.longitude]}
                        radius={7}
                        pathOptions={{
                          color: '#ea580c',
                          fillColor: '#fb923c',
                          fillOpacity: 0.8,
                        }}
                      >
                        <Popup>
                          <div className="space-y-1.5 text-sm min-w-[180px]">
                            <p className="font-semibold">{site.place_name_arabic}</p>
                            <p className="text-muted-foreground">{site.place_name_english}</p>
                            <p>
                              {t('centersMap.contact')} {site.contact_person}
                            </p>
                            <p>
                              {t('centersMap.phone')}{' '}
                              <a
                                href={`tel:${site.phone_number}`}
                                className="text-[#12a89d] underline"
                              >
                                {site.phone_number}
                              </a>
                            </p>
                            <a
                              href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 block rounded-md bg-[#12a89d] px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-[#0e9088]"
                            >
                              {t('centersMap.getDirections')}
                            </a>
                          </div>
                        </Popup>
                      </CircleMarker>
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
                        <Popup>
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold">{area.area}</p>
                            <p>
                              {t('centersMap.availableSpots')} {area.availableSpots}
                            </p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Mobile bottom sheet — layer controls (hidden on lg+) */}
          <div className="lg:hidden">
            {/* Toggle button fixed at bottom of viewport */}
            <button
              type="button"
              onClick={() => setBottomSheetOpen((prev) => !prev)}
              className="fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-lg"
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
                      className={`inline-block h-3 w-3 rounded-full ${layer.dot} shrink-0`}
                    />
                    <Label>{layer.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
