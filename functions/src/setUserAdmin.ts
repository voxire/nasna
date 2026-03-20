import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

const adminAuth = getAuth();
const db = getFirestore();

async function main() {
  const [, , uid, modeArg] = process.argv;

  if (!uid) {
    console.error('Usage: pnpm set-admin <uid> [on|off]');
    process.exit(1);
  }

  const enableSuperAdmin = modeArg !== 'off';
  const role = enableSuperAdmin ? 'super_admin' : 'agent';

  await adminAuth.setCustomUserClaims(uid, {
    role,
    isAdmin: enableSuperAdmin,
  });

  await db.collection('members').doc(uid).set(
    {
      role,
      active: true,
      isAdmin: enableSuperAdmin,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  console.log(
    `${enableSuperAdmin ? 'Promoted' : 'Demoted'} ${uid} ${enableSuperAdmin ? 'to super admin' : 'from super admin'}`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
