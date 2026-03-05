import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

interface CheckDuplicateRequest {
  phoneNumber: string;
  emailAddress?: string;
}

interface CheckDuplicateResponse {
  phoneDuplicate: boolean;
  emailDuplicate: boolean;
}

/**
 * Callable Cloud Function that checks whether a phone number or email
 * already exists in the submissions collection.
 *
 * Returns boolean flags only — never exposes submission data.
 */
export const checkDuplicatePhone = onCall<CheckDuplicateRequest>(
  { region: 'europe-west1' },
  async (request): Promise<CheckDuplicateResponse> => {
    const { phoneNumber, emailAddress } = request.data;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new HttpsError('invalid-argument', 'phoneNumber is required');
    }

    const trimmed = phoneNumber.trim();
    if (trimmed.length < 4 || trimmed.length > 20) {
      throw new HttpsError('invalid-argument', 'Invalid phone number format');
    }

    // Check phone duplicate — PII: only boolean result returned, no submission data
    const phoneSnap = await db
      .collection('submissions')
      .where('phoneNumber', '==', trimmed)
      .limit(1)
      .get();

    let emailDuplicate = false;
    if (emailAddress && typeof emailAddress === 'string' && emailAddress.trim()) {
      const emailSnap = await db
        .collection('submissions')
        .where('emailAddress', '==', emailAddress.trim())
        .limit(1)
        .get();
      emailDuplicate = !emailSnap.empty;
    }

    return {
      phoneDuplicate: !phoneSnap.empty,
      emailDuplicate,
    };
  }
);
