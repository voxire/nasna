import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, functions } from '@/firebase';
import { getCoordinates } from '@nasna/shared';

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
    const d = doc.data();
    return {
      id: doc.id,
      name: (d.name as string) ?? 'Center',
      governorate: (d.governorate as string) ?? '',
      city: (d.city as string) ?? '',
      address: (d.address as string) ?? '',
      capacity: Number(d.capacity ?? 0),
      occupiedCapacity: Number(d.occupiedCapacity ?? 0),
      ...getCoordinates(d.governorate as string | undefined),
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
