import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

type ManagedRole = 'member' | 'agent';

interface CreateManagedUserPayload {
  role: ManagedRole;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  contactPersonName?: string;
  areaOfOperation?: string;
  validateImmediately?: boolean;
}

interface CreateManagedUserResponse {
  uid: string;
  email: string;
  role: ManagedRole;
  validated: boolean;
}

interface UpdateManagedUserPayload {
  uid: string;
  role: ManagedRole;
  name: string;
  email: string;
  phoneNumber: string;
  contactPersonName?: string;
  areaOfOperation?: string;
}

export async function createManagedUser(payload: CreateManagedUserPayload) {
  const callable = httpsCallable<CreateManagedUserPayload, CreateManagedUserResponse>(
    functions,
    'createManagedUser',
  );
  const result = await callable(payload);
  return result.data;
}

export async function updateManagedUser(payload: UpdateManagedUserPayload) {
  const callable = httpsCallable<UpdateManagedUserPayload, { uid: string }>(
    functions,
    'updateManagedUser',
  );
  const result = await callable(payload);
  return result.data;
}

export async function validateManagedUser(uid: string) {
  const callable = httpsCallable<{ uid: string }, { uid: string; validated: boolean }>(
    functions,
    'validateManagedUser',
  );
  const result = await callable({ uid });
  return result.data;
}

export async function deleteManagedUser(uid: string) {
  const callable = httpsCallable<{ uid: string }, { uid: string; deleted: boolean }>(
    functions,
    'deleteManagedUser',
  );
  const result = await callable({ uid });
  return result.data;
}
