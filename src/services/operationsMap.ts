import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

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
