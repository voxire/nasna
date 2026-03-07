import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getOperationsMapData,
  type CenterMarker,
  type HousingAreaSummary,
  type NgoCoverageSummary,
  type SubmissionCluster,
} from '@/services/operationsMap';
import displacementSitesData from '@/data/displacementSites.json';

interface DisplacementSite {
  place_name_arabic: string;
  place_name_english: string;
  contact_person: string;
  phone_number: string;
  latitude: number;
  longitude: number;
}

const displacementSites = displacementSitesData as DisplacementSite[];
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';

const centerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function OperationsMap() {
  const { t } = useTranslation();
  const [submissionClusters, setSubmissionClusters] = useState<SubmissionCluster[]>([]);
  const [ngoCoverage, setNgoCoverage] = useState<NgoCoverageSummary[]>([]);
  const [centers, setCenters] = useState<CenterMarker[]>([]);
  const [housingAreas, setHousingAreas] = useState<HousingAreaSummary[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showHousing, setShowHousing] = useState(true);
  const [showNgoCoverage, setShowNgoCoverage] = useState(true);
  const [showDisplacementSites, setShowDisplacementSites] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await getOperationsMapData();
        setSubmissionClusters(data.submissionClusters);
        setNgoCoverage(data.ngoCoverage);
        setCenters(data.centers);
        setHousingAreas(data.housingAreas);
      } catch {
        setError(t('admin.map.loadError'));
        toast.error(t('admin.map.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const summary = useMemo(
    () => ({
      mappedGovernorates: submissionClusters.length,
      totalPending: submissionClusters.reduce((total, item) => total + item.pendingCount, 0),
      totalUrgent: submissionClusters.reduce((total, item) => total + item.urgentCount, 0),
      totalHousing: housingAreas.reduce((total, item) => total + item.availableSpots, 0),
    }),
    [housingAreas, submissionClusters],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.map.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('admin.map.description')}</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.map.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.map.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.map.mappedGovernorates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.mappedGovernorates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.map.pendingCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.map.urgentCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalUrgent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.map.housingSpots')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalHousing}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.map.layers')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: 'submissions',
                label: t('admin.map.submissionClusters'),
                checked: showSubmissions,
                set: setShowSubmissions,
              },
              {
                id: 'ngoCoverage',
                label: t('admin.map.ngoCoverage'),
                checked: showNgoCoverage,
                set: setShowNgoCoverage,
              },
              {
                id: 'centers',
                label: t('admin.map.centers'),
                checked: showCenters,
                set: setShowCenters,
              },
              {
                id: 'housing',
                label: t('admin.map.housingAreas'),
                checked: showHousing,
                set: setShowHousing,
              },
              {
                id: 'displacementSites',
                label: t('admin.map.displacementSites'),
                checked: showDisplacementSites,
                set: setShowDisplacementSites,
              },
            ].map((layer) => (
              <div key={layer.id} className="flex items-center gap-3">
                <Checkbox
                  checked={layer.checked}
                  onCheckedChange={(checked) => layer.set(Boolean(checked))}
                />
                <Label>{layer.label}</Label>
              </div>
            ))}

            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-800">{t('admin.map.privacyModel')}</p>
              <p className="mt-2">{t('admin.map.privacyDescription')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <MapContainer
              center={[33.8547, 35.8623]}
              zoom={8}
              style={{ height: '640px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showSubmissions &&
                submissionClusters.map((cluster) => (
                  <CircleMarker
                    key={`submission-${cluster.governorate}`}
                    center={[cluster.lat, cluster.lng]}
                    radius={Math.max(8, Math.min(24, cluster.count * 2))}
                    pathOptions={{
                      color: cluster.urgentCount > 0 ? '#dc2626' : '#0f766e',
                      fillColor: cluster.urgentCount > 0 ? '#f87171' : '#14b8a6',
                      fillOpacity: 0.65,
                    }}
                  >
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{cluster.governorate}</p>
                        <p>
                          {t('admin.map.totalCases')} {cluster.count}
                        </p>
                        <p>
                          {t('admin.map.pending')} {cluster.pendingCount}
                        </p>
                        <p>
                          {t('admin.map.urgent')} {cluster.urgentCount}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

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
                        <p>
                          {t('admin.map.capacity')} {center.occupiedCapacity}/{center.capacity}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
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
                          {t('admin.map.listings')} {area.listingCount}
                        </p>
                        <p>
                          {t('admin.map.availableSpots')} {area.availableSpots}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

              {showNgoCoverage &&
                ngoCoverage.flatMap((ngo) =>
                  ngo.coordinates.map((coordinate) => (
                    <CircleMarker
                      key={`ngo-${ngo.id}-${coordinate.governorate}`}
                      center={[coordinate.lat, coordinate.lng]}
                      radius={4}
                      pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 0.8 }}
                    >
                      <Popup>
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold">{ngo.name}</p>
                          <p>
                            {t('admin.map.coverage')} {coordinate.governorate}
                          </p>
                          <p>
                            {t('admin.map.centerIds')} {ngo.centerIds.length}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )),
                )}

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
                          {t('admin.map.contact')} {site.contact_person}
                        </p>
                        <p>
                          {t('admin.map.phone')} {site.phone_number}
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
