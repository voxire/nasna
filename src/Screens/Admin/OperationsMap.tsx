import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import L, { type DivIcon, type LatLngExpression } from 'leaflet';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore';
import { ChevronLeft, ChevronRight, MapPinned, RefreshCw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/firebase';
import type {
  CenterDocument,
  HousingDocument,
  MemberDocument,
  SubmissionDocument,
  SubmissionStatus,
} from '@/types';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';

const LEBANON_CENTER: [number, number] = [33.8547, 35.8623];
const LEBANON_ZOOM = 8;
const SUBMISSION_LIMIT = 200;
const CLUSTER_ZOOM_THRESHOLD = 11;
const NEED_OPTIONS = [
  'food',
  'water',
  'shelter',
  'hygiene',
  'medical',
  'clothing',
  'baby_supplies',
  'psychosocial',
  'legal_docs',
] as const;
const STATUS_OPTIONS: SubmissionStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
];
const DATE_RANGE_OPTIONS = ['24h', '48h', '7d', 'all'] as const;

type DateRangeOption = (typeof DATE_RANGE_OPTIONS)[number];
type LayerKey = 'submissions' | 'ngoCoverage' | 'centers' | 'housing';

type GovernoratePolygon = {
  key: string;
  label: string;
  polygon: LatLngExpression[];
  center: [number, number];
};

type SubmissionMapRow = SubmissionDocument & {
  id: string;
};

type NgoCoverageRow = MemberDocument & {
  id: string;
};

type CenterMapRow = CenterDocument & {
  id: string;
};

type HousingMapRow = HousingDocument & {
  id: string;
};

type SubmissionSeverity = 'red' | 'orange' | 'yellow' | 'blue' | 'green' | 'gray';

type SubmissionMarker = {
  id: string;
  lat: number;
  lng: number;
  governorate: string;
  needs: string[];
  status: SubmissionStatus;
  staleFlagged: boolean;
  createdAtMs: number;
  severity: SubmissionSeverity;
};

type SubmissionCluster = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  markers: SubmissionMarker[];
  severity: SubmissionSeverity;
};

type FilterState = {
  dateRange: DateRangeOption;
  statuses: SubmissionStatus[];
  needs: string[];
  staleOnly: boolean;
  layers: Record<LayerKey, boolean>;
};

const DEFAULT_FILTERS: FilterState = {
  dateRange: 'all',
  statuses: [...STATUS_OPTIONS],
  needs: [],
  staleOnly: false,
  layers: {
    submissions: true,
    ngoCoverage: false,
    centers: true,
    housing: false,
  },
};

const GOVERNORATE_POLYGONS: GovernoratePolygon[] = [
  {
    key: 'Akkar',
    label: 'Akkar',
    center: [34.56, 36.12],
    polygon: [
      [34.7, 36.03],
      [34.66, 36.22],
      [34.48, 36.26],
      [34.4, 36.07],
      [34.52, 35.98],
    ],
  },
  {
    key: 'North Lebanon',
    label: 'North Lebanon',
    center: [34.34, 35.88],
    polygon: [
      [34.48, 35.7],
      [34.52, 35.96],
      [34.34, 36.05],
      [34.15, 35.96],
      [34.1, 35.73],
      [34.24, 35.63],
    ],
  },
  {
    key: 'Baalbek-Hermel',
    label: 'Baalbek-Hermel',
    center: [34.02, 36.31],
    polygon: [
      [34.25, 36.05],
      [34.36, 36.4],
      [34.12, 36.58],
      [33.78, 36.55],
      [33.72, 36.2],
      [33.89, 36.01],
    ],
  },
  {
    key: 'Bekaa',
    label: 'Bekaa',
    center: [33.82, 35.95],
    polygon: [
      [34.02, 35.73],
      [34.08, 36.03],
      [33.88, 36.18],
      [33.56, 36.1],
      [33.54, 35.78],
      [33.72, 35.67],
    ],
  },
  {
    key: 'Mount Lebanon',
    label: 'Mount Lebanon',
    center: [33.82, 35.63],
    polygon: [
      [34.1, 35.46],
      [34.03, 35.76],
      [33.73, 35.84],
      [33.56, 35.7],
      [33.63, 35.43],
      [33.86, 35.36],
    ],
  },
  {
    key: 'Beirut',
    label: 'Beirut',
    center: [33.8938, 35.5018],
    polygon: [
      [33.93, 35.46],
      [33.93, 35.54],
      [33.86, 35.55],
      [33.85, 35.48],
    ],
  },
  {
    key: 'South Lebanon',
    label: 'South Lebanon',
    center: [33.32, 35.3],
    polygon: [
      [33.56, 35.08],
      [33.58, 35.42],
      [33.34, 35.53],
      [33.08, 35.42],
      [33.1, 35.12],
      [33.27, 35.02],
    ],
  },
  {
    key: 'Nabatieh',
    label: 'Nabatieh',
    center: [33.42, 35.49],
    polygon: [
      [33.58, 35.39],
      [33.61, 35.64],
      [33.39, 35.73],
      [33.26, 35.55],
      [33.31, 35.37],
    ],
  },
];

const GOVERNORATE_LOOKUP = new Map(
  GOVERNORATE_POLYGONS.map((governorate) => [governorate.key, governorate]),
);

const submissionColorMap: Record<SubmissionSeverity, { stroke: string; fill: string }> = {
  red: { stroke: '#b91c1c', fill: '#ef4444' },
  orange: { stroke: '#c2410c', fill: '#fb923c' },
  yellow: { stroke: '#a16207', fill: '#facc15' },
  blue: { stroke: '#1d4ed8', fill: '#60a5fa' },
  green: { stroke: '#15803d', fill: '#4ade80' },
  gray: { stroke: '#4b5563', fill: '#9ca3af' },
};

function normalizeGovernorateLabel(governorate?: string) {
  if (!governorate) return '';

  const normalized = governorate.trim().toLowerCase();
  const aliases: Record<string, string> = {
    akkar: 'Akkar',
    'north lebanon': 'North Lebanon',
    north: 'North Lebanon',
    'baalbek-hermel': 'Baalbek-Hermel',
    baalbek: 'Baalbek-Hermel',
    beqaa: 'Bekaa',
    bekaa: 'Bekaa',
    beirut: 'Beirut',
    'mount lebanon': 'Mount Lebanon',
    'south lebanon': 'South Lebanon',
    south: 'South Lebanon',
    nabatieh: 'Nabatieh',
    nabatiyeh: 'Nabatieh',
  };

  return aliases[normalized] ?? governorate.trim();
}

function getGovernoratePolygon(governorate?: string) {
  return GOVERNORATE_LOOKUP.get(normalizeGovernorateLabel(governorate));
}

function getTimestampMs(
  value?: Timestamp | Date | { toDate?: () => Date } | null,
  fallback = Date.now(),
) {
  if (!value) return fallback;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  return fallback;
}

function getSubmissionSeverity(submission: SubmissionMapRow, nowMs: number): SubmissionSeverity {
  const createdAtMs = getTimestampMs(
    submission.registrationDate,
    getTimestampMs(submission.createdAt),
  );
  const ageMs = nowMs - createdAtMs;
  const status = submission.status ?? 'pending';

  if (submission.staleFlagged) return 'red';
  if (status === 'completed') return 'green';
  if (status === 'assigned' || status === 'in_progress') return 'blue';
  if (status === 'cancelled') return 'gray';
  if (status === 'pending' && ageMs > 24 * 60 * 60 * 1000) return 'orange';
  return 'yellow';
}

function getCaseCoordinates(submission: SubmissionMapRow): [number, number] {
  if (submission.locationType === 'center' && submission.centerId) {
    const centerGovernorate = getGovernoratePolygon(submission.currentGovernorate)?.center;
    if (centerGovernorate) return centerGovernorate;
  }

  const governorate = getGovernoratePolygon(submission.currentGovernorate);
  if (!governorate) return LEBANON_CENTER;

  const hash = submission.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) ?? 0;
  const latOffset = ((hash % 13) - 6) * 0.01;
  const lngOffset = ((Math.floor(hash / 13) % 13) - 6) * 0.01;
  return [governorate.center[0] + latOffset, governorate.center[1] + lngOffset];
}

function formatRelativeTime(
  createdAtMs: number,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const diffMinutes = Math.max(1, Math.floor((Date.now() - createdAtMs) / (60 * 1000)));
  if (diffMinutes < 60) return t('admin.map.time.minutesAgo', { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t('admin.map.time.hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t('admin.map.time.daysAgo', { count: diffDays });
}

function matchesDateRange(createdAtMs: number, range: DateRangeOption) {
  if (range === 'all') return true;
  const diffMs = Date.now() - createdAtMs;
  const limits: Record<Exclude<DateRangeOption, 'all'>, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  return diffMs <= limits[range];
}

function buildClusterIcon(count: number, severity: SubmissionSeverity): DivIcon {
  const colors = submissionColorMap[severity];
  return L.divIcon({
    className: '',
    html: `<div style="background:${colors.fill};border:2px solid ${colors.stroke};color:#111827;width:34px;height:34px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 4px 10px rgba(0,0,0,0.18)">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function buildCenterIcon(occupancyRatio: number): DivIcon {
  let background = '#4ade80';
  let border = '#15803d';
  if (occupancyRatio > 0.9) {
    background = '#f87171';
    border = '#b91c1c';
  } else if (occupancyRatio >= 0.75) {
    background = '#facc15';
    border = '#a16207';
  }

  return L.divIcon({
    className: '',
    html: `<div style="background:${background};border:2px solid ${border};width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.18)">🏫</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const housingIcon = L.divIcon({
  className: '',
  html: '<div style="background:#e9d5ff;border:2px solid #7c3aed;width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 10px rgba(0,0,0,0.18)">🏠</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function clusterSubmissionMarkers(markers: SubmissionMarker[], zoom: number): SubmissionCluster[] {
  if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
    return markers.map((marker) => ({
      id: marker.id,
      lat: marker.lat,
      lng: marker.lng,
      count: 1,
      markers: [marker],
      severity: marker.severity,
    }));
  }

  const cellSize = zoom <= 8 ? 0.3 : zoom === 9 ? 0.2 : 0.12;
  const severityRank: SubmissionSeverity[] = ['red', 'orange', 'yellow', 'blue', 'green', 'gray'];
  const clusters = new Map<string, SubmissionCluster>();

  for (const marker of markers) {
    const latBucket = Math.floor(marker.lat / cellSize);
    const lngBucket = Math.floor(marker.lng / cellSize);
    const key = `${latBucket}:${lngBucket}`;
    const existing = clusters.get(key);

    if (!existing) {
      clusters.set(key, {
        id: key,
        lat: marker.lat,
        lng: marker.lng,
        count: 1,
        markers: [marker],
        severity: marker.severity,
      });
      continue;
    }

    existing.markers.push(marker);
    existing.count += 1;
    existing.lat =
      existing.markers.reduce((sum, item) => sum + item.lat, 0) / existing.markers.length;
    existing.lng =
      existing.markers.reduce((sum, item) => sum + item.lng, 0) / existing.markers.length;
    if (severityRank.indexOf(marker.severity) < severityRank.indexOf(existing.severity)) {
      existing.severity = marker.severity;
    }
  }

  return Array.from(clusters.values());
}

function MapViewportSync({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (event) => {
      onZoomChange(event.target.getZoom());
    },
  });

  return null;
}

export default function OperationsMap() {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [mapZoom, setMapZoom] = useState(LEBANON_ZOOM);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionMapRow[]>([]);
  const [submissionCapped, setSubmissionCapped] = useState(false);
  const [ngoCoverage, setNgoCoverage] = useState<NgoCoverageRow[]>([]);
  const [centers, setCenters] = useState<CenterMapRow[]>([]);
  const [housing, setHousing] = useState<HousingMapRow[]>([]);

  const loadSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    setSubmissionError(null);

    try {
      const constraints: QueryConstraint[] = [
        orderBy('registrationDate', 'desc'),
        limit(SUBMISSION_LIMIT),
      ];
      const snapshot = await getDocs(query(collection(db, 'submissions'), ...constraints));
      setSubmissions(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as SubmissionDocument),
        })),
      );
      setSubmissionCapped(snapshot.size >= SUBMISSION_LIMIT);
    } catch (error) {
      console.error('operations submissions fetch failed', error);
      setSubmissionError(t('admin.map.loadError'));
      toast.error(t('admin.map.loadError'));
    } finally {
      setLoadingSubmissions(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    const ngoQuery = query(
      collection(db, 'members'),
      where('role', '==', 'member'),
      where('validated', '==', true),
      limit(200),
    );
    const centerQuery = query(collection(db, 'centers'), where('isActive', '==', true), limit(100));
    const housingQuery = query(
      collection(db, 'housing'),
      where('status', '==', 'available'),
      limit(100),
    );

    const unsubscribeNgo = onSnapshot(
      ngoQuery,
      (snapshot) => {
        setNgoCoverage(
          snapshot.docs
            .map((document) => ({
              id: document.id,
              ...(document.data() as MemberDocument),
            }))
            .filter((member) => (member.coverageGovernorates ?? []).length > 0),
        );
      },
      (error) => {
        console.error('operations NGO coverage listener failed', error);
        toast.error(t('admin.map.loadError'));
      },
    );

    const unsubscribeCenters = onSnapshot(
      centerQuery,
      (snapshot) => {
        setCenters(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as CenterDocument),
          })),
        );
      },
      (error) => {
        console.error('operations centers listener failed', error);
        toast.error(t('admin.map.loadError'));
      },
    );

    const unsubscribeHousing = onSnapshot(
      housingQuery,
      (snapshot) => {
        setHousing(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as HousingDocument),
          })),
        );
      },
      (error) => {
        console.error('operations housing listener failed', error);
        toast.error(t('admin.map.loadError'));
      },
    );

    return () => {
      unsubscribeNgo();
      unsubscribeCenters();
      unsubscribeHousing();
    };
  }, [t]);

  const filteredSubmissionMarkers = useMemo(() => {
    const nowMs = Date.now();

    return submissions
      .filter((submission) =>
        filters.statuses.includes((submission.status ?? 'pending') as SubmissionStatus),
      )
      .filter((submission) => !filters.staleOnly || submission.staleFlagged === true)
      .filter((submission) => {
        const createdAtMs = getTimestampMs(
          submission.registrationDate,
          getTimestampMs(submission.createdAt),
        );
        return matchesDateRange(createdAtMs, filters.dateRange);
      })
      .filter((submission) => {
        if (filters.needs.length === 0) return true;
        const needs = submission.needs ?? [];
        return filters.needs.some((need) => needs.includes(need));
      })
      .map((submission) => {
        const createdAtMs = getTimestampMs(
          submission.registrationDate,
          getTimestampMs(submission.createdAt),
        );
        const [lat, lng] = getCaseCoordinates(submission);
        return {
          id: submission.id,
          lat,
          lng,
          governorate: submission.currentGovernorate,
          needs: submission.needs ?? [],
          status: submission.status ?? 'pending',
          staleFlagged: submission.staleFlagged === true,
          createdAtMs,
          severity: getSubmissionSeverity(submission, nowMs),
        } satisfies SubmissionMarker;
      });
  }, [filters.dateRange, filters.needs, filters.staleOnly, filters.statuses, submissions]);

  const clusteredSubmissions = useMemo(
    () => clusterSubmissionMarkers(filteredSubmissionMarkers, mapZoom),
    [filteredSubmissionMarkers, mapZoom],
  );

  const totalCenterCapacity = centers.reduce(
    (sum, center) => sum + Number(center.totalCapacity ?? 0),
    0,
  );
  const totalHousingCapacity = housing.reduce((sum, item) => sum + Number(item.capacity ?? 0), 0);

  return (
    <div className="relative h-[calc(100vh-56px)] w-full overflow-hidden bg-slate-100">
      <MapContainer
        center={LEBANON_CENTER}
        zoom={LEBANON_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        <MapViewportSync onZoomChange={setMapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filters.layers.ngoCoverage &&
          ngoCoverage.flatMap((member) =>
            (member.coverageGovernorates ?? [])
              .map((governorate) => getGovernoratePolygon(governorate))
              .filter(Boolean)
              .map((governorate) => (
                <Polygon
                  key={`${member.id}-${governorate?.key}`}
                  positions={governorate!.polygon}
                  pathOptions={{
                    color: '#1d4ed8',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.14,
                    weight: 2,
                  }}
                >
                  <Tooltip sticky>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">{member.name}</p>
                      <p>{governorate!.label}</p>
                      <p>
                        {t('admin.map.popup.currentLoad')} {member.currentCaseLoad ?? 0}/
                        {member.maxCaseLoad ?? 0}
                      </p>
                    </div>
                  </Tooltip>
                </Polygon>
              )),
          )}

        {filters.layers.submissions &&
          clusteredSubmissions.map((cluster) =>
            cluster.count === 1 ? (
              <CircleMarker
                key={cluster.id}
                center={[cluster.lat, cluster.lng]}
                radius={7}
                pathOptions={{
                  color: submissionColorMap[cluster.severity].stroke,
                  fillColor: submissionColorMap[cluster.severity].fill,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.caseId')}</span>{' '}
                      {cluster.markers[0].id}
                    </p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.governorate')}</span>{' '}
                      {cluster.markers[0].governorate || '—'}
                    </p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.status')}</span>{' '}
                      {cluster.markers[0].status}
                    </p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.stale')}</span>{' '}
                      {cluster.markers[0].staleFlagged
                        ? t('admin.map.popup.yes')
                        : t('admin.map.popup.no')}
                    </p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.created')}</span>{' '}
                      {formatRelativeTime(cluster.markers[0].createdAtMs, t)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cluster.markers[0].needs.length > 0 ? (
                        cluster.markers[0].needs.map((need) => (
                          <span
                            key={`${cluster.markers[0].id}-${need}`}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {t(`submission.needs.${need}`)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">{t('admin.map.popup.none')}</span>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ) : (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={buildClusterIcon(cluster.count, cluster.severity)}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{t('admin.map.popup.clusterTitle')}</p>
                    <p>
                      {t('admin.map.popup.clusterCount')} {cluster.count}
                    </p>
                    <p>{t('admin.map.popup.clusterHint')}</p>
                  </div>
                </Popup>
              </Marker>
            ),
          )}

        {filters.layers.centers &&
          centers.map((center) => {
            const polygon = getGovernoratePolygon(center.governorate);
            const fallback = polygon?.center ?? LEBANON_CENTER;
            const coordinates = center.coordinates
              ? [center.coordinates.lat, center.coordinates.lng]
              : fallback;
            const occupancyRatio =
              Number(center.currentOccupancy ?? 0) / Math.max(1, Number(center.totalCapacity ?? 0));

            return (
              <Marker
                key={center.id}
                position={coordinates as [number, number]}
                icon={buildCenterIcon(occupancyRatio)}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">{center.name}</p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.center.type')}</span>{' '}
                      {center.type}
                    </p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.center.occupancy')}</span>{' '}
                      {center.currentOccupancy}/{center.totalCapacity}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(center.facilities ?? []).length > 0 ? (
                        center.facilities?.map((facility) => (
                          <span
                            key={`${center.id}-${facility}`}
                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                          >
                            {t(`admin.map.facilities.${facility}`)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">{t('admin.map.popup.none')}</span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {filters.layers.housing &&
          housing.map((listing) => {
            const polygon = getGovernoratePolygon(listing.governorate);
            const lat = polygon?.center[0] ?? LEBANON_CENTER[0];
            const lng = polygon?.center[1] ?? LEBANON_CENTER[1];

            return (
              <Marker key={listing.id} position={[lat, lng]} icon={housingIcon}>
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.housing.type')}</span>{' '}
                      {t(`housing.card.type_${listing.type}`)}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t('admin.map.popup.housing.governorate')}
                      </span>{' '}
                      {listing.governorate}
                    </p>
                    <p>
                      <span className="font-semibold">{t('admin.map.popup.housing.capacity')}</span>{' '}
                      {listing.capacity}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t('admin.map.popup.housing.priceType')}
                      </span>{' '}
                      {t(
                        `housing.card.${listing.priceType === 'market_rate' ? 'marketRate' : listing.priceType}`,
                      )}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t('admin.map.popup.housing.availableFrom')}
                      </span>{' '}
                      {listing.availableFrom?.toDate().toLocaleDateString(i18n.language)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] flex flex-col gap-3">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <MapPinned className="h-5 w-5 text-[#12a89d]" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{t('admin.map.title')}</h1>
              <p className="text-xs text-slate-500">{t('admin.map.description')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {t('admin.map.summary.submissions')} {filteredSubmissionMarkers.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {t('admin.map.summary.ngos')} {ngoCoverage.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {t('admin.map.summary.centers')} {centers.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {t('admin.map.summary.housing')} {totalHousingCapacity}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadSubmissions()}
              disabled={loadingSubmissions}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              {t('admin.map.refresh')}
            </Button>
          </div>
        </div>

        {submissionCapped ? (
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 shadow">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <span>{t('admin.map.limitWarning', { count: SUBMISSION_LIMIT })}</span>
          </div>
        ) : null}

        {submissionError ? (
          <div className="pointer-events-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 shadow">
            {submissionError}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setFilterPanelOpen((current) => !current)}
        className="absolute top-28 z-[600] rounded-full border border-slate-200 bg-white p-3 text-slate-700 shadow-lg"
        style={{ insetInlineEnd: filterPanelOpen ? '21.5rem' : '1rem' }}
      >
        {filterPanelOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <aside
        className={`absolute top-24 z-[550] h-[calc(100%-7rem)] w-[20rem] max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white/96 p-4 shadow-2xl backdrop-blur transition-transform ${
          filterPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'
        }`}
        style={{ insetInlineEnd: '1rem' }}
      >
        <div className="space-y-4 text-sm">
          <div>
            <h2 className="font-semibold text-slate-900">{t('admin.map.filters.title')}</h2>
            <p className="text-xs text-slate-500">{t('admin.map.filters.description')}</p>
          </div>

          <section className="space-y-2">
            <p className="font-medium text-slate-800">{t('admin.map.filters.dateRange')}</p>
            <div className="grid grid-cols-2 gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={filters.dateRange === option ? 'default' : 'outline'}
                  className={
                    filters.dateRange === option ? 'bg-[#12a89d] text-white hover:bg-[#0e9088]' : ''
                  }
                  onClick={() => setFilters((current) => ({ ...current, dateRange: option }))}
                >
                  {t(`admin.map.filters.dateOptions.${option}`)}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="font-medium text-slate-800">{t('admin.map.filters.status')}</p>
            <div className="grid gap-2">
              {STATUS_OPTIONS.map((status) => (
                <label key={status} className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={(checked) =>
                      setFilters((current) => ({
                        ...current,
                        statuses: checked
                          ? [...current.statuses, status]
                          : current.statuses.filter((item) => item !== status),
                      }))
                    }
                  />
                  <span>{t(`admin.map.statusLabels.${status}`)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="font-medium text-slate-800">{t('admin.map.filters.needs')}</p>
            <div className="grid gap-2">
              {NEED_OPTIONS.map((need) => (
                <label key={need} className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.needs.includes(need)}
                    onCheckedChange={(checked) =>
                      setFilters((current) => ({
                        ...current,
                        needs: checked
                          ? [...current.needs, need]
                          : current.needs.filter((item) => item !== need),
                      }))
                    }
                  />
                  <span>{t(`submission.needs.${need}`)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="font-medium text-slate-800">{t('admin.map.filters.staleOnly')}</p>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.staleOnly}
                onCheckedChange={(checked) =>
                  setFilters((current) => ({ ...current, staleOnly: checked === true }))
                }
              />
              <span>{t('admin.map.filters.staleOnlyHelp')}</span>
            </label>
          </section>

          <section className="space-y-2">
            <p className="font-medium text-slate-800">{t('admin.map.layers.title')}</p>
            <div className="grid gap-2">
              {(['submissions', 'ngoCoverage', 'centers', 'housing'] as LayerKey[]).map((layer) => (
                <label key={layer} className="flex items-center gap-2">
                  <Checkbox
                    checked={filters.layers[layer]}
                    onCheckedChange={(checked) =>
                      setFilters((current) => ({
                        ...current,
                        layers: {
                          ...current.layers,
                          [layer]: checked === true,
                        },
                      }))
                    }
                  />
                  <span>{t(`admin.map.layers.${layer}`)}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">{t('admin.map.privacyModel')}</p>
            <p className="mt-1">{t('admin.map.privacyDescription')}</p>
            <p className="mt-2">{t('admin.map.filters.zoomHint', { zoom: mapZoom })}</p>
            <p className="mt-1">
              {t('admin.map.summary.centerCapacity')} {totalCenterCapacity}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
