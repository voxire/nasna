/**
 * Seed script for the Firebase Emulator.
 * Run with: pnpm emulate:seed
 *
 * Creates test users and sample Firestore data so contributors can
 * start working immediately without touching production.
 *
 * Test accounts (all passwords: Test1234!):
 *   superadmin@nasna.test     — super admin role
 *   admin@nasna.test          — admin role
 *   ngo@nasna.test            — member role (validated NGO)
 *   agent@nasna.test          — agent role (assigned to Beirut Community Center)
 *   agent-nocenter@nasna.test — agent role (assigned to Tripoli North Shelter, which starts empty)
 */

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

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

async function clearCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batches: Promise<FirebaseFirestore.WriteResult[]>[] = [];
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = db.batch();
    docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    batches.push(batch.commit());
  }
  await Promise.all(batches);
  console.log(`  🗑  Cleared ${docs.length} docs from "${name}"`);
}

async function seed() {
  console.log('\n🌱 Seeding Firebase Emulator...\n');

  // ── Wipe collections so reseeding is always idempotent ─────────────────────
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    clearCollection('centers'),
    clearCollection('submissions'),
    clearCollection('emergencyContacts'),
  ]);
  await db.doc('stats/global').delete();

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const superAdminUid = await createUser(
    'superadmin@nasna.test',
    'Super Admin User',
    'super_admin',
  );
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

  await db.doc(`members/${superAdminUid}`).set({
    uid: superAdminUid,
    email: 'superadmin@nasna.test',
    name: 'Super Admin User',
    role: 'super_admin',
    isAdmin: true,
    active: true,
    onboarded: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.doc(`members/${adminUid}`).set({
    uid: adminUid,
    email: 'admin@nasna.test',
    name: 'Admin User',
    role: 'admin',
    isAdmin: true,
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
    onboarded: true,
    validated: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log('  ✓  member documents written');

  // ── Centers ────────────────────────────────────────────────────────────────
  console.log('\n🏢 Creating sample centers...');

  // Fixed document IDs — safe to reseed multiple times without duplicates.
  // agent@nasna.test's center: distinctive capacity 11/111
  const BEIRUT_CENTER_ID = 'center-hamra-aid-hub';
  const TRIPOLI_CENTER_ID = 'center-tripoli-north-shelter';

  await db.doc(`centers/${BEIRUT_CENTER_ID}`).set({
    name: 'Hamra Aid Hub [AGENT CENTER]',
    type: 'community_hall',
    governorate: 'Beirut',
    district: 'Hamra',
    address: '123 Hamra Street, Beirut',
    totalCapacity: 111,
    currentOccupancy: 11,
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

  // A second center — clearly NOT the agent's (nearly full / intake closed)
  await db.doc('centers/center-baabda-shelter').set({
    name: 'Baabda Shelter [OTHER CENTER]',
    type: 'school',
    governorate: 'Mount Lebanon',
    district: 'Baabda',
    address: '45 Main Road, Baabda',
    totalCapacity: 222,
    currentOccupancy: 200,
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

  // Third center for the empty-state agent (Tripoli — no submissions, 0/333)
  await db.doc(`centers/${TRIPOLI_CENTER_ID}`).set({
    name: 'Tripoli North Shelter [EMPTY CENTER]',
    type: 'school',
    governorate: 'North Lebanon',
    district: 'Tripoli',
    address: '8 Al Mina Road, Tripoli',
    totalCapacity: 333,
    currentOccupancy: 0,
    active: true,
    intakeOpen: true,
    phone: '+9616123456',
    aidServices: ['food'],
    operatingHours: '08:00 - 18:00',
    coordinates: { lat: 34.4367, lng: 35.8497 },
    createdBy: adminUid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log('  ✓  3 centers created (fixed IDs)');

  // ── Assign agents to their centers ─────────────────────────────────────────
  await db.doc(`members/${agentUid}`).update({ centerId: BEIRUT_CENTER_ID });
  console.log(`  ✓  agent@nasna.test assigned to ${BEIRUT_CENTER_ID}`);
  await db.doc(`members/${agentNoCenterUid}`).update({ centerId: TRIPOLI_CENTER_ID });
  console.log(`  ✓  agent-nocenter@nasna.test assigned to empty-state center ${TRIPOLI_CENTER_ID}`);

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
    centerId: BEIRUT_CENTER_ID,
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
    centerId: BEIRUT_CENTER_ID,
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
    centerId: BEIRUT_CENTER_ID,
    agent: agentUid,
    registrationDate: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log('  ✓  3 submissions created (general) + 3 center-scoped');

  // Malformed submission — missing fullName and registrationDate (tests graceful rendering)
  await db.collection('submissions').add({
    fullName: '',
    phoneNumber: '',
    emailAddress: '',
    gender: 'male',
    currentGovernorate: 'Beirut',
    previousGovernorate: '',
    street: '',
    building: '',
    floor: '',
    city: '',
    ageRanges: {},
    specialNeeds: [],
    needs: [],
    aidUrgency: 'low',
    consentGiven: true,
    comments: '',
    numberOfPeopleInHousehold: 0,
    status: 'pending',
    locationType: 'at_center',
    centerId: BEIRUT_CENTER_ID,
    agent: agentUid,
    // registrationDate intentionally omitted — tests graceful "—" rendering
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log('  ✓  1 malformed submission (no name, no date, no household size)');

  // 50 bulk submissions for pagination / scroll testing
  const BULK_NAMES = [
    'Sara Hassan',
    'Omar Khalil',
    'Rania Njeim',
    'Bilal Haddad',
    'Dina Moussa',
    'Mahmoud Saleh',
    'Lina Khoury',
    'Amer Fakih',
    'Hana Zahreddine',
    'Tariq Nassar',
    'Maya Awad',
    'Fadi Daher',
    'Nour Chamoun',
    'Ziad Rizk',
    'Sana Bou Khalil',
    'Jad Gemayel',
    'Rana Hamdan',
    'Karim Slim',
    'Hiba Traboulsi',
    'Wassim Mrad',
    'Ola Barakat',
    'Chadi Feghali',
    'Mirna Tannous',
    'Alaa Kteish',
    'Rima Ghanem',
    'Elias Sarkis',
    'Nadine Lahoud',
    'Georges Abou Nasr',
    'Joumana Bassil',
    'Tony Zgheib',
    'Mona Frem',
    'Samir Khoury',
    'Carla Bou Jaoude',
    'Naji El Hajj',
    'Lara Aoun',
    'Rachid Makhoul',
    'Suzanne Haddad',
    'Ibrahim Farhat',
    'Claudine Azar',
    'Hassan Berri',
    'Viviane Sassine',
    'Bechara Tueni',
    'Ghada Mikati',
    'Marwan Hamade',
    'Hind Frangieh',
    'Elie Sfeir',
    'Pascale Gemayel',
    'Antoine Lahad',
    'Noura Jumblatt',
    'Zeina Murr',
  ];
  const STATUSES = ['pending', 'assigned', 'in_progress', 'completed'] as const;
  const NEEDS_POOL = [['food'], ['shelter'], ['medical'], ['food', 'water'], ['clothing']];
  const bulkBatch = db.batch();
  for (let i = 0; i < BULK_NAMES.length; i++) {
    const ref = db.collection('submissions').doc();
    bulkBatch.set(ref, {
      fullName: BULK_NAMES[i],
      phoneNumber: `+96170${String(200 + i).padStart(4, '0')}`,
      emailAddress: '',
      gender: i % 2 === 0 ? 'female' : 'male',
      currentGovernorate: 'Beirut',
      previousGovernorate: i % 3 === 0 ? 'South Lebanon' : 'North Lebanon',
      street: `Street ${i + 1}`,
      building: String(i + 1),
      floor: '1',
      city: 'Beirut',
      ageRanges: {},
      specialNeeds: [],
      needs: NEEDS_POOL[i % NEEDS_POOL.length],
      aidUrgency: i % 3 === 0 ? 'high' : 'medium',
      consentGiven: true,
      comments: '',
      numberOfPeopleInHousehold: (i % 6) + 1,
      status: STATUSES[i % STATUSES.length],
      locationType: 'at_center',
      centerId: BEIRUT_CENTER_ID,
      agent: agentUid,
      registrationDate: Timestamp.fromDate(new Date(Date.now() - i * 12 * 60 * 60 * 1000)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  await bulkBatch.commit();
  console.log('  ✓  50 bulk submissions for pagination testing');

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
    totalSubmissions: 60,
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
  console.log(
    '  agent@nasna.test              / Test1234!  (agent — "Hamra Aid Hub [AGENT CENTER]", cap 111/11)',
  );
  console.log(
    '  agent-nocenter@nasna.test     / Test1234!  (agent — "Tripoli North Shelter [EMPTY CENTER]", cap 333/0)',
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
