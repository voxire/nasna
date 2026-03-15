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
          totalCapacity: 30,
          currentOccupancy: 12,
        },
      ]),
    ).toEqual([
      {
        id: 'center-1',
        name: 'Main Center',
        governorate: 'Beirut',
        city: 'Beirut',
        address: 'Hamra',
        totalCapacity: 30,
        currentOccupancy: 12,
        lat: 33.8938,
        lng: 35.5018,
      },
    ]);

    expect(
      buildHousingAreaSummaries([
        { governorate: 'Beirut', district: 'Beirut', capacity: 3, status: 'available' },
        { governorate: 'Beirut', district: 'Beirut', capacity: 2, status: 'available' },
      ]),
    ).toEqual([
      {
        area: 'Beirut',
        listingCount: 2,
        availableCapacity: 5,
        lat: 33.8938,
        lng: 35.5018,
      },
    ]);
  });

  it('falls back to default coordinates for undefined governorate in getCoordinates', () => {
    expect(getCoordinates(undefined)).toEqual({ lat: 33.8547, lng: 35.8623 });
  });

  it('buildSubmissionClusters falls back to Unknown when currentGovernorate is missing', () => {
    const result = buildSubmissionClusters([{ aidUrgency: 'Low', status: 'assigned' }]);
    expect(result[0].governorate).toBe('Unknown');
    expect(result[0].count).toBe(1);
    expect(result[0].urgentCount).toBe(0);
    expect(result[0].pendingCount).toBe(0);
  });

  it('buildNgoCoverage handles non-array coverageGovernorates and coverageCenterIds, and missing name', () => {
    const result = buildNgoCoverage([{ id: 'ngo-2' }]);
    expect(result[0]).toEqual({
      id: 'ngo-2',
      name: 'NGO',
      governorates: [],
      centerIds: [],
      coordinates: [],
    });
  });

  it('buildCenterMarkers uses explicit coordinates when provided', () => {
    const result = buildCenterMarkers([
      {
        id: 'center-2',
        coordinates: { lat: 34.0, lng: 36.0 },
      },
    ]);
    expect(result[0].lat).toBe(34.0);
    expect(result[0].lng).toBe(36.0);
  });

  it('buildCenterMarkers uses district fallback for city and capacity/occupiedCapacity fallbacks', () => {
    const result = buildCenterMarkers([
      {
        id: 'center-3',
        district: 'Hamra',
        capacity: 20,
        occupiedCapacity: 5,
      },
    ]);
    expect(result[0].city).toBe('Hamra');
    expect(result[0].totalCapacity).toBe(20);
    expect(result[0].currentOccupancy).toBe(5);
  });

  it('buildCenterMarkers uses default empty strings and zero fallbacks when all fields missing', () => {
    const result = buildCenterMarkers([{ id: 'center-4' }]);
    expect(result[0].name).toBe('Center');
    expect(result[0].governorate).toBe('');
    expect(result[0].city).toBe('');
    expect(result[0].address).toBe('');
    expect(result[0].totalCapacity).toBe(0);
    expect(result[0].currentOccupancy).toBe(0);
  });

  it('buildHousingAreaSummaries includes approved status and uses area/district/availableSpots fallbacks', () => {
    const result = buildHousingAreaSummaries([
      { area: 'Hamra', availableSpots: 3, status: 'approved' },
      { district: 'Achrafieh', capacity: 2, status: 'available' },
      { capacity: 10, status: 'pending' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].area).toBe('Hamra');
    expect(result[0].availableCapacity).toBe(3);
    expect(result[1].area).toBe('Achrafieh');
  });

  it('buildHousingAreaSummaries falls back to Unknown when all area fields are missing', () => {
    const result = buildHousingAreaSummaries([{ status: 'available' }]);
    expect(result[0].area).toBe('Unknown');
    expect(result[0].availableCapacity).toBe(0);
  });

  it('rejects non-admin callers', async () => {
    await expect(runOperationsMapData({ auth: { token: { role: 'member' } } })).rejects.toThrow(
      'Admin access is required.',
    );
  });

  it('filters out inactive centers and supports isActive flag', async () => {
    const mockSubmissionsGet = jest.fn().mockResolvedValue({ docs: [] });
    const mockMembersGet = jest.fn().mockResolvedValue({ docs: [] });
    const mockCentersGet = jest.fn().mockResolvedValue({
      docs: [
        { id: 'c-active', data: () => ({ name: 'Active', governorate: 'Beirut', isActive: true }) },
        { id: 'c-inactive', data: () => ({ name: 'Inactive', governorate: 'Beirut', active: false }) },
        { id: 'c-neither', data: () => ({ name: 'Neither', governorate: 'Beirut' }) },
      ],
    });
    const mockHousingGet = jest.fn().mockResolvedValue({ docs: [] });

    const memberSecondWhere = jest.fn(() => ({ get: mockMembersGet }));
    const memberFirstWhere = jest.fn(() => ({ where: memberSecondWhere }));

    mockCollection.mockImplementation((name: string) => {
      switch (name) {
        case 'submissions': return { get: mockSubmissionsGet };
        case 'members': return { where: memberFirstWhere };
        case 'centers': return { limit: jest.fn(() => ({ get: mockCentersGet })) };
        case 'housing': return { limit: jest.fn(() => ({ get: mockHousingGet })) };
        default: throw new Error(`Unexpected collection: ${name}`);
      }
    });

    const result = await runOperationsMapData({ auth: { token: { role: 'admin' } } }) as { centers: { id: string }[] };
    expect(result.centers).toHaveLength(1);
    expect(result.centers[0].id).toBe('c-active');
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
            totalCapacity: 30,
            currentOccupancy: 12,
            active: true,
          }),
        },
      ],
    });
    const mockHousingGet = jest.fn().mockResolvedValue({
      docs: [
        {
          data: () => ({
            governorate: 'Beirut',
            district: 'Beirut',
            capacity: 4,
            status: 'available',
          }),
        },
      ],
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
          return { limit: jest.fn(() => ({ get: mockCentersGet })) };
        case 'housing':
          return { limit: jest.fn(() => ({ get: mockHousingGet })) };
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
          totalCapacity: 30,
          currentOccupancy: 12,
          lat: 33.8938,
          lng: 35.5018,
        },
      ],
      housingAreas: [
        {
          area: 'Beirut',
          listingCount: 1,
          availableCapacity: 4,
          lat: 33.8938,
          lng: 35.5018,
        },
      ],
    });
  });
});
