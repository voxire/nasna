/**
 * Seed script for the Firebase Emulator.
 * Run with: pnpm emulate:seed
 *
 * Creates test users and sample Firestore data so contributors can
 * start working immediately without touching production.
 *
 * Test accounts (all passwords: Test1234!):
 *   admin@nasna.test          — admin role
 *   ngo@nasna.test            — member role (validated NGO)
 *   agent@nasna.test          — agent role (assigned to Beirut Community Center)
 *   agent-nocenter@nasna.test — agent role (no center assigned)
 */

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

admin.initializeApp({ projectId: 'btrajek-se3dni' });

const auth = admin.auth();
const db = admin.firestore();

const PASSWORD = 'Test1234!';

async function createUser(email: string, displayName: string, role: string) {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`  ↩  ${email} already exists`);
  } catch {
    const user = await auth.createUser({ email, password: PASSWORD, displayName });
    uid = user.uid;
    console.log(`  ✓  Created ${email} (${uid})`);
  }

  await auth.setCustomUserClaims(uid, { role });
  return uid;
}

async function seed() {
  console.log('\n🌱 Seeding Firebase Emulator...\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const adminUid = await createUser('admin@nasna.test', 'Admin User', 'admin');
  const memberUid = await createUser('ngo@nasna.test', 'Test NGO', 'member');
  const agentUid = await createUser('agent@nasna.test', 'Test Agent', 'agent');
  const agentNoCenterUid = await createUser(
    'agent-nocenter@nasna.test',
    'Agent No Center',
    'agent',
  );

  // ── Member documents ───────────────────────────────────────────────────────
  console.log('\n📄 Writing member documents...');

  await db.doc(`members/${adminUid}`).set({
    uid: adminUid,
    email: 'admin@nasna.test',
    name: 'Admin User',
    role: 'admin',
    isAdmin: true,
    onboarded: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.doc(`members/${memberUid}`).set({
    uid: memberUid,
    email: 'ngo@nasna.test',
    name: 'Test NGO',
    contactPersonName: 'Test Contact',
    role: 'member',
    isAdmin: false,
    onboarded: true,
    validated: true,
    phoneNumber: '+9611234567',
    governorates: ['Beirut', 'Mount Lebanon'],
    aidTypes: ['food', 'water', 'shelter'],
    deliveryMode: 'both',
    maxCaseLoad: 20,
    currentCaseLoad: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.doc(`members/${agentUid}`).set({
    uid: agentUid,
    email: 'agent@nasna.test',
    name: 'Test Agent',
    role: 'agent',
    isAdmin: false,
    onboarded: true,
    validated: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.doc(`members/${agentNoCenterUid}`).set({
    uid: agentNoCenterUid,
    email: 'agent-nocenter@nasna.test',
    name: 'Agent No Center',
    role: 'agent',
    isAdmin: false,
    onboarded: true,
    validated: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log('  ✓  member documents written');

  // ── Centers ────────────────────────────────────────────────────────────────
  console.log('\n🏢 Creating sample centers...');

  const beirutCenterRef = await db.collection('centers').add({
    name: 'Beirut Community Center',
    type: 'community_hall',
    governorate: 'Beirut',
    district: 'Hamra',
    address: '123 Hamra Street, Beirut',
    totalCapacity: 150,
    currentOccupancy: 42,
    active: true,
    intakeOpen: true,
    phone: '+9611234567',
    aidServices: ['food', 'water', 'medical'],
    operatingHours: '08:00 - 20:00',
    coordinates: { lat: 33.8938, lng: 35.5018 },
    createdBy: adminUid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('centers').add({
    name: 'Mount Lebanon Shelter',
    type: 'school',
    governorate: 'Mount Lebanon',
    district: 'Baabda',
    address: '45 Main Road, Baabda',
    totalCapacity: 80,
    currentOccupancy: 60,
    active: true,
    intakeOpen: false,
    phone: '+9614567890',
    aidServices: ['shelter', 'clothing'],
    operatingHours: '09:00 - 18:00',
    coordinates: { lat: 33.8101, lng: 35.5972 },
    createdBy: adminUid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log('  ✓  2 centers created');

  // ── Assign agent to Beirut center ──────────────────────────────────────────
  await db.doc(`members/${agentUid}`).update({ centerId: beirutCenterRef.id });
  console.log(`  ✓  agent@nasna.test assigned to center ${beirutCenterRef.id}`);
  // agent-nocenter@nasna.test intentionally has no centerId — tests empty state

  // ── Submissions ────────────────────────────────────────────────────────────
  console.log('\n📋 Creating sample submissions...');

  await db.collection('submissions').add({
    agentUid,
    fullName: 'Ahmad Khalil',
    phone: '+9613001001',
    gender: 'male',
    governorate: 'Beirut',
    locationType: 'with_family',
    householdSize: 4,
    aidTypes: ['food', 'water'],
    aidUrgency: 'High',
    status: 'pending',
    consentGiven: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('submissions').add({
    agentUid,
    fullName: 'Fatima Hassan',
    phone: '+9613002002',
    gender: 'female',
    governorate: 'Mount Lebanon',
    locationType: 'at_center',
    householdSize: 6,
    aidTypes: ['shelter', 'medical'],
    aidUrgency: 'Medium',
    status: 'pending',
    consentGiven: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('submissions').add({
    agentUid,
    fullName: 'Omar Nasser',
    phone: '+9613003003',
    gender: 'male',
    governorate: 'Beirut',
    locationType: 'with_family',
    householdSize: 2,
    aidTypes: ['food'],
    aidUrgency: 'Low',
    status: 'assigned',
    assignedTo: memberUid,
    consentGiven: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Center-scoped submissions (visible on the agent's CenterDashboard)
  await db.collection('submissions').add({
    fullName: 'Layla Mansour',
    phoneNumber: '+9613101001',
    emailAddress: '',
    gender: 'female',
    currentGovernorate: 'Beirut',
    previousGovernorate: 'South Lebanon',
    street: 'Hamra St',
    building: '12',
    floor: '3',
    city: 'Beirut',
    ageRanges: {},
    specialNeeds: [],
    needs: ['food', 'shelter'],
    aidUrgency: 'high',
    consentGiven: true,
    comments: '',
    numberOfPeopleInHousehold: 5,
    status: 'pending',
    locationType: 'at_center',
    centerId: beirutCenterRef.id,
    agent: agentUid,
    registrationDate: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('submissions').add({
    fullName: 'Khalid Rahhal',
    phoneNumber: '+9613102002',
    emailAddress: '',
    gender: 'male',
    currentGovernorate: 'Beirut',
    previousGovernorate: 'Bekaa',
    street: 'Verdun St',
    building: '7',
    floor: '1',
    city: 'Beirut',
    ageRanges: {},
    specialNeeds: [],
    needs: ['medical', 'food'],
    aidUrgency: 'medium',
    consentGiven: true,
    comments: '',
    numberOfPeopleInHousehold: 3,
    status: 'assigned',
    locationType: 'at_center',
    centerId: beirutCenterRef.id,
    agent: agentUid,
    registrationDate: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('submissions').add({
    fullName: 'Nadia Saad',
    phoneNumber: '+9613103003',
    emailAddress: '',
    gender: 'female',
    currentGovernorate: 'Beirut',
    previousGovernorate: 'North Lebanon',
    street: 'Bliss St',
    building: '3',
    floor: '2',
    city: 'Beirut',
    ageRanges: {},
    specialNeeds: ['mobility'],
    needs: ['medical'],
    aidUrgency: 'high',
    consentGiven: true,
    comments: 'Requires wheelchair access',
    numberOfPeopleInHousehold: 2,
    status: 'in_progress',
    locationType: 'at_center',
    centerId: beirutCenterRef.id,
    agent: agentUid,
    registrationDate: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log('  ✓  3 submissions created (general) + 3 center-scoped');

  // ── Emergency contacts ─────────────────────────────────────────────────────
  console.log('\n🆘 Creating emergency contacts...');

  await db.collection('emergencyContacts').add({
    name: 'Lebanese Red Cross',
    phone: '1740',
    category: 'health',
    region: 'National',
    description: 'Emergency medical and rescue services',
    verified: true,
    displayOrder: 1,
    createdAt: Timestamp.now(),
  });

  await db.collection('emergencyContacts').add({
    name: 'Civil Defense',
    phone: '125',
    category: 'rescue',
    region: 'National',
    description: 'Fire and rescue operations',
    verified: true,
    displayOrder: 2,
    createdAt: Timestamp.now(),
  });

  console.log('  ✓  2 emergency contacts created');

  // ── Global stats ───────────────────────────────────────────────────────────
  console.log('\n📊 Initialising global stats...');

  await db.doc('stats/global').set({
    totalSubmissions: 6,
    totalCompleted: 0,
    totalPeopleHelped: 0,
    totalActiveNgos: 1,
    totalHousingAvailable: 0,
    totalPendingUrgent: 1,
    totalStalePending: 0,
    housingPendingReview: 0,
    housingReservedCapacity: 0,
    lastUpdated: Timestamp.now(),
  });

  console.log('  ✓  stats/global initialised');

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Emulator UI  →  http://localhost:4000');
  console.log('  App          →  http://localhost:5173');
  console.log('');
  console.log('  admin@nasna.test              / Test1234!  (admin)');
  console.log('  ngo@nasna.test                / Test1234!  (NGO member)');
  console.log('  agent@nasna.test              / Test1234!  (agent — has center assigned)');
  console.log(
    '  agent-nocenter@nasna.test     / Test1234!  (agent — no center, tests empty state)',
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
