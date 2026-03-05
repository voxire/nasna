import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

type FundingTarget = 'family' | 'center' | 'ngo';

const TARGET_LABELS: Record<FundingTarget, string> = {
  family: 'Fund a family',
  center: 'Fund a center',
  ngo: 'Fund an NGO',
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new HttpsError('failed-precondition', 'Stripe is not configured.');
  }

  return new Stripe(secretKey);
}

export const createDonationCheckoutSession = onCall(
  {
    region: 'europe-west1',
  },
  async (request) => {
    const { donorName, donorPhone, fundingTarget, amountUsd, reason } = request.data as {
      donorName?: string;
      donorPhone?: string;
      fundingTarget?: FundingTarget;
      amountUsd?: number;
      reason?: string;
    };

    if (!donorName || !donorPhone || !fundingTarget || !reason || !Number.isFinite(amountUsd)) {
      throw new HttpsError('invalid-argument', 'Missing donation fields.');
    }

    const normalizedAmountUsd = Number(amountUsd);

    if (!['family', 'center', 'ngo'].includes(fundingTarget) || normalizedAmountUsd < 1) {
      throw new HttpsError('invalid-argument', 'Invalid donation payload.');
    }

    const stripe = getStripeClient();
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173';
    const donationRef = db.collection('donations').doc();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/donate?status=success`,
      cancel_url: `${appUrl}/donate?status=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(normalizedAmountUsd * 100),
            product_data: {
              name: TARGET_LABELS[fundingTarget],
              description: reason,
            },
          },
        },
      ],
      metadata: {
        donationId: donationRef.id,
        donorName,
        donorPhone,
        fundingTarget,
        reason,
      },
    });

    await donationRef.set({
      donorName,
      donorPhone,
      fundingTarget,
      reason,
      amountUsd: normalizedAmountUsd,
      status: 'checkout_created',
      stripeSessionId: session.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  },
);
