import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/firebase';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
  updateDoc,
  where,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import CaseStatusBadge from '@/Components/CaseStatusBadge';
import CaseTimeline from '@/Components/CaseTimeline';
import AidDeliveryForm from '@/Components/AidDeliveryForm';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import type { MemberDocument, SubmissionDocument, SubmissionStatus } from '@/types';

const PAGE_SIZE = 10;

interface DispatchCaseRow extends SubmissionDocument {
  id: string;
}

interface NgoMemberRow extends MemberDocument {
  id: string;
}

export default function DispatchCenter() {
  const { t } = useTranslation();

  const STATUS_OPTIONS: Array<{ label: string; value: SubmissionStatus | 'all' }> = useMemo(
    () => [
      { label: t('admin.dispatch.allStatuses'), value: 'all' },
      { label: t('admin.dispatch.pending'), value: 'pending' },
      { label: t('admin.dispatch.assigned'), value: 'assigned' },
      { label: t('admin.dispatch.inProgress'), value: 'in_progress' },
      { label: t('admin.dispatch.completed'), value: 'completed' },
      { label: t('admin.dispatch.cancelled'), value: 'cancelled' },
    ],
    [t],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('pending');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<DispatchCaseRow | null>(null);
  const [ngoMembers, setNgoMembers] = useState<NgoMemberRow[]>([]);
  const [assigningNgoId, setAssigningNgoId] = useState('');
  const [saving, setSaving] = useState(false);

  const mapCase = useCallback(
    (snapshot: QueryDocumentSnapshot<DocumentData>) => ({
      id: snapshot.id,
      ...(snapshot.data() as SubmissionDocument),
    }),
    [],
  );

  const {
    items: cases,
    loading,
    error,
    page,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePaginatedQuery<DispatchCaseRow>({
    collectionRef: collection(db, 'submissions'),
    orderByField: 'registrationDate',
    pageSize: PAGE_SIZE,
    mapDoc: mapCase,
    resetKeys: [statusFilter],
    constraints: statusFilter === 'all' ? [] : [where('status', '==', statusFilter)],
  });

  useEffect(() => {
    const ngoQuery = query(
      collection(db, 'members'),
      where('role', '==', 'member'),
      where('validated', '==', true),
      orderBy('name'),
    );

    return onSnapshot(ngoQuery, (snapshot) => {
      setNgoMembers(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as MemberDocument),
        })),
      );
    });
  }, []);

  const filteredCases = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return cases.filter((submission) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          submission.fullName,
          submission.phoneNumber,
          submission.currentGovernorate,
          submission.assignedTo,
        ].some((field) => (field ?? '').toLowerCase().includes(normalizedQuery));
      const matchesUrgency = urgencyFilter === 'all' || submission.aidUrgency === urgencyFilter;

      return matchesSearch && matchesUrgency;
    });
  }, [cases, searchQuery, urgencyFilter]);

  const suggestedNgoMembers = useMemo(() => {
    if (!selectedCase) return [];

    return ngoMembers
      .filter((member) => {
        const coverageType = member.coverageType ?? 'governorate';
        const coverageGovernorates = member.coverageGovernorates ?? [];
        const coverageCenterIds = member.coverageCenterIds ?? [];
        const governorateMatch =
          coverageGovernorates.length === 0 ||
          coverageGovernorates.includes(selectedCase.currentGovernorate);
        const centerMatch =
          coverageCenterIds.length > 0 &&
          selectedCase.locationType === 'center' &&
          coverageCenterIds.includes(selectedCase.centerId ?? '');
        const belowCapacity =
          Number(member.currentCaseLoad ?? 0) < Number(member.maxCaseLoad ?? 10);

        if (coverageType === 'center') {
          return centerMatch && belowCapacity;
        }

        if (coverageType === 'hybrid') {
          return (governorateMatch || centerMatch) && belowCapacity;
        }

        return governorateMatch && belowCapacity;
      })
      .sort(
        (left, right) => Number(left.currentCaseLoad ?? 0) - Number(right.currentCaseLoad ?? 0),
      );
  }, [ngoMembers, selectedCase]);

  const selectedNgo = ngoMembers.find((member) => member.id === assigningNgoId);

  const updateCase = async (
    submissionId: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        ...payload,
        lastUpdatedBy: auth.currentUser?.uid ?? '',
        updatedAt: new Date(),
      });
      toast.success(successMessage);
    } catch (updateError) {
      console.error('Failed to update case status:', updateError);
      toast.error(t('admin.dispatch.errorUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignCase = async () => {
    if (!selectedCase || !assigningNgoId) return;

    await updateCase(
      selectedCase.id,
      {
        assignedTo: assigningNgoId,
        assignedAt: new Date(),
        status: 'assigned',
      },
      t('admin.dispatch.assignedSuccess', { name: selectedNgo?.name ?? 'NGO' }),
    );
  };

  const handleStatusChange = async (submissionId: string, status: SubmissionStatus) => {
    await updateCase(
      submissionId,
      {
        status,
        aidDelivered: status === 'completed',
      },
      t('admin.dispatch.statusUpdated', { status: status.replace('_', ' ') }),
    );
  };

  const handleSaveAidDelivery = async (notes: string) => {
    if (!selectedCase) return;

    await updateCase(
      selectedCase.id,
      {
        comments: notes
          ? `${selectedCase.comments ?? ''}\n\nDelivery note: ${notes}`.trim()
          : (selectedCase.comments ?? ''),
      },
      t('admin.dispatch.deliveryNoteSaved'),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.dispatch.title')}</h1>
          <p className="text-sm text-gray-500">{t('admin.dispatch.description')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t('admin.dispatch.casesOnPage')}</CardDescription>
            <CardTitle>{filteredCases.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('admin.dispatch.staleFlagged')}</CardDescription>
            <CardTitle>{filteredCases.filter((item) => item.staleFlagged).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('admin.dispatch.unassigned')}</CardDescription>
            <CardTitle>{filteredCases.filter((item) => !item.assignedTo).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={t('admin.dispatch.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-[240px] flex-1 bg-gray-50"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}
          >
            <SelectTrigger className="w-[180px] bg-gray-50">
              <SelectValue placeholder={t('admin.dispatch.status')} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-[160px] bg-gray-50">
              <SelectValue placeholder={t('admin.dispatch.urgency')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.dispatch.allUrgency')}</SelectItem>
              <SelectItem value="High">{t('admin.dispatch.high')}</SelectItem>
              <SelectItem value="Medium">{t('admin.dispatch.medium')}</SelectItem>
              <SelectItem value="Low">{t('admin.dispatch.low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead>{t('admin.dispatch.household')}</TableHead>
              <TableHead>{t('admin.dispatch.location')}</TableHead>
              <TableHead>{t('admin.dispatch.urgency')}</TableHead>
              <TableHead>{t('admin.dispatch.status')}</TableHead>
              <TableHead>{t('admin.dispatch.assignedNgo')}</TableHead>
              <TableHead>{t('admin.dispatch.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  {t('admin.dispatch.loadingQueue')}
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  {t('admin.dispatch.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{submission.fullName}</p>
                      <p className="text-sm text-gray-500">{submission.phoneNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-900">
                      {submission.locationType === 'center' && submission.centerId
                        ? `${submission.currentGovernorate} · ${t('admin.dispatch.centerCase')}`
                        : submission.currentGovernorate}
                    </p>
                    <p className="text-sm text-gray-500">
                      {submission.city || submission.street || t('admin.dispatch.addressPending')}
                    </p>
                  </TableCell>
                  <TableCell>{submission.aidUrgency}</TableCell>
                  <TableCell>
                    <CaseStatusBadge
                      status={submission.status}
                      staleFlagged={submission.staleFlagged}
                    />
                  </TableCell>
                  <TableCell>
                    {ngoMembers.find((member) => member.id === submission.assignedTo)?.name ??
                      t('admin.dispatch.unassignedNgo')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(submission);
                          setAssigningNgoId(submission.assignedTo ?? '');
                        }}
                      >
                        {t('admin.dispatch.open')}
                      </Button>
                      {submission.status === 'pending' ? (
                        <Button
                          size="sm"
                          className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                          onClick={() => {
                            setSelectedCase(submission);
                            setAssigningNgoId(submission.assignedTo ?? '');
                          }}
                        >
                          {t('admin.dispatch.assign')}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-500">
          <span>
            {filteredCases.length === 0
              ? t('admin.dispatch.noResultsPage', { page })
              : t('admin.dispatch.resultsPage', { count: filteredCases.length, page })}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage}>
              {t('admin.dispatch.previous')}
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
              {t('admin.dispatch.next')}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={selectedCase !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCase(null);
            setAssigningNgoId('');
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          {selectedCase ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCase.fullName}</DialogTitle>
                <DialogDescription>{t('admin.dispatch.dialogDescription')}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('admin.dispatch.caseOverview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          {t('admin.dispatch.phone')}
                        </Label>
                        <p className="text-sm text-gray-900">{selectedCase.phoneNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          {t('admin.dispatch.urgency')}
                        </Label>
                        <p className="text-sm text-gray-900">{selectedCase.aidUrgency}</p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          {t('admin.dispatch.location')}
                        </Label>
                        <p className="text-sm text-gray-900">
                          {selectedCase.currentGovernorate},{' '}
                          {selectedCase.city || selectedCase.street}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          {t('admin.dispatch.needs')}
                        </Label>
                        <p className="text-sm text-gray-900">
                          {selectedCase.needs?.join(', ') || t('admin.dispatch.noneListed')}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          {t('admin.dispatch.comments')}
                        </Label>
                        <p className="whitespace-pre-wrap text-sm text-gray-900">
                          {selectedCase.comments || t('admin.dispatch.noComments')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <AidDeliveryForm disabled={saving} onSubmit={handleSaveAidDelivery} />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('admin.dispatch.dispatchActions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('admin.dispatch.assignToNgo')}</Label>
                        <Select value={assigningNgoId} onValueChange={setAssigningNgoId}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.dispatch.selectNgo')} />
                          </SelectTrigger>
                          <SelectContent>
                            {suggestedNgoMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name} • {member.currentCaseLoad ?? 0}/
                                {member.maxCaseLoad ?? 10}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                          onClick={handleAssignCase}
                          disabled={!assigningNgoId || saving}
                        >
                          {saving ? t('admin.dispatch.saving') : t('admin.dispatch.assignCase')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleStatusChange(selectedCase.id, 'in_progress')}
                          disabled={saving}
                        >
                          {t('admin.dispatch.markInProgress')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleStatusChange(selectedCase.id, 'completed')}
                          disabled={saving}
                        >
                          {t('admin.dispatch.markCompleted')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleStatusChange(selectedCase.id, 'cancelled')}
                          disabled={saving}
                        >
                          {t('admin.dispatch.cancel')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('admin.dispatch.caseTimeline')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CaseTimeline
                        registrationDate={selectedCase.registrationDate ?? null}
                        assignedAt={selectedCase.assignedAt ?? null}
                        updatedAt={selectedCase.updatedAt ?? null}
                        status={selectedCase.status}
                        aidDelivered={selectedCase.aidDelivered}
                        staleFlagged={selectedCase.staleFlagged}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('admin.dispatch.suggestedNgos')}</CardTitle>
                      <CardDescription>{t('admin.dispatch.suggestedDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {suggestedNgoMembers.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          {t('admin.dispatch.noCoverageMatches')}
                        </p>
                      ) : (
                        suggestedNgoMembers.slice(0, 5).map((member) => (
                          <div key={member.id} className="rounded-lg border border-gray-200 p-3">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              {`${t('admin.dispatch.load')} `}
                              {member.currentCaseLoad ?? 0}/{member.maxCaseLoad ?? 10}
                            </p>
                            <p className="text-sm text-gray-500">
                              {`${t('admin.dispatch.coverageLabel')} `}
                              {(member.coverageGovernorates ?? []).join(', ') ||
                                t('admin.dispatch.openCoverage')}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
