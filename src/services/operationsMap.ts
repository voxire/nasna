import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, functions } from '@/firebase';
import type { CenterDocument, HousingDocument } from '@/types';

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
    getDocs(query(collection(db, 'centers'), where('active', '==', true))),
    getDocs(query(collection(db, 'housing'), where('status', '==', 'approved'))),
  ]);

  const centers: CenterMarker[] = centersSnap.docs.map((doc) => {
    const d = doc.data() as CenterDocument;
    return {
      id: doc.id,
      name: d.name ?? 'Center',
      governorate: d.governorate ?? '',
      city: d.city ?? '',
      address: d.address ?? '',
      capacity: Number(d.capacity ?? 0),
      occupiedCapacity: Number(d.occupiedCapacity ?? 0),
      ...getCoordinates(d.governorate),
    };
  });

  const housingMap = new Map<
    string,
    { area: string; listingCount: number; availableSpots: number; lat: number; lng: number }
  >();
  housingSnap.docs.forEach((doc) => {
    const d = doc.data() as HousingDocument;
    const area = d.area ?? 'Unknown';
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
