import type { DeliveryMode, LocationType, SubmissionSource, SubmissionStatus } from '@/types';

interface SubmissionWorkflowDefaults {
  status: SubmissionStatus;
  locationType: LocationType;
  centerId: string;
  assignedTo: string;
  assignedAt: null;
  aidDelivered: boolean;
  lastUpdatedBy: string;
  staleFlagged: boolean;
  source: SubmissionSource;
}

interface MemberWorkflowDefaults {
  coverageType: 'governorate';
  coverageGovernorates: string[];
  coverageCenterIds: string[];
  aidTypes: string[];
  currentCaseLoad: number;
  maxCaseLoad: number;
  deliveryMode: DeliveryMode;
  onboarded: boolean;
}

export const buildSubmissionWorkflowDefaults = (
  source: SubmissionSource,
): SubmissionWorkflowDefaults => ({
  status: 'pending',
  locationType: 'with_family',
  centerId: '',
  assignedTo: '',
  assignedAt: null,
  aidDelivered: false,
  lastUpdatedBy: '',
  staleFlagged: false,
  source,
});

export const buildMemberWorkflowDefaults = (): MemberWorkflowDefaults => ({
  coverageType: 'governorate',
  coverageGovernorates: [],
  coverageCenterIds: [],
  aidTypes: [],
  currentCaseLoad: 0,
  maxCaseLoad: 10,
  deliveryMode: 'both',
  onboarded: true,
});
