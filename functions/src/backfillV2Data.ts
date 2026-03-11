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

async function backfillCenters() {
  const snapshot = await db.collection('centers').get();
  let updatedCount = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    const updates: Record<string, unknown> = {};

    // Rename active → isActive
    if ('active' in data && !('isActive' in data)) updates.isActive = data.active;
    // Rename capacity → totalCapacity
    if ('capacity' in data && !('totalCapacity' in data)) updates.totalCapacity = data.capacity;
    // Rename occupiedCapacity → currentOccupancy
    if ('occupiedCapacity' in data && !('currentOccupancy' in data))
      updates.currentOccupancy = data.occupiedCapacity;
    // Rename city → district (best-effort mapping)
    if ('city' in data && !('district' in data)) updates.district = data.city;
    // Rename contactName → managerName (PII: admin only)
    if ('contactName' in data && !('managerName' in data)) updates.managerName = data.contactName;
    // Rename contactPhone → managerPhone (PII: admin only)
    if ('contactPhone' in data && !('managerPhone' in data))
      updates.managerPhone = data.contactPhone;
    // Ensure required fields have defaults
    if (!('isActive' in data) && !('active' in data)) updates.isActive = true;
    if (!('totalCapacity' in data) && !('capacity' in data)) updates.totalCapacity = 0;
    if (!('currentOccupancy' in data) && !('occupiedCapacity' in data))
      updates.currentOccupancy = 0;
    if (!('createdBy' in data)) updates.createdBy = 'migration';

    if (Object.keys(updates).length > 0) {
      await document.ref.set(updates, { merge: true });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function backfillHousing() {
  const snapshot = await db.collection('housing').get();
  let updatedCount = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    const updates: Record<string, unknown> = {};

    // Rename hostName → listerName (PII: admin only)
    if ('hostName' in data && !('listerName' in data)) updates.listerName = data.hostName;
    // Rename hostPhone → listerPhone (PII: admin only)
    if ('hostPhone' in data && !('listerPhone' in data)) updates.listerPhone = data.hostPhone;
    // Rename area → governorate
    if ('area' in data && !('governorate' in data)) updates.governorate = data.area;
    // Map priceType 'paid' → 'market_rate'
    if (data.priceType === 'paid') updates.priceType = 'market_rate';
    // Map status 'approved' → 'available'
    if (data.status === 'approved') updates.status = 'available';
    // Ensure listerId is set
    if (!('listerId' in data)) updates.listerId = 'anonymous';
    // Ensure type is set
    if (!('type' in data)) updates.type = 'apartment';
    // Ensure capacity is set (map from old availableSpots if needed)
    if (!('capacity' in data) && 'availableSpots' in data) updates.capacity = data.availableSpots;

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
  const [membersUpdated, submissionsUpdated, centersUpdated, housingUpdated, createdStats] =
    await Promise.all([
      backfillMembers(),
      backfillSubmissions(),
      backfillCenters(),
      backfillHousing(),
      ensureGlobalStats(),
    ]);

  console.log(
    JSON.stringify({
      membersUpdated,
      submissionsUpdated,
      centersUpdated,
      housingUpdated,
      createdStats,
    }),
  );
}

void run().catch((error) => {
  console.error('Failed to backfill v2 data', error);
  process.exitCode = 1;
});
