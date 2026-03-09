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

export async function createManagedUser(payload: CreateManagedUserPayload) {
  const callable = httpsCallable<CreateManagedUserPayload, CreateManagedUserResponse>(
    functions,
    'createManagedUser',
  );
  const result = await callable(payload);
  return result.data;
}
