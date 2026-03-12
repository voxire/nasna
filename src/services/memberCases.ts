import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

export interface MemberCase {
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
  updatedAt: string | null;
  status: string;
  locationType: string;
  centerId: string;
  assignedTo: string;
  assignedToOrgName: string;
  assignedAt: string | null;
  aidDelivered: boolean;
  aidDeliveries: Array<{
    type: string;
    date: string | null;
    deliveredBy: string;
    notes: string;
  }>;
  staleFlagged: boolean;
  source: string;
}

export interface CoverageProfile {
  coverageType: 'governorate' | 'center' | 'hybrid';
  coverageGovernorates: string[];
  coverageCenterIds: string[];
  aidTypes: string[];
  maxCaseLoad: number;
  deliveryMode: 'delivery' | 'pickup' | 'both';
}

interface CaseListResponse {
  cases: MemberCase[];
}

interface CaseDetailResponse {
  case: MemberCase;
}

interface CoverageProfileResponse {
  profile: CoverageProfile;
}

export async function listMemberPendingCases(limit = 50) {
  const callable = httpsCallable<{ limit: number }, CaseListResponse>(
    functions,
    'listMemberPendingCases',
  );
  const result = await callable({ limit });
  return result.data.cases;
}

export async function listMemberClaimedCases(limit = 50) {
  const callable = httpsCallable<{ limit: number }, CaseListResponse>(
    functions,
    'listMemberClaimedCases',
  );
  const result = await callable({ limit });
  return result.data.cases;
}

export async function getMemberCaseDetail(submissionId: string) {
  const callable = httpsCallable<{ submissionId: string }, CaseDetailResponse>(
    functions,
    'getMemberCaseDetail',
  );
  const result = await callable({ submissionId });
  return result.data.case;
}

export async function claimMemberCase(submissionId: string) {
  const callable = httpsCallable<{ submissionId: string }, CaseDetailResponse>(
    functions,
    'claimMemberCase',
  );
  const result = await callable({ submissionId });
  return result.data.case;
}

export interface CreateMemberCasePayload {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
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
  consentGiven: boolean;
  comments: string;
  numberOfPeopleInHousehold: number;
  locationType: string;
  centerId: string;
}

export async function createMemberCase(payload: CreateMemberCasePayload) {
  const callable = httpsCallable<CreateMemberCasePayload, CaseDetailResponse>(
    functions,
    'createMemberCase',
  );
  const result = await callable(payload);
  return result.data.case;
}

export async function updateMemberCaseStatus(submissionId: string, status: string) {
  const callable = httpsCallable<{ submissionId: string; status: string }, CaseDetailResponse>(
    functions,
    'updateMemberCaseStatus',
  );
  const result = await callable({ submissionId, status });
  return result.data.case;
}

export async function recordMemberAidDelivery(submissionId: string, deliveryNotes?: string) {
  const callable = httpsCallable<
    { submissionId: string; deliveryNotes?: string },
    CaseDetailResponse
  >(functions, 'recordMemberAidDelivery');
  const result = await callable({ submissionId, deliveryNotes });
  return result.data.case;
}

export async function getMemberCoverageProfile() {
  const callable = httpsCallable<Record<string, never>, CoverageProfileResponse>(
    functions,
    'getMemberCoverageProfile',
  );
  const result = await callable({});
  return result.data.profile;
}

interface CoverageProfilePayload {
  coverageType: 'governorate' | 'center' | 'hybrid';
  coverageGovernorates: string[];
  coverageCenterIds: string[];
  aidTypes: string[];
  maxCaseLoad: number;
  deliveryMode: 'delivery' | 'pickup' | 'both';
}

export async function updateMemberCoverageProfile(payload: CoverageProfilePayload) {
  const callable = httpsCallable<CoverageProfilePayload, { profile: unknown }>(
    functions,
    'updateMemberCoverageProfile',
  );
  const result = await callable(payload);
  return result.data.profile;
}
