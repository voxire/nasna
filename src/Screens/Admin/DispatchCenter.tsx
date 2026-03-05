import { useCallback, useEffect, useMemo, useState } from 'react';
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

const STATUS_OPTIONS: Array<{ label: string; value: SubmissionStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function DispatchCenter() {
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
      console.error(updateError);
      toast.error('Failed to update the case.');
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
      `Assigned to ${selectedNgo?.name ?? 'the selected NGO'}.`,
    );
  };

  const handleStatusChange = async (submissionId: string, status: SubmissionStatus) => {
    await updateCase(
      submissionId,
      {
        status,
        aidDelivered: status === 'completed',
      },
      `Case marked ${status.replace('_', ' ')}.`,
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
      'Delivery note saved.',
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dispatch Center</h1>
          <p className="text-sm text-gray-500">
            Review incoming cases, assign them to NGOs, and track stale or completed work.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Cases on this page</CardDescription>
            <CardTitle>{filteredCases.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Stale flagged</CardDescription>
            <CardTitle>{filteredCases.filter((item) => item.staleFlagged).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Unassigned</CardDescription>
            <CardTitle>{filteredCases.filter((item) => !item.assignedTo).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search by household, phone, governorate, or assigned NGO"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-[240px] flex-1 bg-gray-50"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}
          >
            <SelectTrigger className="w-[180px] bg-gray-50">
              <SelectValue placeholder="Status" />
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
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgency</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead>Household</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned NGO</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  Loading dispatch queue...
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
                  No cases matched the current filters.
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
                        ? `${submission.currentGovernorate} · Center case`
                        : submission.currentGovernorate}
                    </p>
                    <p className="text-sm text-gray-500">
                      {submission.city || submission.street || 'Address pending'}
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
                      'Unassigned'}
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
                        Open
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
                          Assign
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
              ? `No results on page ${page}`
              : `${filteredCases.length} result(s) on page ${page}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
              Next
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
                <DialogDescription>
                  Review case context, suggested NGO matches, and dispatch updates.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Case Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          Phone
                        </Label>
                        <p className="text-sm text-gray-900">{selectedCase.phoneNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          Urgency
                        </Label>
                        <p className="text-sm text-gray-900">{selectedCase.aidUrgency}</p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          Location
                        </Label>
                        <p className="text-sm text-gray-900">
                          {selectedCase.currentGovernorate},{' '}
                          {selectedCase.city || selectedCase.street}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          Needs
                        </Label>
                        <p className="text-sm text-gray-900">
                          {selectedCase.needs?.join(', ') || 'None listed'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          Comments
                        </Label>
                        <p className="whitespace-pre-wrap text-sm text-gray-900">
                          {selectedCase.comments || 'No comments provided.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <AidDeliveryForm disabled={saving} onSubmit={handleSaveAidDelivery} />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dispatch Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Assign to NGO</Label>
                        <Select value={assigningNgoId} onValueChange={setAssigningNgoId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a validated NGO" />
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
                          {saving ? 'Saving...' : 'Assign case'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleStatusChange(selectedCase.id, 'in_progress')}
                          disabled={saving}
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleStatusChange(selectedCase.id, 'completed')}
                          disabled={saving}
                        >
                          Mark Completed
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleStatusChange(selectedCase.id, 'cancelled')}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Case Timeline</CardTitle>
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
                      <CardTitle className="text-lg">Suggested NGOs</CardTitle>
                      <CardDescription>
                        Suggested by coverage and current case load.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {suggestedNgoMembers.length === 0 ? (
                        <p className="text-sm text-gray-500">No coverage matches yet.</p>
                      ) : (
                        suggestedNgoMembers.slice(0, 5).map((member) => (
                          <div key={member.id} className="rounded-lg border border-gray-200 p-3">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              Load: {member.currentCaseLoad ?? 0}/{member.maxCaseLoad ?? 10}
                            </p>
                            <p className="text-sm text-gray-500">
                              Coverage: {(member.coverageGovernorates ?? []).join(', ') || 'Open'}
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
