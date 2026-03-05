import { buildMemberWorkflowDefaults, buildSubmissionWorkflowDefaults } from '../v2Defaults';

describe('v2 workflow defaults', () => {
  it('builds pending submission defaults for the provided source', () => {
    expect(buildSubmissionWorkflowDefaults('agent')).toEqual({
      status: 'pending',
      locationType: 'with_family',
      centerId: '',
      assignedTo: '',
      assignedAt: null,
      aidDelivered: false,
      lastUpdatedBy: '',
      staleFlagged: false,
      source: 'agent',
    });
  });

  it('builds member workflow defaults with safe capacity values', () => {
    expect(buildMemberWorkflowDefaults()).toEqual({
      coverageType: 'governorate',
      coverageGovernorates: [],
      coverageCenterIds: [],
      aidTypes: [],
      currentCaseLoad: 0,
      maxCaseLoad: 10,
      deliveryMode: 'both',
      onboarded: true,
    });
  });
});
