import { openDB } from 'idb';

const DB_NAME = 'nasna-offline';
const DB_VERSION = 1;
const DRAFT_STORE = 'drafts';
const QUEUE_STORE = 'queuedSubmissions';

export interface QueuedSubmissionRecord {
  localId: string;
  agentUid: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'syncing' | 'failed';
  retryCount: number;
  lastError: string;
  createdAt: number;
  syncedAt: number | null;
}

interface DraftRecord<T> {
  key: string;
  value: T;
  updatedAt: number;
}

async function getOfflineDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: 'key' });
      }

      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        const store = database.createObjectStore(QUEUE_STORE, { keyPath: 'localId' });
        store.createIndex('agentUid', 'agentUid');
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

export async function saveSubmissionDraft<T>(key: string, value: T) {
  const database = await getOfflineDb();

  await database.put(DRAFT_STORE, {
    key,
    value,
    updatedAt: Date.now(),
  } satisfies DraftRecord<T>);
}

export async function loadSubmissionDraft<T>(key: string) {
  const database = await getOfflineDb();
  const record = (await database.get(DRAFT_STORE, key)) as DraftRecord<T> | undefined;
  return record?.value ?? null;
}

export async function clearSubmissionDraft(key: string) {
  const database = await getOfflineDb();
  await database.delete(DRAFT_STORE, key);
}

export async function queueSubmission(agentUid: string, payload: Record<string, unknown>) {
  const database = await getOfflineDb();
  const localId = crypto.randomUUID();

  await database.put(QUEUE_STORE, {
    localId,
    agentUid,
    payload,
    status: 'queued',
    retryCount: 0,
    lastError: '',
    createdAt: Date.now(),
    syncedAt: null,
  } satisfies QueuedSubmissionRecord);

  return localId;
}

export async function listQueuedSubmissions(agentUid: string) {
  const database = await getOfflineDb();
  const submissions = (await database.getAll(QUEUE_STORE)) as QueuedSubmissionRecord[];

  return submissions
    .filter((submission) => submission.agentUid === agentUid)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export async function syncQueuedSubmissions(
  agentUid: string,
  submitter: (payload: Record<string, unknown>) => Promise<void>,
) {
  const database = await getOfflineDb();
  const queuedItems = await listQueuedSubmissions(agentUid);
  let syncedCount = 0;

  for (const item of queuedItems) {
    try {
      await database.put(QUEUE_STORE, {
        ...item,
        status: 'syncing',
        lastError: '',
      } satisfies QueuedSubmissionRecord);

      await submitter(item.payload);
      await database.delete(QUEUE_STORE, item.localId);
      syncedCount += 1;
    } catch (error) {
      await database.put(QUEUE_STORE, {
        ...item,
        status: 'failed',
        retryCount: item.retryCount + 1,
        lastError: error instanceof Error ? error.message : 'Sync failed',
      } satisfies QueuedSubmissionRecord);
    }
  }

  return syncedCount;
}
