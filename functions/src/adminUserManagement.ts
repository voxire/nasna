import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (getApps().length === 0) {
  initializeApp();
}

const adminAuth = getAuth();
const db = getFirestore();

type ManagedRole = 'member' | 'agent';

interface CreateManagedUserRequest {
  role: ManagedRole;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  contactPersonName?: string;
  areaOfOperation?: string;
  validateImmediately?: boolean;
}

interface UpdateManagedUserRequest {
  uid: string;
  role: ManagedRole;
  name: string;
  email: string;
  phoneNumber: string;
  contactPersonName?: string;
  areaOfOperation?: string;
}

interface ValidateManagedUserRequest {
  uid: string;
}

interface DeleteManagedUserRequest {
  uid: string;
}

type MemberProfile = {
  role?: string;
  isAdmin?: boolean;
  validated?: boolean;
};

async function assertAdmin(uid: string, tokenRole?: string) {
  if (tokenRole === 'admin') {
    return;
  }

  const profileSnapshot = await db.collection('members').doc(uid).get();
  const profile = profileSnapshot.data() as MemberProfile | undefined;

  if (!profileSnapshot.exists || (profile?.role !== 'admin' && profile?.isAdmin !== true)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function assertUniquePhoneNumber(phoneNumber: string, excludeUid?: string) {
  const snapshot = await db
    .collection('members')
    .where('phoneNumber', '==', phoneNumber)
    .limit(5)
    .get();

  const duplicate = snapshot.docs.find((document) => document.id !== excludeUid);
  if (duplicate) {
    throw new HttpsError('already-exists', 'A user with this phone number already exists.');
  }
}

async function resolveManagedUserByEmail(email: string) {
  const userRecord = await adminAuth.getUserByEmail(email).catch(() => null);
  if (!userRecord) {
    return { userRecord: null, memberSnapshot: null };
  }

  const memberSnapshot = await db.collection('members').doc(userRecord.uid).get();
  return { userRecord, memberSnapshot };
}

function buildManagedMemberData({
  uid,
  role,
  name,
  email,
  phoneNumber,
  contactPersonName,
  areaOfOperation,
  validated,
}: {
  uid: string;
  role: ManagedRole;
  name: string;
  email: string;
  phoneNumber: string;
  contactPersonName: string;
  areaOfOperation: string;
  validated: boolean;
}) {
  return {
    uid,
    name,
    contactPersonName: role === 'member' ? contactPersonName : '',
    email,
    phoneNumber,
    areaOfOperation: role === 'agent' ? areaOfOperation : '',
    kindOfHelp: '',
    initiativeOrNgo: '',
    role,
    numberOfVolunteers: '',
    isOfficiallyRegistered: false,
    coverageType: 'governorate',
    coverageGovernorates: [],
    coverageCenterIds: [],
    aidTypes: [],
    currentCaseLoad: 0,
    maxCaseLoad: 10,
    deliveryMode: 'both',
    onboarded: true,
    consentGiven: true,
    isAdmin: false,
    validated,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const createManagedUser = onCall<CreateManagedUserRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const adminUid = request.auth?.uid;

    if (!adminUid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    await assertAdmin(adminUid, request.auth?.token.role as string | undefined);

    const role = request.data?.role;
    const name = request.data?.name?.trim();
    const email = normalizeEmail(request.data?.email ?? '');
    const phoneNumber = request.data?.phoneNumber?.trim();
    const password = request.data?.password ?? '';
    const contactPersonName = request.data?.contactPersonName?.trim() ?? '';
    const areaOfOperation = request.data?.areaOfOperation?.trim() ?? '';
    const validateImmediately = request.data?.validateImmediately !== false;

    if (role !== 'member' && role !== 'agent') {
      throw new HttpsError('invalid-argument', 'A valid role is required.');
    }

    if (!name || !email || !phoneNumber || password.length < 6) {
      throw new HttpsError('invalid-argument', 'Missing required user fields.');
    }

    if (role === 'member' && !contactPersonName) {
      throw new HttpsError('invalid-argument', 'A contact person is required for NGOs.');
    }

    if (role === 'agent' && !areaOfOperation) {
      throw new HttpsError('invalid-argument', 'An area of operation is required for agents.');
    }

    await assertUniquePhoneNumber(phoneNumber);

    const { userRecord, memberSnapshot } = await resolveManagedUserByEmail(email);

    if (userRecord && memberSnapshot?.exists) {
      throw new HttpsError('already-exists', 'A user with this email already exists.');
    }

    const targetUser =
      userRecord ??
      (await adminAuth.createUser({
        email,
        password,
        displayName: name,
      }));

    if (userRecord) {
      await adminAuth.updateUser(userRecord.uid, {
        email,
        password,
        displayName: name,
      });
    }

    try {
      await adminAuth.setCustomUserClaims(targetUser.uid, {
        role,
        isAdmin: false,
      });

      await db
        .collection('members')
        .doc(targetUser.uid)
        .set(
          buildManagedMemberData({
            uid: targetUser.uid,
            role,
            name,
            email,
            phoneNumber,
            contactPersonName,
            areaOfOperation,
            validated: validateImmediately,
          }),
        );
    } catch (error) {
      if (!userRecord) {
        await adminAuth.deleteUser(targetUser.uid).catch(() => undefined);
      }
      throw error;
    }

    return {
      uid: targetUser.uid,
      email,
      role,
      validated: validateImmediately,
    };
  },
);

export const updateManagedUser = onCall<UpdateManagedUserRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const adminUid = request.auth?.uid;

    if (!adminUid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    await assertAdmin(adminUid, request.auth?.token.role as string | undefined);

    const uid = request.data?.uid?.trim();
    const role = request.data?.role;
    const name = request.data?.name?.trim();
    const email = normalizeEmail(request.data?.email ?? '');
    const phoneNumber = request.data?.phoneNumber?.trim();
    const contactPersonName = request.data?.contactPersonName?.trim() ?? '';
    const areaOfOperation = request.data?.areaOfOperation?.trim() ?? '';

    if (!uid || (role !== 'member' && role !== 'agent') || !name || !email || !phoneNumber) {
      throw new HttpsError('invalid-argument', 'Managed user update is incomplete.');
    }

    if (role === 'member' && !contactPersonName) {
      throw new HttpsError('invalid-argument', 'A contact person is required for NGOs.');
    }

    if (role === 'agent' && !areaOfOperation) {
      throw new HttpsError('invalid-argument', 'An area of operation is required for agents.');
    }

    await assertUniquePhoneNumber(phoneNumber, uid);

    const memberRef = db.collection('members').doc(uid);
    const memberSnapshot = await memberRef.get();

    if (!memberSnapshot.exists) {
      throw new HttpsError('not-found', 'Managed user profile not found.');
    }

    const existingUserWithEmail = await adminAuth.getUserByEmail(email).catch(() => null);
    if (existingUserWithEmail && existingUserWithEmail.uid !== uid) {
      throw new HttpsError('already-exists', 'A user with this email already exists.');
    }

    await adminAuth.updateUser(uid, {
      email,
      displayName: name,
    });

    await adminAuth.setCustomUserClaims(uid, {
      role,
      isAdmin: false,
    });

    await memberRef.set(
      {
        name,
        contactPersonName: role === 'member' ? contactPersonName : '',
        email,
        phoneNumber,
        areaOfOperation: role === 'agent' ? areaOfOperation : '',
        role,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return { uid, email, role };
  },
);

export const validateManagedUser = onCall<ValidateManagedUserRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const adminUid = request.auth?.uid;

    if (!adminUid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    await assertAdmin(adminUid, request.auth?.token.role as string | undefined);

    const uid = request.data?.uid?.trim();
    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid is required.');
    }

    const memberRef = db.collection('members').doc(uid);
    const snapshot = await memberRef.get();
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Managed user profile not found.');
    }

    await memberRef.set(
      {
        validated: true,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return { uid, validated: true };
  },
);

export const deleteManagedUser = onCall<DeleteManagedUserRequest>(
  { region: 'europe-west1' },
  async (request) => {
    const adminUid = request.auth?.uid;

    if (!adminUid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    await assertAdmin(adminUid, request.auth?.token.role as string | undefined);

    const uid = request.data?.uid?.trim();
    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid is required.');
    }

    const memberRef = db.collection('members').doc(uid);
    const snapshot = await memberRef.get();
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Managed user profile not found.');
    }

    await memberRef.delete();
    await adminAuth.deleteUser(uid).catch((error: { code?: string }) => {
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    });

    return { uid, deleted: true };
  },
);
