import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const DEFAULT_PAGE_SIZE = 50;
const ALLOWED_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;

type SubmissionStatus = (typeof ALLOWED_STATUSES)[number];

interface MemberProfile {
  validated?: boolean;
  role?: string;
  coverageType?: 'governorate' | 'center' | 'hybrid';
  coverageGovernorates?: string[];
  coverageCenterIds?: string[];
  areaOfOperation?: string;
}

interface SubmissionRecord {
  fullName?: string;
  phoneNumber?: string;
  gender?: string;
  currentGovernorate?: string;
  previousGovernorate?: string;
  street?: string;
  building?: string;
  floor?: string;
  city?: string;
  ageRanges?: Record<string, number>;
  specialNeeds?: string[];
  needs?: string[];
  aidUrgency?: string;
  comments?: string;
  numberOfPeopleInHousehold?: number;
  registrationDate?: Timestamp;
  status?: SubmissionStatus;
  locationType?: string;
  centerId?: string;
  assignedTo?: string;
  assignedAt?: Timestamp | null;
  aidDelivered?: boolean;
  staleFlagged?: boolean;
  source?: string;
}

interface ListCasesRequest {
  limit?: number;
}

interface GetCaseDetailRequest {
  submissionId: string;
}

interface ClaimCaseRequest {
  submissionId: string;
}

interface UpdateCaseStatusRequest {
  submissionId: string;
  status: Exclude<SubmissionStatus, 'pending'>;
}

interface RecordAidDeliveryRequest {
  submissionId: string;
}

interface UpdateMemberCoverageProfileRequest {
  coverageType: 'governorate' | 'center' | 'hybrid';
  coverageGovernorates: string[];
  coverageCenterIds: string[];
  aidTypes: string[];
  maxCaseLoad: number;
  deliveryMode: 'delivery' | 'pickup' | 'both';
}

interface MemberCaseResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  currentGovernorate: string;
  previousGovernorate: string;
  street: string;
  building: string;
  floor: string;
  city: string;
  ageRanges: Record<string, number>;
  specialNeeds: string[];
  needs: string[];
  aidUrgency: string;
  comments: string;
  numberOfPeopleInHousehold: number;
  registrationDate: string | null;
  status: SubmissionStatus;
  locationType: string;
  centerId: string;
  assignedTo: string;
  assignedAt: string | null;
  aidDelivered: boolean;
  staleFlagged: boolean;
  source: string;
}

function assertSignedIn(uid?: string): string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  return uid;
}

async function getValidatedMemberProfile(uid: string): Promise<MemberProfile> {
  const memberSnapshot = await db.collection('members').doc(uid).get();

  if (!memberSnapshot.exists) {
    throw new HttpsError('permission-denied', 'Member profile not found.');
  }

  const memberData = memberSnapshot.data() as MemberProfile;

  if (memberData.role !== 'member' || memberData.validated !== true) {
    throw new HttpsError('permission-denied', 'Validated NGO membership is required.');
  }

  return memberData;
}

function getCoverageGovernorates(memberProfile: MemberProfile): string[] {
  if (
    Array.isArray(memberProfile.coverageGovernorates) &&
    memberProfile.coverageGovernorates.length > 0
  ) {
    return memberProfile.coverageGovernorates;
  }

  if (memberProfile.areaOfOperation) {
    return [memberProfile.areaOfOperation];
  }

  return [];
}

function matchesCoverage(memberProfile: MemberProfile, submission: SubmissionRecord): boolean {
  const coverageType = memberProfile.coverageType ?? 'governorate';
  const governorates = getCoverageGovernorates(memberProfile);
  const centerIds = Array.isArray(memberProfile.coverageCenterIds)
    ? memberProfile.coverageCenterIds
    : [];
  const hasGovernorateCoverage = governorates.length > 0;
  const hasCenterCoverage = centerIds.length > 0;

  if (!hasGovernorateCoverage && !hasCenterCoverage) {
    return true;
  }

  const governorateMatch = governorates.includes(submission.currentGovernorate ?? '');
  const centerMatch = centerIds.includes(submission.centerId ?? '');

  if (coverageType === 'center') {
    return centerMatch;
  }

  if (coverageType === 'hybrid') {
    return governorateMatch || centerMatch;
  }

  return governorateMatch;
}

function sanitizeSubmission(id: string, submission: SubmissionRecord): MemberCaseResponse {
  return {
    id,
    fullName: submission.fullName ?? '',
    phoneNumber: submission.phoneNumber ?? '',
    gender: submission.gender ?? '',
    currentGovernorate: submission.currentGovernorate ?? '',
    previousGovernorate: submission.previousGovernorate ?? '',
    street: submission.street ?? '',
    building: submission.building ?? '',
    floor: submission.floor ?? '',
    city: submission.city ?? '',
    ageRanges: submission.ageRanges ?? {},
    specialNeeds: submission.specialNeeds ?? [],
    needs: submission.needs ?? [],
    aidUrgency: submission.aidUrgency ?? '',
    comments: submission.comments ?? '',
    numberOfPeopleInHousehold: submission.numberOfPeopleInHousehold ?? 0,
    registrationDate: submission.registrationDate?.toDate().toISOString() ?? null,
    status: submission.status ?? 'pending',
    locationType: submission.locationType ?? 'with_family',
    centerId: submission.centerId ?? '',
    assignedTo: submission.assignedTo ?? '',
    assignedAt: submission.assignedAt?.toDate().toISOString() ?? null,
    aidDelivered: submission.aidDelivered ?? false,
    staleFlagged: submission.staleFlagged ?? false,
    source: submission.source ?? 'web',
  };
}

function sortByRegistrationDateDescending(
  documents: Array<{ id: string; data: SubmissionRecord }>,
) {
  return [...documents].sort((left, right) => {
    const leftDate = left.data.registrationDate?.toMillis() ?? 0;
    const rightDate = right.data.registrationDate?.toMillis() ?? 0;
    return rightDate - leftDate;
  });
}

function assertAllowedStatusTransition(current: SubmissionStatus, next: SubmissionStatus) {
  const transitions: Record<SubmissionStatus, SubmissionStatus[]> = {
    pending: ['assigned', 'cancelled'],
    assigned: ['in_progress', 'completed', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!transitions[current].includes(next)) {
    throw new HttpsError(
      'failed-precondition',
      `Cannot transition case from ${current} to ${next}.`,
    );
  }
}

export const listMemberPendingCases = onCall<ListCasesRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    const memberProfile = await getValidatedMemberProfile(uid);
    const pageSize = Math.min(Math.max(request.data?.limit ?? DEFAULT_PAGE_SIZE, 1), 100);

    const snapshot = await db
      .collection('submissions')
      .where('status', '==', 'pending')
      .limit(pageSize)
      .get();

    return {
      cases: sortByRegistrationDateDescending(
        snapshot.docs.map((document) => ({
          id: document.id,
          data: document.data() as SubmissionRecord,
        })),
      )
        .filter(({ data }) => matchesCoverage(memberProfile, data))
        .map(({ id, data }) => sanitizeSubmission(id, data)),
    };
  },
);

export const listMemberClaimedCases = onCall<ListCasesRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    await getValidatedMemberProfile(uid);
    const pageSize = Math.min(Math.max(request.data?.limit ?? DEFAULT_PAGE_SIZE, 1), 100);

    const snapshot = await db
      .collection('submissions')
      .where('assignedTo', '==', uid)
      .limit(pageSize)
      .get();

    return {
      cases: sortByRegistrationDateDescending(
        snapshot.docs.map((document) => ({
          id: document.id,
          data: document.data() as SubmissionRecord,
        })),
      ).map(({ id, data }) => sanitizeSubmission(id, data)),
    };
  },
);

export const getMemberCaseDetail = onCall<GetCaseDetailRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    const memberProfile = await getValidatedMemberProfile(uid);

    if (!request.data?.submissionId) {
      throw new HttpsError('invalid-argument', 'submissionId is required.');
    }

    const submissionSnapshot = await db
      .collection('submissions')
      .doc(request.data.submissionId)
      .get();

    if (!submissionSnapshot.exists) {
      throw new HttpsError('not-found', 'Case not found.');
    }

    const submission = submissionSnapshot.data() as SubmissionRecord;

    if (submission.assignedTo !== uid && !matchesCoverage(memberProfile, submission)) {
      throw new HttpsError('permission-denied', 'This case is outside your coverage.');
    }

    return {
      case: sanitizeSubmission(submissionSnapshot.id, submission),
    };
  },
);

export const claimMemberCase = onCall<ClaimCaseRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    const memberProfile = await getValidatedMemberProfile(uid);

    if (!request.data?.submissionId) {
      throw new HttpsError('invalid-argument', 'submissionId is required.');
    }

    const submissionRef = db.collection('submissions').doc(request.data.submissionId);
    const submissionSnapshot = await submissionRef.get();

    if (!submissionSnapshot.exists) {
      throw new HttpsError('not-found', 'Case not found.');
    }

    const submission = submissionSnapshot.data() as SubmissionRecord;

    if (!matchesCoverage(memberProfile, submission)) {
      throw new HttpsError('permission-denied', 'This case is outside your coverage.');
    }

    if ((submission.status ?? 'pending') !== 'pending') {
      throw new HttpsError('failed-precondition', 'Only pending cases can be claimed.');
    }

    await submissionRef.set(
      {
        status: 'assigned',
        assignedTo: uid,
        assignedAt: Timestamp.now(),
        lastUpdatedBy: uid,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const updatedSnapshot = await submissionRef.get();
    return {
      case: sanitizeSubmission(updatedSnapshot.id, updatedSnapshot.data() as SubmissionRecord),
    };
  },
);

export const updateMemberCaseStatus = onCall<UpdateCaseStatusRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    await getValidatedMemberProfile(uid);

    if (!request.data?.submissionId || !request.data.status) {
      throw new HttpsError('invalid-argument', 'submissionId and status are required.');
    }

    if (!ALLOWED_STATUSES.includes(request.data.status)) {
      throw new HttpsError('invalid-argument', 'Invalid case status.');
    }

    const submissionRef = db.collection('submissions').doc(request.data.submissionId);
    const submissionSnapshot = await submissionRef.get();

    if (!submissionSnapshot.exists) {
      throw new HttpsError('not-found', 'Case not found.');
    }

    const submission = submissionSnapshot.data() as SubmissionRecord;

    if ((submission.assignedTo ?? '') !== uid) {
      throw new HttpsError('permission-denied', 'You can only update your claimed cases.');
    }

    const currentStatus = submission.status ?? 'pending';
    assertAllowedStatusTransition(currentStatus, request.data.status);

    await submissionRef.set(
      {
        status: request.data.status,
        aidDelivered:
          request.data.status === 'completed' ? true : (submission.aidDelivered ?? false),
        lastUpdatedBy: uid,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const updatedSnapshot = await submissionRef.get();
    return {
      case: sanitizeSubmission(updatedSnapshot.id, updatedSnapshot.data() as SubmissionRecord),
    };
  },
);

export const recordMemberAidDelivery = onCall<RecordAidDeliveryRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    await getValidatedMemberProfile(uid);

    if (!request.data?.submissionId) {
      throw new HttpsError('invalid-argument', 'submissionId is required.');
    }

    const submissionRef = db.collection('submissions').doc(request.data.submissionId);
    const submissionSnapshot = await submissionRef.get();

    if (!submissionSnapshot.exists) {
      throw new HttpsError('not-found', 'Case not found.');
    }

    const submission = submissionSnapshot.data() as SubmissionRecord;

    if ((submission.assignedTo ?? '') !== uid) {
      throw new HttpsError('permission-denied', 'You can only complete your claimed cases.');
    }

    await submissionRef.set(
      {
        aidDelivered: true,
        status: 'completed',
        lastUpdatedBy: uid,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const updatedSnapshot = await submissionRef.get();
    return {
      case: sanitizeSubmission(updatedSnapshot.id, updatedSnapshot.data() as SubmissionRecord),
    };
  },
);

export const updateMemberCoverageProfile = onCall<UpdateMemberCoverageProfileRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const uid = assertSignedIn(request.auth?.uid);
    await getValidatedMemberProfile(uid);

    const {
      coverageType,
      coverageGovernorates = [],
      coverageCenterIds = [],
      aidTypes = [],
      maxCaseLoad,
      deliveryMode,
    } = request.data ?? {};

    if (!coverageType || !deliveryMode || !Number.isFinite(maxCaseLoad)) {
      throw new HttpsError('invalid-argument', 'Coverage profile is incomplete.');
    }

    await db.collection('members').doc(uid).set(
      {
        coverageType,
        coverageGovernorates,
        coverageCenterIds,
        aidTypes,
        maxCaseLoad,
        deliveryMode,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const snapshot = await db.collection('members').doc(uid).get();

    return {
      profile: snapshot.data(),
    };
  },
);
