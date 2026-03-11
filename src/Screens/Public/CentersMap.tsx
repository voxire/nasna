import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicCentersMapData, type CenterMarker, type HousingAreaSummary } from '@/services/operationsMap';
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

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-start gap-3">
        <MapPin className="h-7 w-7 text-[#12a89d] mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('centersMap.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('centersMap.description')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
            <p className="text-3xl font-bold text-purple-600">
              {housingAreas.reduce((sum, h) => sum + h.availableSpots, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('centersMap.layers')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: 'centers',
                label: t('centersMap.aidCenters'),
                checked: showCenters,
                set: setShowCenters,
                color: 'text-[#12a89d]',
                dot: 'bg-[#12a89d]',
              },
              {
                id: 'displacementSites',
                label: t('centersMap.displacementSites'),
                checked: showDisplacementSites,
                set: setShowDisplacementSites,
                color: 'text-orange-500',
                dot: 'bg-orange-400',
              },
              {
                id: 'housing',
                label: t('centersMap.housingAreas'),
                checked: showHousing,
                set: setShowHousing,
                color: 'text-purple-600',
                dot: 'bg-purple-400',
              },
            ].map((layer) => (
              <div key={layer.id} className="flex items-center gap-3">
                <Checkbox
                  checked={layer.checked}
                  onCheckedChange={(checked) => layer.set(Boolean(checked))}
                />
                <span className={`inline-block h-3 w-3 rounded-full ${layer.dot} shrink-0`} />
                <Label className={layer.color}>{layer.label}</Label>
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

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <MapContainer
              center={[33.8547, 35.8623]}
              zoom={8}
              style={{ height: '580px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showCenters &&
                centers.map((center) => (
                  <Marker
                    key={`center-${center.id}`}
                    position={[center.lat, center.lng]}
                    icon={centerIcon}
                  >
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{center.name}</p>
                        <p>
                          {center.city}, {center.governorate}
                        </p>
                        {center.address && <p className="text-muted-foreground">{center.address}</p>}
                        <p>
                          {t('centersMap.capacity')} {center.occupiedCapacity}/{center.capacity}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {showDisplacementSites &&
                displacementSites.map((site, index) => (
                  <CircleMarker
                    key={`site-${index}`}
                    center={[site.latitude, site.longitude]}
                    radius={7}
                    pathOptions={{ color: '#ea580c', fillColor: '#fb923c', fillOpacity: 0.8 }}
                  >
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{site.place_name_arabic}</p>
                        <p className="text-muted-foreground">{site.place_name_english}</p>
                        <p>
                          {t('centersMap.contact')} {site.contact_person}
                        </p>
                        <p>
                          {t('centersMap.phone')} {site.phone_number}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

              {showHousing &&
                housingAreas.map((area) => (
                  <CircleMarker
                    key={`housing-${area.area}`}
                    center={[area.lat, area.lng]}
                    radius={Math.max(6, Math.min(18, area.listingCount * 2))}
                    pathOptions={{ color: '#7c3aed', fillColor: '#c4b5fd', fillOpacity: 0.55 }}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
