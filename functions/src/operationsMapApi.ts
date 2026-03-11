import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { getCoordinates } from '@nasna/shared';

export { getCoordinates } from '@nasna/shared';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

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
