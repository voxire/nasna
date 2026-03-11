import { getApps, initializeApp } from 'firebase-admin/app';
import {
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
import { sendWhatsApp } from './utils/twilio';

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
  availableSpots?: number;
  status?: 'pending_review' | 'approved' | 'rejected' | 'reserved' | 'filled';
}

async function ensureGlobalStatsDocument() {
  await GLOBAL_STATS_DOC.set(
    {
      submissionsRegistered: 0,
      submissionsAssigned: 0,
      submissionsCompleted: 0,
      peopleHelped: 0,
      activeNgoCount: 0,
      housingAvailable: 0,
      updatedAt: new Date(),
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

  const activeNgoCount = memberSnapshot.docs.filter(
    (document) => Number(document.data().currentCaseLoad ?? 0) > 0,
  ).length;

  await GLOBAL_STATS_DOC.set(
    {
      activeNgoCount,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

async function refreshHousingAvailability() {
  const housingSnapshot = await db.collection('housing').where('status', '==', 'approved').get();
  const housingAvailable = housingSnapshot.docs.reduce(
    (total, document) => total + Number((document.data() as HousingRecord).availableSpots ?? 0),
    0,
  );

  await GLOBAL_STATS_DOC.set(
    {
      housingAvailable,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

async function rebuildGlobalStats() {
  const [submissionSnapshot, housingSnapshot, memberSnapshot] = await Promise.all([
    db.collection('submissions').get(),
    db.collection('housing').where('status', '==', 'approved').get(),
    db.collection('members').where('role', '==', 'member').where('validated', '==', true).get(),
  ]);

  const submissionsRegistered = submissionSnapshot.size;
  const submissionsAssigned = submissionSnapshot.docs.filter((document) =>
    Boolean((document.data() as SubmissionRecord).assignedTo),
  ).length;
  const completedSubmissions = submissionSnapshot.docs.filter(
    (document) => (document.data() as SubmissionRecord).status === 'completed',
  );
  const submissionsCompleted = completedSubmissions.length;
  const peopleHelped = completedSubmissions.reduce(
    (total, document) =>
      total + Number((document.data() as SubmissionRecord).numberOfPeopleInHousehold ?? 0),
    0,
  );
  const activeNgoCount = memberSnapshot.docs.filter(
    (document) => Number((document.data() as MemberRecord).currentCaseLoad ?? 0) > 0,
  ).length;
  const housingAvailable = housingSnapshot.docs.reduce(
    (total, document) => total + Number((document.data() as HousingRecord).availableSpots ?? 0),
    0,
  );

  await GLOBAL_STATS_DOC.set(
    {
      submissionsRegistered,
      submissionsAssigned,
      submissionsCompleted,
      peopleHelped,
      activeNgoCount,
      housingAvailable,
      updatedAt: new Date(),
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
    await GLOBAL_STATS_DOC.set(
      {
        submissionsRegistered: FieldValue.increment(1),
        updatedAt: new Date(),
      },
      { merge: true },
    );

    await createAdminNotifications(
      `submission-created:${submissionId}`,
      'New case submitted',
      `${submission.fullName ?? 'A household'} in ${submission.currentGovernorate ?? 'an unknown area'} needs review.`,
      submissionId,
    );

    // Match NGOs by governorate coverage and (optionally) center coverage
    const governorate = submission.currentGovernorate ?? 'Unknown';
    const centerId = submission.centerId;
    const submissionNeeds = submission.needs ?? [];

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
    await GLOBAL_STATS_DOC.set(
      {
        submissionsAssigned: FieldValue.increment(previousAssignedTo ? 0 : 1),
        updatedAt: new Date(),
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
        const ngoName = memberData?.name ?? 'فريق المساعدة';
        await sendWhatsApp(
          after.whatsappPhone,
          `تم تعيين حالتك (#${submissionId}) 🤝\n${ngoName} سيتواصل معك قريباً.`,
        );
        logger.info('Sent WhatsApp assignment notification', { submissionId, status: 'assigned' });
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

    if (nextStatus === 'completed') {
      await GLOBAL_STATS_DOC.set(
        {
          submissionsCompleted: FieldValue.increment(1),
          peopleHelped: FieldValue.increment(Number(after.numberOfPeopleInHousehold ?? 0)),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } else {
      await GLOBAL_STATS_DOC.set(
        {
          updatedAt: new Date(),
        },
        { merge: true },
      );
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
        await sendWhatsApp(
          after.whatsappPhone,
          `تم إغلاق حالتك (#${submissionId}) ✅\nنشكرك على ثقتك بنسنا.`,
        );
        logger.info('Sent WhatsApp completion notification', { submissionId, status: 'completed' });
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
                await sendWhatsApp(
                  member.phoneNumber,
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
