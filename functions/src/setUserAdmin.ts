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

  const enableAdmin = modeArg !== 'off';
  const role = enableAdmin ? 'admin' : 'agent';

  await adminAuth.setCustomUserClaims(uid, {
    role,
    isAdmin: enableAdmin,
  });

  await db.collection('members').doc(uid).set(
    {
      role,
      isAdmin: enableAdmin,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  console.log(
    `${enableAdmin ? 'Promoted' : 'Demoted'} ${uid} ${enableAdmin ? 'to admin' : 'from admin'}`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
