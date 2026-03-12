import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db, functions } from '@/firebase';

const GOVERNORATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  'Mount Lebanon': { lat: 33.8101, lng: 35.5972 },
  Baabdat: { lat: 33.8707, lng: 35.6614 },
  'North Lebanon': { lat: 34.4367, lng: 35.8497 },
  Akkar: { lat: 34.5329, lng: 36.1728 },
  Baalbek: { lat: 34.0058, lng: 36.2181 },
  Beqaa: { lat: 33.8464, lng: 35.9028 },
  Tyre: { lat: 33.2704, lng: 35.2038 },
  Saida: { lat: 33.5606, lng: 35.3756 },
  Nabatiyeh: { lat: 33.3789, lng: 35.4834 },
};

function getCoordinates(governorate?: string) {
  return GOVERNORATE_COORDINATES[governorate ?? ''] ?? { lat: 33.8547, lng: 35.8623 };
}

export interface SubmissionCluster {
  governorate: string;
  count: number;
  urgentCount: number;
  pendingCount: number;
  lat: number;
  lng: number;
}

export interface NgoCoverageSummary {
  id: string;
  name: string;
  governorates: string[];
  centerIds: string[];
  coordinates: Array<{
    governorate: string;
    lat: number;
    lng: number;
  }>;
}

export interface CenterMarker {
  id: string;
  name: string;
  governorate: string;
  city: string;
  address: string;
  capacity: number;
  occupiedCapacity: number;
  lat: number;
  lng: number;
  // new public fields — NOT PII
  phone?: string;
  aidServices?: string[];
  operatingHours?: string;
  intakeOpen?: boolean;
}

export interface HousingAreaSummary {
  area: string;
  listingCount: number;
  availableSpots: number;
  lat: number;
  lng: number;
}

interface OperationsMapResponse {
  submissionClusters: SubmissionCluster[];
  ngoCoverage: NgoCoverageSummary[];
  centers: CenterMarker[];
  housingAreas: HousingAreaSummary[];
}

export async function getOperationsMapData() {
  const callable = httpsCallable<Record<string, never>, OperationsMapResponse>(
    functions,
    'getOperationsMapData',
  );

  const result = await callable({});
  return result.data;
}

export interface PublicCentersMapData {
  centers: CenterMarker[];
  housingAreas: HousingAreaSummary[];
}

export async function getPublicCentersMapData(): Promise<PublicCentersMapData> {
  const [centersSnap, housingSnap] = await Promise.all([
    getDocs(query(collection(db, 'centers'), where('active', '==', true), limit(200))),
    getDocs(query(collection(db, 'housing'), where('status', '==', 'approved'), limit(500))),
  ]);

  const centers: CenterMarker[] = centersSnap.docs.map((doc) => {
    const d = doc.data();
    const storedCoords = d.coordinates as { lat: number; lng: number } | undefined;
    const fallback = getCoordinates(d.governorate as string | undefined);
    return {
      id: doc.id,
      name: (d.name as string) ?? 'Center',
      governorate: (d.governorate as string) ?? '',
      city: (d.city as string) ?? '',
      address: (d.address as string) ?? '',
      // totalCapacity is the canonical field; fall back to legacy 'capacity' for old docs
      capacity: Number(d.totalCapacity ?? d.capacity ?? 0),
      occupiedCapacity: Number(d.currentOccupancy ?? d.occupiedCapacity ?? 0),
      lat: storedCoords?.lat ?? fallback.lat,
      lng: storedCoords?.lng ?? fallback.lng,
      phone: (d.phone as string | undefined) ?? undefined,
      aidServices: (d.aidServices as string[] | undefined) ?? [],
      operatingHours: (d.operatingHours as string | undefined) ?? undefined,
      intakeOpen: (d.intakeOpen as boolean | undefined) ?? undefined,
    };
  });

  const housingMap = new Map<
    string,
    { area: string; listingCount: number; availableSpots: number; lat: number; lng: number }
  >();
  housingSnap.docs.forEach((doc) => {
    const d = doc.data();
    const area = (d.area as string) ?? 'Unknown';
    const current = housingMap.get(area) ?? {
      area,
      listingCount: 0,
      availableSpots: 0,
      ...getCoordinates(area),
    };
    current.listingCount += 1;
    current.availableSpots += Number(d.availableSpots ?? 0);
    housingMap.set(area, current);
  });

  return { centers, housingAreas: Array.from(housingMap.values()) };
}
