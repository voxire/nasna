import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from './utils/meta';

export type AuditAction =
  | 'case_assigned'
  | 'case_reassigned'
  | 'case_status_changed'
  | 'member_created'
  | 'member_validated'
  | 'member_deleted';

export interface AuditEntry {
  timestamp: Timestamp;
  action: AuditAction;
  actorUid: string;
  actorName: string;
  targetId: string;
  targetType: 'submission' | 'member';
  meta: Record<string, string | boolean | number | null>;
}

export async function writeAuditEntry(entry: AuditEntry) {
  await db.collection('auditLog').add(entry);
}

// ── Submission audit trigger ─────────────────────────────────────────────────
// Catches all assignment and status changes on submissions, regardless of
// which function or client caused the write.

export const onSubmissionAudit = onDocumentUpdated(
  { document: 'submissions/{submissionId}', region: 'europe-west1' },
  async (event) => {
    if (!event.data) return;

    const before = event.data.before.data();
    const after = event.data.after.data();
    const submissionId = event.params.submissionId;

    const prevAssigned = before.assignedTo ?? '';
    const nextAssigned = after.assignedTo ?? '';
    const prevStatus = before.status ?? 'pending';
    const nextStatus = after.status ?? 'pending';

    const assignedChanged = prevAssigned !== nextAssigned && nextAssigned;
    const statusChanged = prevStatus !== nextStatus;

    if (!assignedChanged && !statusChanged) return;

    const entries: AuditEntry[] = [];

    if (assignedChanged) {
      const action: AuditAction = prevAssigned ? 'case_reassigned' : 'case_assigned';
      entries.push({
        timestamp: Timestamp.now(),
        action,
        actorUid: nextAssigned,
        actorName: (after.assignedToOrgName as string) ?? 'Unknown',
        targetId: submissionId,
        targetType: 'submission',
        meta: {
          fromAssignee: prevAssigned || null,
          toAssignee: nextAssigned,
          toAssigneeName: (after.assignedToOrgName as string) ?? null,
          caseFullName: (after.fullName as string) ?? null,
        },
      });
    }

    if (statusChanged) {
      entries.push({
        timestamp: Timestamp.now(),
        action: 'case_status_changed',
        actorUid: (after.assignedTo as string) ?? 'system',
        actorName: (after.assignedToOrgName as string) ?? 'System',
        targetId: submissionId,
        targetType: 'submission',
        meta: {
          fromStatus: prevStatus,
          toStatus: nextStatus,
          caseFullName: (after.fullName as string) ?? null,
        },
      });
    }

    await Promise.all(entries.map(writeAuditEntry));
  },
);
