import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

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

interface SubmissionRecord {
  currentGovernorate?: string;
  aidUrgency?: string;
  status?: string;
  locationType?: string;
}

interface MemberRecord {
  name?: string;
  role?: string;
  validated?: boolean;
  coverageGovernorates?: string[];
  coverageCenterIds?: string[];
}

interface CenterRecord {
  name?: string;
  governorate?: string;
  city?: string;
  address?: string;
  capacity?: number;
  occupiedCapacity?: number;
  active?: boolean;
}

interface HousingRecord {
  area?: string;
  availableSpots?: number;
  status?: string;
}

interface NgoCoverageSummaryInput {
  id: string;
  name?: string;
  coverageGovernorates?: string[];
  coverageCenterIds?: string[];
}

function assertAdmin(role?: unknown) {
  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

export function getCoordinates(governorate?: string) {
  return GOVERNORATE_COORDINATES[governorate ?? ''] ?? { lat: 33.8547, lng: 35.8623 };
}

export function buildSubmissionClusters(submissions: SubmissionRecord[]) {
  const submissionClustersMap = new Map<
    string,
    {
      governorate: string;
      count: number;
      urgentCount: number;
      pendingCount: number;
      lat: number;
      lng: number;
    }
  >();

  submissions.forEach((submission) => {
    const governorate = submission.currentGovernorate ?? 'Unknown';
    const current = submissionClustersMap.get(governorate) ?? {
      governorate,
      count: 0,
      urgentCount: 0,
      pendingCount: 0,
      ...getCoordinates(governorate),
    };

    current.count += 1;
    if (submission.aidUrgency === 'High') current.urgentCount += 1;
    if (submission.status === 'pending') current.pendingCount += 1;

    submissionClustersMap.set(governorate, current);
  });

  return Array.from(submissionClustersMap.values());
}

export function buildNgoCoverage(members: NgoCoverageSummaryInput[]) {
  return members.map((member) => {
    const governorates = Array.isArray(member.coverageGovernorates)
      ? member.coverageGovernorates
      : [];

    return {
      id: member.id,
      name: member.name ?? 'NGO',
      governorates,
      centerIds: Array.isArray(member.coverageCenterIds) ? member.coverageCenterIds : [],
      coordinates: governorates.map((governorate) => ({
        governorate,
        ...getCoordinates(governorate),
      })),
    };
  });
}

export function buildCenterMarkers(
  centers: Array<
    CenterRecord & {
      id: string;
    }
  >,
) {
  return centers.map((center) => ({
    id: center.id,
    name: center.name ?? 'Center',
    governorate: center.governorate ?? '',
    city: center.city ?? '',
    address: center.address ?? '',
    capacity: Number(center.capacity ?? 0),
    occupiedCapacity: Number(center.occupiedCapacity ?? 0),
    ...getCoordinates(center.governorate),
  }));
}

export function buildHousingAreaSummaries(housingRecords: HousingRecord[]) {
  const housingAreasMap = new Map<
    string,
    { area: string; listingCount: number; availableSpots: number; lat: number; lng: number }
  >();

  housingRecords.forEach((housing) => {
    const area = housing.area ?? 'Unknown';
    const current = housingAreasMap.get(area) ?? {
      area,
      listingCount: 0,
      availableSpots: 0,
      ...getCoordinates(area),
    };

    current.listingCount += 1;
    current.availableSpots += Number(housing.availableSpots ?? 0);
    housingAreasMap.set(area, current);
  });

  return Array.from(housingAreasMap.values());
}

export const getOperationsMapData = onCall(
  {
    region: 'europe-west1',
  },
  async (request) => {
    assertAdmin(request.auth?.token.role);

    const [submissionSnapshot, memberSnapshot, centerSnapshot, housingSnapshot] = await Promise.all(
      [
        db.collection('submissions').get(),
        db.collection('members').where('role', '==', 'member').where('validated', '==', true).get(),
        db.collection('centers').where('active', '==', true).get(),
        db.collection('housing').where('status', '==', 'approved').get(),
      ],
    );

    return {
      submissionClusters: buildSubmissionClusters(
        submissionSnapshot.docs.map((document) => document.data() as SubmissionRecord),
      ),
      ngoCoverage: buildNgoCoverage(
        memberSnapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as MemberRecord),
        })),
      ),
      centers: buildCenterMarkers(
        centerSnapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as CenterRecord),
        })),
      ),
      housingAreas: buildHousingAreaSummaries(
        housingSnapshot.docs.map((document) => document.data() as HousingRecord),
      ),
    };
  },
);
