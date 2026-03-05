import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

async function backfillMembers() {
  const snapshot = await db.collection('members').get();
  let updatedCount = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    const updates: Record<string, unknown> = {};

    if (!('coverageType' in data)) updates.coverageType = 'governorate';
    if (!('coverageGovernorates' in data)) updates.coverageGovernorates = [];
    if (!('coverageCenterIds' in data)) updates.coverageCenterIds = [];
    if (!('aidTypes' in data)) updates.aidTypes = [];
    if (!('currentCaseLoad' in data)) updates.currentCaseLoad = 0;
    if (!('maxCaseLoad' in data)) updates.maxCaseLoad = 10;
    if (!('deliveryMode' in data)) updates.deliveryMode = 'both';
    if (!('onboarded' in data)) updates.onboarded = true;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = data.updatedAt ?? new Date();
      await document.ref.set(updates, { merge: true });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function backfillSubmissions() {
  const snapshot = await db.collection('submissions').get();
  let updatedCount = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    const updates: Record<string, unknown> = {};

    if (!('status' in data)) updates.status = 'pending';
    if (!('locationType' in data)) updates.locationType = 'with_family';
    if (!('centerId' in data)) updates.centerId = '';
    if (!('assignedTo' in data)) updates.assignedTo = '';
    if (!('assignedAt' in data)) updates.assignedAt = null;
    if (!('aidDelivered' in data)) updates.aidDelivered = false;
    if (!('lastUpdatedBy' in data)) updates.lastUpdatedBy = '';
    if (!('staleFlagged' in data)) updates.staleFlagged = false;
    if (!('source' in data)) updates.source = data.agent ? 'agent' : 'migration';
    if (!('createdAt' in data)) {
      updates.createdAt =
        data.registrationDate instanceof Timestamp ? data.registrationDate.toDate() : new Date();
    }
    if (!('updatedAt' in data)) {
      updates.updatedAt =
        data.registrationDate instanceof Timestamp ? data.registrationDate.toDate() : new Date();
    }

    if (Object.keys(updates).length > 0) {
      await document.ref.set(updates, { merge: true });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function ensureGlobalStats() {
  const statsRef = db.collection('stats').doc('global');
  const snapshot = await statsRef.get();

  if (snapshot.exists) {
    return false;
  }

  await statsRef.set({
    submissionsRegistered: 0,
    submissionsAssigned: 0,
    submissionsCompleted: 0,
    peopleHelped: 0,
    activeNgoCount: 0,
    housingAvailable: 0,
    updatedAt: new Date(),
  });

  return true;
}

async function run() {
  const [membersUpdated, submissionsUpdated, createdStats] = await Promise.all([
    backfillMembers(),
    backfillSubmissions(),
    ensureGlobalStats(),
  ]);

  console.log(
    JSON.stringify({
      membersUpdated,
      submissionsUpdated,
      createdStats,
    }),
  );
}

void run().catch((error) => {
  console.error('Failed to backfill v2 data', error);
  process.exitCode = 1;
});
