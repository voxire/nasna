const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn(() => []);
const mockCollection = jest.fn();
const mockGetFirestore = jest.fn(() => ({
  collection: mockCollection,
}));

class MockHttpsError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

jest.mock('firebase-admin/app', () => ({
  getApps: () => mockGetApps(),
  initializeApp: () => mockInitializeApp(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
}));

jest.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_options: unknown, handler: unknown) => handler,
}));

import {
  buildCenterMarkers,
  buildHousingAreaSummaries,
  buildNgoCoverage,
  buildSubmissionClusters,
  getCoordinates,
  getOperationsMapData,
} from '../operationsMapApi';

const runOperationsMapData = getOperationsMapData as unknown as (
  request: unknown,
) => Promise<unknown>;

describe('operations map helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses known coordinates when available and falls back for unknown regions', () => {
    expect(getCoordinates('Beirut')).toEqual({ lat: 33.8938, lng: 35.5018 });
    expect(getCoordinates('Unknown Region')).toEqual({ lat: 33.8547, lng: 35.8623 });
  });

  it('aggregates submission clusters by governorate', () => {
    expect(
      buildSubmissionClusters([
        { currentGovernorate: 'Beirut', aidUrgency: 'High', status: 'pending' },
        { currentGovernorate: 'Beirut', aidUrgency: 'Low', status: 'assigned' },
        { currentGovernorate: 'Akkar', aidUrgency: 'High', status: 'pending' },
      ]),
    ).toEqual([
      {
        governorate: 'Beirut',
        count: 2,
        urgentCount: 1,
        pendingCount: 1,
        lat: 33.8938,
        lng: 35.5018,
      },
      {
        governorate: 'Akkar',
        count: 1,
        urgentCount: 1,
        pendingCount: 1,
        lat: 34.5329,
        lng: 36.1728,
      },
    ]);
  });

  it('builds ngo coverage summaries with governorate coordinates', () => {
    expect(
      buildNgoCoverage([
        {
          id: 'ngo-1',
          name: 'Relief Org',
          coverageGovernorates: ['Beirut'],
          coverageCenterIds: ['center-1'],
        },
      ]),
    ).toEqual([
      {
        id: 'ngo-1',
        name: 'Relief Org',
        governorates: ['Beirut'],
        centerIds: ['center-1'],
        coordinates: [{ governorate: 'Beirut', lat: 33.8938, lng: 35.5018 }],
      },
    ]);
  });

  it('normalizes center and housing summaries for the admin map', () => {
    expect(
      buildCenterMarkers([
        {
          id: 'center-1',
          name: 'Main Center',
          governorate: 'Beirut',
          city: 'Beirut',
          address: 'Hamra',
          capacity: 30,
          occupiedCapacity: 12,
        },
      ]),
    ).toEqual([
      {
        id: 'center-1',
        name: 'Main Center',
        governorate: 'Beirut',
        city: 'Beirut',
        address: 'Hamra',
        capacity: 30,
        occupiedCapacity: 12,
        lat: 33.8938,
        lng: 35.5018,
      },
    ]);

    expect(
      buildHousingAreaSummaries([
        { area: 'Beirut', availableSpots: 3 },
        { area: 'Beirut', availableSpots: 2 },
      ]),
    ).toEqual([
      {
        area: 'Beirut',
        listingCount: 2,
        availableSpots: 5,
        lat: 33.8938,
        lng: 35.5018,
      },
    ]);
  });

  it('rejects non-admin callers', async () => {
    await expect(runOperationsMapData({ auth: { token: { role: 'member' } } })).rejects.toThrow(
      'Admin access is required.',
    );
  });

  it('returns sanitized aggregated map data for admins', async () => {
    const mockSubmissionsGet = jest.fn().mockResolvedValue({
      docs: [
        { data: () => ({ currentGovernorate: 'Beirut', aidUrgency: 'High', status: 'pending' }) },
      ],
    });
    const mockMembersGet = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'ngo-1',
          data: () => ({
            name: 'Relief Org',
            coverageGovernorates: ['Beirut'],
            coverageCenterIds: ['center-1'],
          }),
        },
      ],
    });
    const mockCentersGet = jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'center-1',
          data: () => ({
            name: 'Main Center',
            governorate: 'Beirut',
            city: 'Beirut',
            address: 'Hamra',
            capacity: 30,
            occupiedCapacity: 12,
          }),
        },
      ],
    });
    const mockHousingGet = jest.fn().mockResolvedValue({
      docs: [{ data: () => ({ area: 'Beirut', availableSpots: 4 }) }],
    });

    const memberSecondWhere = jest.fn(() => ({ get: mockMembersGet }));
    const memberFirstWhere = jest.fn(() => ({ where: memberSecondWhere }));

    mockCollection.mockImplementation((name: string) => {
      switch (name) {
        case 'submissions':
          return { get: mockSubmissionsGet };
        case 'members':
          return { where: memberFirstWhere };
        case 'centers':
          return { where: jest.fn(() => ({ get: mockCentersGet })) };
        case 'housing':
          return { where: jest.fn(() => ({ get: mockHousingGet })) };
        default:
          throw new Error(`Unexpected collection: ${name}`);
      }
    });

    await expect(
      runOperationsMapData({
        auth: { token: { role: 'admin' } },
      }),
    ).resolves.toEqual({
      submissionClusters: [
        {
          governorate: 'Beirut',
          count: 1,
          urgentCount: 1,
          pendingCount: 1,
          lat: 33.8938,
          lng: 35.5018,
        },
      ],
      ngoCoverage: [
        {
          id: 'ngo-1',
          name: 'Relief Org',
          governorates: ['Beirut'],
          centerIds: ['center-1'],
          coordinates: [{ governorate: 'Beirut', lat: 33.8938, lng: 35.5018 }],
        },
      ],
      centers: [
        {
          id: 'center-1',
          name: 'Main Center',
          governorate: 'Beirut',
          city: 'Beirut',
          address: 'Hamra',
          capacity: 30,
          occupiedCapacity: 12,
          lat: 33.8938,
          lng: 35.5018,
        },
      ],
      housingAreas: [
        {
          area: 'Beirut',
          listingCount: 1,
          availableSpots: 4,
          lat: 33.8938,
          lng: 35.5018,
        },
      ],
    });
  });
});
