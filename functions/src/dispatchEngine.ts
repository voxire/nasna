import { getApps, initializeApp } from 'firebase-admin/app';
import {
  FieldPath,
  FieldValue,
  getFirestore,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { sendAdminStaleCasesAlert, sendNgoNewCaseAlert } from './email';
import { sendWhatsAppTemplate, sendWhatsAppText } from './utils/meta';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const GLOBAL_STATS_DOC = db.collection('stats').doc('global');
const STALE_CASE_THRESHOLD_HOURS = 24;

type SubmissionStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

interface SubmissionRecord {
  fullName?: string;
  currentGovernorate?: string;
  numberOfPeopleInHousehold?: number;
  needs?: string[];
  aidUrgency?: string;
  assignedTo?: string;
  status?: SubmissionStatus;
  staleFlagged?: boolean;
  updatedAt?: Timestamp | Date;
  registrationDate?: Timestamp;
  source?: string;
  locationType?: 'with_family' | 'center';
  centerId?: string;
  // PII: admin + assigned agent only. Never expose to members.
  whatsappPhone?: string;
}

interface MemberRecord {
  email?: string;
  name?: string;
  role?: string;
  validated?: boolean;
  currentCaseLoad?: number;
  maxCaseLoad?: number;
  coverageGovernorates?: string[];
  coverageCenterIds?: string[];
  aidTypes?: string[];
  phoneNumber?: string;
}

interface HousingRecord {
  capacity?: number; // was: availableSpots (migrated by backfillV2Data.ts)
  status?: 'pending_review' | 'available' | 'reserved' | 'filled'; // was: 'approved'
}

async function ensureGlobalStatsDocument() {
  await GLOBAL_STATS_DOC.set(
    {
      totalRegistered: 0,
      totalAssigned: 0,
      totalCompleted: 0,
      totalPeopleHelped: 0,
      totalPending: 0,
      activeNGOs: 0,
      housingAvailable: 0,
      byGovernorate: {},
      byNeed: {},
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}

async function createNotification(options: {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  channel: 'email' | 'system';
  relatedSubmissionId: string;
}): Promise<boolean> {
  const notificationRef = db.collection('notifications').doc(options.id);
  const notificationSnapshot = await notificationRef.get();

  if (notificationSnapshot.exists) {
    logger.info('Skipping duplicate notification', { notificationId: options.id });
    return false;
  }

  await notificationRef.set({
    recipientUid: options.recipientUid,
    title: options.title,
    body: options.body,
    channel: options.channel,
    status: 'pending',
    relatedSubmissionId: options.relatedSubmissionId,
    createdAt: new Date(),
    sentAt: null,
  });

  return true;
}

async function updateNotificationStatus(
  notificationId: string,
  status: 'sent' | 'failed',
): Promise<void> {
  const notificationRef = db.collection('notifications').doc(notificationId);
  await notificationRef.set(
    {
      status,
      ...(status === 'sent' ? { sentAt: Timestamp.now() } : {}),
    },
    { merge: true },
  );
}

async function createAdminNotifications(
  notificationIdPrefix: string,
  title: string,
  body: string,
  submissionId: string,
) {
  const adminSnapshot = await db.collection('members').where('isAdmin', '==', true).limit(20).get();

  await Promise.all(
    adminSnapshot.docs.map((document) =>
      createNotification({
        id: `${notificationIdPrefix}:${document.id}`,
        recipientUid: document.id,
        title,
        body,
        channel: 'system',
        relatedSubmissionId: submissionId,
      }),
    ),
  );
}

async function incrementMemberCaseLoad(memberUid: string, delta: number) {
  const memberRef = db.collection('members').doc(memberUid);

  await db.runTransaction(async (transaction) => {
    const memberSnapshot = await transaction.get(memberRef);
    if (!memberSnapshot.exists) {
      logger.warn('Skipping caseload update for missing member', { memberUid, delta });
      return;
    }

    const currentCaseLoad = Number(memberSnapshot.data()?.currentCaseLoad ?? 0);
    transaction.set(
      memberRef,
      {
        currentCaseLoad: Math.max(0, currentCaseLoad + delta),
        updatedAt: new Date(),
      },
      { merge: true },
    );
  });
}

async function refreshActiveNgoCount() {
  const memberSnapshot = await db
    .collection('members')
    .where('role', '==', 'member')
    .where('validated', '==', true)
    .get();

  const activeNGOs = memberSnapshot.docs.filter(
    (document) => Number(document.data().currentCaseLoad ?? 0) > 0,
  ).length;

  await GLOBAL_STATS_DOC.set(
    {
      activeNGOs,
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}

async function refreshHousingAvailability() {
  // status 'available' — 'approved' was migrated to 'available' by backfillV2Data.ts
  const housingSnapshot = await db.collection('housing').where('status', '==', 'available').get();
  const housingAvailable = housingSnapshot.docs.reduce(
    (total, document) => total + Number((document.data() as HousingRecord).capacity ?? 0),
    0,
  );

  await GLOBAL_STATS_DOC.set(
    {
      housingAvailable,
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}

const REBUILD_BATCH_SIZE = 200;

async function rebuildGlobalStats() {
  // ADMIN REBUILD TOOL: full collection scan is intentional here.
  // This function is scheduled nightly and invoked manually by admins only.
  // Client-facing queries must never do unbounded scans.

  // Accumulator
  let totalRegistered = 0;
  let totalPending = 0;
  let totalAssigned = 0;
  let totalCompleted = 0;
  let totalPeopleHelped = 0;
  const byGovernorate: Record<string, number> = {};
  const byNeed: Record<string, number> = {};

  // Paginated scan of submissions
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let hasMore = true;

  while (hasMore) {
    // Use documentId() not a data field — Firestore silently drops documents
    // that are missing the ordered field, which would corrupt the rebuild totals.
    let batchQuery = db
      .collection('submissions')
      .orderBy(FieldPath.documentId())
      .limit(REBUILD_BATCH_SIZE);

    if (lastDoc) {
      batchQuery = batchQuery.startAfter(lastDoc);
    }

    const batchSnapshot = await batchQuery.get();
    hasMore = batchSnapshot.size === REBUILD_BATCH_SIZE;

    if (batchSnapshot.empty) break;
    lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];

    for (const doc of batchSnapshot.docs) {
      const submission = doc.data() as SubmissionRecord;
      totalRegistered++;

      const status = submission.status ?? 'pending';
      if (status === 'pending') totalPending++;
      else if (status === 'assigned' || status === 'in_progress') totalAssigned++;
      else if (status === 'completed') {
        totalCompleted++;
        totalPeopleHelped += Number(submission.numberOfPeopleInHousehold ?? 0);
      }

      const gov = submission.currentGovernorate;
      if (gov) byGovernorate[gov] = (byGovernorate[gov] ?? 0) + 1;

      for (const need of submission.needs ?? []) {
        byNeed[need] = (byNeed[need] ?? 0) + 1;
      }
    }
  }

  // Members: activeNGOs
  const memberSnapshot = await db
    .collection('members')
    .where('role', '==', 'member')
    .where('validated', '==', true)
    .get();
  const activeNGOs = memberSnapshot.docs.filter(
    (doc) => Number((doc.data() as MemberRecord).currentCaseLoad ?? 0) > 0,
  ).length;

  // Housing: status 'available' — 'approved' was migrated by backfillV2Data.ts
  const housingSnapshot = await db.collection('housing').where('status', '==', 'available').get();
  const housingAvailable = housingSnapshot.docs.reduce(
    (total, doc) => total + Number((doc.data() as HousingRecord).capacity ?? 0),
    0,
  );

  await GLOBAL_STATS_DOC.set(
    {
      totalRegistered,
      totalPending,
      totalAssigned,
      totalCompleted,
      totalPeopleHelped,
      activeNGOs,
      housingAvailable,
      byGovernorate,
      byNeed,
      lastUpdatedAt: new Date(),
    },
    { merge: true },
  );
}

function getTimestampValue(
  value: SubmissionRecord['updatedAt'] | SubmissionRecord['registrationDate'],
) {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

function isCaseTerminal(status?: SubmissionStatus) {
  return status === 'completed' || status === 'cancelled';
}

async function getMemberDocument(
  memberUid: string,
): Promise<QueryDocumentSnapshot | DocumentSnapshot | null> {
  const memberSnapshot = await db.collection('members').doc(memberUid).get();
  return memberSnapshot.exists ? memberSnapshot : null;
}

export const onNewSubmission = onDocumentCreated(
  {
    document: 'submissions/{submissionId}',
    region: 'europe-west1',
  },
  async (event) => {
    if (!event.data) {
      return;
    }

    const submissionId = event.params.submissionId;
    const submission = event.data.data() as SubmissionRecord;

    await ensureGlobalStatsDocument();

    // Match NGOs by governorate coverage and (optionally) center coverage
    const governorate = submission.currentGovernorate ?? 'Unknown';
    const centerId = submission.centerId;
    const submissionNeeds = submission.needs ?? [];

    await GLOBAL_STATS_DOC.set(
      {
        totalRegistered: FieldValue.increment(1),
        totalPending: FieldValue.increment(1),
        [`byGovernorate.${governorate}`]: FieldValue.increment(1),
        ...submissionNeeds.reduce<Record<string, FieldValue>>(
          (acc, need) => ({
            ...acc,
            [`byNeed.${need}`]: FieldValue.increment(1),
          }),
          {},
        ),
        lastUpdatedAt: new Date(),
      },
      { merge: true },
    );

    await createAdminNotifications(
      `submission-created:${submissionId}`,
      'New case submitted',
      `${submission.fullName ?? 'A household'} in ${submission.currentGovernorate ?? 'an unknown area'} needs review.`,
      submissionId,
    );

    // Query by governorate coverage
    const governorateQuery = db
      .collection('members')
      .where('role', '==', 'member')
      .where('validated', '==', true)
      .where('coverageGovernorates', 'array-contains', governorate)
      .limit(50);

    // Query by center coverage (if applicable)
    const centerQuery =
      centerId && submission.locationType === 'center'
        ? db
            .collection('members')
            .where('role', '==', 'member')
            .where('validated', '==', true)
            .where('coverageCenterIds', 'array-contains', centerId)
            .limit(50)
        : null;

    const [governorateSnapshot, centerSnapshot] = await Promise.all([
      governorateQuery.get(),
      centerQuery ? centerQuery.get() : Promise.resolve(null),
    ]);

    // Merge and deduplicate matched members
    const memberMap = new Map<
      string,
      FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    >();
    for (const doc of governorateSnapshot.docs) {
      memberMap.set(doc.id, doc);
    }
    if (centerSnapshot) {
      for (const doc of centerSnapshot.docs) {
        memberMap.set(doc.id, doc);
      }
    }

    // Filter: aidTypes must intersect with needs, and caseLoad must be below max
    const matchedMembers = [...memberMap.entries()].filter(([, doc]) => {
      const member = doc.data() as MemberRecord;

      // Must have an email to receive notifications
      if (!member.email) return false;

      // Filter by aidTypes intersection (skip if NGO has no aidTypes configured)
      const memberAidTypes = member.aidTypes ?? [];
      if (memberAidTypes.length > 0 && submissionNeeds.length > 0) {
        const hasOverlap = submissionNeeds.some((need) => memberAidTypes.includes(need));
        if (!hasOverlap) return false;
      }

      // Filter by caseLoad capacity (0 = unlimited)
      const maxLoad = member.maxCaseLoad ?? 0;
      if (maxLoad > 0) {
        const currentLoad = member.currentCaseLoad ?? 0;
        if (currentLoad >= maxLoad) return false;
      }

      return true;
    });

    // If zero NGOs matched, create an admin alert
    if (matchedMembers.length === 0) {
      await createAdminNotifications(
        `no-ngo-match:${submissionId}`,
        'No NGO match for new case',
        `No validated NGO covers ${governorate} with matching aid types for case ${submissionId}. Manual dispatch required.`,
        submissionId,
      );
      logger.info('No NGO matched for new submission', { submissionId, governorate });
      return;
    }

    const pendingInAreaSnapshot = await db
      .collection('submissions')
      .where('currentGovernorate', '==', governorate)
      .where('status', '==', 'pending')
      .limit(1000)
      .get();

    const caseCount = pendingInAreaSnapshot.size;

    await Promise.all(
      matchedMembers.map(async ([memberId, doc]) => {
        const member = doc.data() as MemberRecord;
        const notificationId = `ngo-new-case:${submissionId}:${memberId}`;

        const created = await createNotification({
          id: notificationId,
          recipientUid: memberId,
          title: 'New case in your area',
          body: `New case in ${governorate} — needs: ${submissionNeeds.join(', ') || 'unspecified'} — ${submission.aidUrgency ?? 'Unknown'} urgency`,
          channel: 'email',
          relatedSubmissionId: submissionId,
        });

        if (!created) return;

        try {
          await sendNgoNewCaseAlert({
            recipientEmail: member.email!,
            recipientName: member.name ?? 'Team',
            governorate,
            needs: submissionNeeds,
            urgency: submission.aidUrgency ?? 'Unknown',
            caseCount,
          });
          await updateNotificationStatus(notificationId, 'sent');
        } catch (error) {
          logger.error('Failed to send NGO new case alert email', {
            recipientUid: memberId,
            submissionId,
            error,
          });
          await updateNotificationStatus(notificationId, 'failed');
        }
      }),
    );

    logger.info('Processed new submission trigger', {
      submissionId,
      matchedNgoCount: matchedMembers.length,
    });
  },
);

export const onCaseAssigned = onDocumentUpdated(
  {
    document: 'submissions/{submissionId}',
    region: 'europe-west1',
    secrets: ['META_WA_PHONE_NUMBER_ID', 'META_WA_ACCESS_TOKEN'],
  },
  async (event) => {
    if (!event.data) {
      return;
    }

    const before = event.data.before.data() as SubmissionRecord;
    const after = event.data.after.data() as SubmissionRecord;
    const submissionId = event.params.submissionId;
    const previousAssignedTo = before.assignedTo ?? '';
    const nextAssignedTo = after.assignedTo ?? '';

    if (!nextAssignedTo || previousAssignedTo === nextAssignedTo) {
      return;
    }

    await ensureGlobalStatsDocument();

    if (previousAssignedTo) {
      await incrementMemberCaseLoad(previousAssignedTo, -1);
    }

    await incrementMemberCaseLoad(nextAssignedTo, 1);

    const beforeStatus = before.status ?? 'pending';
    const isEverFirstAssignment = !previousAssignedTo; // only increment on first assignment

    await GLOBAL_STATS_DOC.set(
      {
        ...(isEverFirstAssignment ? { totalAssigned: FieldValue.increment(1) } : {}),
        ...(isEverFirstAssignment && beforeStatus === 'pending'
          ? { totalPending: FieldValue.increment(-1) }
          : {}),
        lastUpdatedAt: new Date(),
      },
      { merge: true },
    );

    const memberSnapshot = await getMemberDocument(nextAssignedTo);
    const memberData = memberSnapshot?.data() as MemberRecord | undefined;

    await createNotification({
      id: `case-assigned:${submissionId}:${nextAssignedTo}`,
      recipientUid: nextAssignedTo,
      title: 'Case assigned',
      body: `A new case for ${after.fullName ?? 'a household'} has been assigned to ${memberData?.name ?? 'your organization'}.`,
      channel: memberData?.email ? 'email' : 'system',
      relatedSubmissionId: submissionId,
    });

    if (after.source === 'whatsapp' && after.whatsappPhone) {
      try {
        // Try to retrieve user's preferred language from wa_session.
        // Session may no longer exist if it was cleaned up after registration; default to Arabic.
        let botLang: 'ar' | 'en' | 'fr' = 'ar';
        // PII: after.whatsappPhone is used as session key — never log this value
        const sessionSnap = await db.collection('wa_sessions').doc(after.whatsappPhone).get();
        if (sessionSnap.exists) {
          const sessionData = sessionSnap.data() as { lang?: string };
          if (sessionData.lang === 'en' || sessionData.lang === 'fr') {
            botLang = sessionData.lang;
          }
        }

        const templateLangCode = botLang === 'fr' ? 'fr' : botLang === 'en' ? 'en' : 'ar';
        const ngoName = memberData?.name ?? '';

        await sendWhatsAppTemplate(
          // PII: after.whatsappPhone is the recipient — never log this value
          after.whatsappPhone,
          // PLACEHOLDER: replace 'nasna_case_assigned' with your approved Meta template name
          // once approved in Meta Business Manager (WhatsApp Manager > Message Templates).
          // Template body (Arabic): "تم تعيين حالتك ({{1}}) إلى {{2}}. سيتواصلون معك قريباً."
          // Template body (English): "Your case ({{1}}) has been assigned to {{2}}. They will contact you soon."
          'nasna_case_assigned',
          templateLangCode,
          [submissionId, ngoName], // {{1}} = case ID, {{2}} = org name
        );
        logger.info('Sent WhatsApp assignment notification', { submissionId });
      } catch (error) {
        logger.error('Failed to send WhatsApp assignment notification', {
          submissionId,
          error,
        });
      }
    }

    await refreshActiveNgoCount();

    logger.info('Processed case assignment trigger', {
      submissionId,
      nextAssignedTo,
      previousAssignedTo,
    });
  },
);

export const onCaseCompleted = onDocumentUpdated(
  {
    document: 'submissions/{submissionId}',
    region: 'europe-west1',
    secrets: ['META_WA_PHONE_NUMBER_ID', 'META_WA_ACCESS_TOKEN'],
  },
  async (event) => {
    if (!event.data) {
      return;
    }

    const before = event.data.before.data() as SubmissionRecord;
    const after = event.data.after.data() as SubmissionRecord;
    const submissionId = event.params.submissionId;
    const previousStatus = before.status ?? 'pending';
    const nextStatus = after.status ?? 'pending';

    if (!isCaseTerminal(nextStatus) || previousStatus === nextStatus) {
      return;
    }

    await ensureGlobalStatsDocument();

    if (after.assignedTo) {
      await incrementMemberCaseLoad(after.assignedTo, -1);
    }

    const wasPending = previousStatus === 'pending';
    const wasAssigned = previousStatus === 'assigned' || previousStatus === 'in_progress';

    if (nextStatus === 'completed') {
      await GLOBAL_STATS_DOC.set(
        {
          totalCompleted: FieldValue.increment(1),
          totalPeopleHelped: FieldValue.increment(Number(after.numberOfPeopleInHousehold ?? 0)),
          ...(wasAssigned ? { totalAssigned: FieldValue.increment(-1) } : {}),
          ...(wasPending ? { totalPending: FieldValue.increment(-1) } : {}),
          lastUpdatedAt: new Date(),
        },
        { merge: true },
      );
    } else {
      // cancelled — only update timestamp
      await GLOBAL_STATS_DOC.set({ lastUpdatedAt: new Date() }, { merge: true });
    }

    if (after.assignedTo) {
      const memberSnapshot = await getMemberDocument(after.assignedTo);
      const memberData = memberSnapshot?.data() as MemberRecord | undefined;

      await createNotification({
        id: `case-terminal:${submissionId}:${nextStatus}:${after.assignedTo}`,
        recipientUid: after.assignedTo,
        title: nextStatus === 'completed' ? 'Case completed' : 'Case cancelled',
        body:
          nextStatus === 'completed'
            ? `The case for ${after.fullName ?? 'a household'} has been marked complete.`
            : `The case for ${after.fullName ?? 'a household'} has been cancelled.`,
        channel: memberData?.email ? 'email' : 'system',
        relatedSubmissionId: submissionId,
      });
    }

    if (nextStatus === 'completed' && after.source === 'whatsapp' && after.whatsappPhone) {
      try {
        // NOTE: This free-form message requires the user to have messaged within the last 24h.
        // If cases routinely complete days after registration, create a completion template in
        // Meta Business Manager and switch this to sendWhatsAppTemplate.
        await sendWhatsAppText(
          // PII: after.whatsappPhone is the recipient — never log this value
          after.whatsappPhone,
          `تم إغلاق حالتك (#${submissionId}) ✅\nنشكرك على ثقتك بنسنا.`,
        );
        logger.info('Sent WhatsApp completion notification', { submissionId });
      } catch (error) {
        logger.error('Failed to send WhatsApp completion notification', {
          submissionId,
          error,
        });
      }
    }

    await refreshActiveNgoCount();

    logger.info('Processed terminal case trigger', {
      submissionId,
      previousStatus,
      nextStatus,
    });
  },
);

const STALE_CHECK_BATCH_SIZE = 200;

export const dailyStaleCaseCheck = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'Asia/Beirut',
    region: 'europe-west1',
    secrets: ['META_WA_PHONE_NUMBER_ID', 'META_WA_ACCESS_TOKEN'],
  },
  async () => {
    const staleBefore = Date.now() - STALE_CASE_THRESHOLD_HOURS * 60 * 60 * 1000;
    const allStaleCaseIds: string[] = [];
    const memberCache = new Map<string, MemberRecord>();

    // Process submissions in cursor-paginated batches to bound memory and read cost
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    let hasMore = true;

    while (hasMore) {
      let batchQuery = db
        .collection('submissions')
        .where('status', 'in', ['pending', 'assigned', 'in_progress'])
        .where('staleFlagged', '!=', true)
        .orderBy('staleFlagged')
        .limit(STALE_CHECK_BATCH_SIZE);

      if (lastDoc) {
        batchQuery = batchQuery.startAfter(lastDoc);
      }

      const batchSnapshot = await batchQuery.get();
      hasMore = batchSnapshot.size === STALE_CHECK_BATCH_SIZE;

      if (batchSnapshot.empty) break;
      lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];

      const staleDocs = batchSnapshot.docs.filter((document) => {
        const submission = document.data() as SubmissionRecord;
        const activityAt = Math.max(
          getTimestampValue(submission.updatedAt),
          getTimestampValue(submission.registrationDate),
        );
        return activityAt > 0 && activityAt <= staleBefore;
      });

      if (staleDocs.length === 0) continue;

      // Pre-fetch assigned NGO members for this batch (deduped via cache)
      const newMemberUids = [
        ...new Set(
          staleDocs
            .map((doc) => {
              const s = doc.data() as SubmissionRecord;
              return s.assignedTo && (s.status === 'assigned' || s.status === 'in_progress')
                ? s.assignedTo
                : null;
            })
            .filter((uid): uid is string => uid !== null && !memberCache.has(uid)),
        ),
      ];

      await Promise.all(
        newMemberUids.map(async (uid) => {
          const snap = await db.collection('members').doc(uid).get();
          if (snap.exists) {
            memberCache.set(uid, snap.data() as MemberRecord);
          }
        }),
      );

      await Promise.all(
        staleDocs.map(async (document) => {
          await document.ref.set(
            {
              staleFlagged: true,
              updatedAt: new Date(),
            },
            { merge: true },
          );

          allStaleCaseIds.push(document.id);

          const submission = document.data() as SubmissionRecord;
          await createAdminNotifications(
            `stale-case:${document.id}`,
            'Case flagged as stale',
            `${submission.fullName ?? 'A household'} has not been updated in over ${STALE_CASE_THRESHOLD_HOURS} hours.`,
            document.id,
          );

          // WhatsApp reminder to assigned NGO
          if (
            submission.assignedTo &&
            (submission.status === 'assigned' || submission.status === 'in_progress')
          ) {
            const member = memberCache.get(submission.assignedTo);
            if (member?.phoneNumber) {
              try {
                // Normalize to E.164 without '+' (Meta Cloud API format)
                const normalizedPhone = member.phoneNumber
                  .replace(/^whatsapp:/, '')
                  .replace(/^\+/, '');
                await sendWhatsAppText(
                  normalizedPhone,
                  `تذكير: الحالة (#${document.id}) لم تُحدَّث منذ ${STALE_CASE_THRESHOLD_HOURS} ساعة. يرجى تحديث الحالة في نسنا.`,
                );
                logger.info('Sent stale case WhatsApp to NGO', {
                  submissionId: document.id,
                });
              } catch (error) {
                logger.error('Failed to send stale case WhatsApp to NGO', {
                  submissionId: document.id,
                  error,
                });
              }
            }
          }
        }),
      );
    }

    // Send admin email alert if there are stale cases
    if (allStaleCaseIds.length > 0) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        try {
          await sendAdminStaleCasesAlert({
            adminEmail,
            staleCaseIds: allStaleCaseIds,
            staleCaseCount: allStaleCaseIds.length,
          });
        } catch (error) {
          logger.error('Failed to send admin stale cases alert email', { error });
        }
      }
    }

    logger.info('Completed stale case check', {
      staleCaseCount: allStaleCaseIds.length,
    });
  },
);

export const onHousingStatsChanged = onDocumentWritten(
  {
    document: 'housing/{housingId}',
    region: 'europe-west1',
  },
  async () => {
    await ensureGlobalStatsDocument();
    await refreshHousingAvailability();
    logger.info('Refreshed housing availability stats');
  },
);

export const onMemberStatsChanged = onDocumentWritten(
  {
    document: 'members/{memberUid}',
    region: 'europe-west1',
  },
  async () => {
    await ensureGlobalStatsDocument();
    await refreshActiveNgoCount();
    logger.info('Refreshed active NGO stats');
  },
);

export const nightlyGlobalStatsRebuild = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'Asia/Beirut',
    region: 'europe-west1',
  },
  async () => {
    await ensureGlobalStatsDocument();
    await rebuildGlobalStats();
    logger.info('Rebuilt global stats document from source collections');
  },
);
