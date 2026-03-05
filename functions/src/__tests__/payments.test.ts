const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn(() => []);
const mockSet = jest.fn();
const mockDocFactory = jest.fn(() => ({
  id: 'donation-1',
  set: mockSet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDocFactory,
}));
const mockGetFirestore = jest.fn(() => ({
  collection: mockCollection,
}));
const mockStripeCreate = jest.fn();
const mockStripeConstructor = jest.fn((_secretKey?: unknown) => ({
  checkout: {
    sessions: {
      create: mockStripeCreate,
    },
  },
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

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn((secretKey: unknown) => mockStripeConstructor(secretKey)),
}));

import {
  buildDonationUrls,
  createDonationCheckoutSession,
  normalizeDonationPayload,
} from '../payments';

const runDonationCheckoutSession = createDonationCheckoutSession as unknown as (
  request: unknown,
) => Promise<unknown>;

describe('payment helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.APP_BASE_URL = 'https://nasna.org';
    mockStripeCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/session/cs_test_123',
    });
    mockSet.mockResolvedValue(undefined);
  });

  it('normalizes a valid donation payload', () => {
    expect(
      normalizeDonationPayload({
        donorName: 'Jane Doe',
        donorPhone: '+96170000000',
        fundingTarget: 'family',
        amountUsd: 25,
        reason: 'Emergency support',
      }),
    ).toEqual({
      donorName: 'Jane Doe',
      donorPhone: '+96170000000',
      fundingTarget: 'family',
      amountUsd: 25,
      reason: 'Emergency support',
    });
  });

  it('rejects incomplete donation payloads', () => {
    expect(() =>
      normalizeDonationPayload({
        donorName: 'Jane Doe',
        donorPhone: '+96170000000',
        fundingTarget: 'family',
        reason: 'Emergency support',
      }),
    ).toThrow(MockHttpsError);
  });

  it('rejects invalid amounts and targets', () => {
    expect(() =>
      normalizeDonationPayload({
        donorName: 'Jane Doe',
        donorPhone: '+96170000000',
        fundingTarget: 'family',
        amountUsd: 0,
        reason: 'Emergency support',
      }),
    ).toThrow('Invalid donation payload.');
  });

  it('builds donation redirect urls from the configured app url', () => {
    expect(buildDonationUrls('https://nasna.org')).toEqual({
      successUrl: 'https://nasna.org/donate?status=success',
      cancelUrl: 'https://nasna.org/donate?status=cancelled',
    });
  });

  it('rejects checkout creation when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;

    await expect(
      runDonationCheckoutSession({
        data: {
          donorName: 'Jane Doe',
          donorPhone: '+96170000000',
          fundingTarget: 'family',
          amountUsd: 25,
          reason: 'Emergency support',
        },
      }),
    ).rejects.toThrow('Stripe is not configured.');
  });

  it('creates a checkout session and persists the donation record', async () => {
    await expect(
      runDonationCheckoutSession({
        data: {
          donorName: 'Jane Doe',
          donorPhone: '+96170000000',
          fundingTarget: 'family',
          amountUsd: 25,
          reason: 'Emergency support',
        },
      }),
    ).resolves.toEqual({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/session/cs_test_123',
    });

    expect(mockStripeConstructor).toHaveBeenCalledWith('sk_test_123');
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://nasna.org/donate?status=success',
        cancel_url: 'https://nasna.org/donate?status=cancelled',
      }),
    );
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        donorName: 'Jane Doe',
        fundingTarget: 'family',
        amountUsd: 25,
        status: 'checkout_created',
        stripeSessionId: 'cs_test_123',
      }),
    );
  });
});
