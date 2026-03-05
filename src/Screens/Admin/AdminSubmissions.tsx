import { useCallback, useMemo, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  doc,
  type DocumentData,
  deleteDoc,
  type QueryDocumentSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { toast } from 'sonner';
import type { SubmissionDocument } from '../../types';
import { Button } from '@/Components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/Components/ui/dialog';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';

const PAGE_SIZE = 10;

interface SubmissionRow extends SubmissionDocument {
  id: string;
}

interface EditState {
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  gender?: string;
  currentGovernorate?: string;
  previousGovernorate?: string;
  street?: string;
  building?: string;
  floor?: string;
  ageRanges: Record<string, number>;
  specialNeeds: string[];
  needs: string[];
  aidUrgency?: string;
  comments?: string;
  registrationDate?: { toDate: () => Date };
}

function AdminSubmissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [editMember, setEditMember] = useState<EditState>({
    ageRanges: {},
    specialNeeds: [],
    needs: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const mapSubmission = useCallback(
    (documentSnapshot: QueryDocumentSnapshot<DocumentData>) => ({
      id: documentSnapshot.id,
      ...(documentSnapshot.data() as SubmissionDocument),
    }),
    [],
  );

  const {
    items: submissions,
    loading,
    error,
    page,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePaginatedQuery<SubmissionRow>({
    collectionRef: collection(db, 'submissions'),
    orderByField: 'registrationDate',
    pageSize: PAGE_SIZE,
    mapDoc: mapSubmission,
  });

  const filtered = useMemo(() => {
    let result = submissions;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((submission) =>
        [
          submission.fullName,
          submission.phoneNumber,
          submission.emailAddress,
          submission.currentGovernorate,
        ].some((field) => (field ?? '').toLowerCase().includes(q)),
      );
    }
    if (urgencyFilter && urgencyFilter !== 'all') {
      result = result.filter((submission) => submission.aidUrgency === urgencyFilter);
    }
    return result;
  }, [searchQuery, submissions, urgencyFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUrgencyFilter = (value: string) => {
    setUrgencyFilter(value);
  };

  const handleEditClick = (member: SubmissionRow) => {
    setEditMember({
      ...member,
      ageRanges:
        member.ageRanges && typeof member.ageRanges === 'object'
          ? (member.ageRanges as unknown as Record<string, number>)
          : {},
      specialNeeds: Array.isArray(member.specialNeeds) ? member.specialNeeds : [],
      needs: Array.isArray(member.needs) ? member.needs : [],
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteDoc(doc(db, 'submissions', memberToDelete));
      toast.success('Submission deleted successfully.');
      setConfirmDeleteOpen(false);
    } catch {
      toast.error('Failed to delete submission.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editMember.id) return;
    try {
      const updatePayload = {
        gender: editMember.gender ?? '',
        currentGovernorate: editMember.currentGovernorate ?? '',
        previousGovernorate: editMember.previousGovernorate ?? '',
        street: editMember.street ?? '',
        building: editMember.building ?? '',
        floor: editMember.floor ?? '',
        ageRanges: editMember.ageRanges,
        specialNeeds: editMember.specialNeeds,
        needs: editMember.needs,
        aidUrgency: editMember.aidUrgency ?? '',
        comments: editMember.comments ?? '',
        updatedAt: new Date(),
      };
      await updateDoc(doc(db, 'submissions', editMember.id), {
        ...updatePayload,
      });
      toast.success('Submission updated successfully.');
      setModalOpen(false);
    } catch {
      toast.error('Failed to update submission.');
    }
  };

  const editFields: Array<{
    key: keyof EditState;
    label: string;
    isArray?: boolean;
    disabled?: boolean;
  }> = [
    { key: 'fullName', label: 'Full Name', disabled: true },
    { key: 'phoneNumber', label: 'Phone Number', disabled: true },
    { key: 'emailAddress', label: 'Email Address', disabled: true },
    { key: 'gender', label: 'Gender' },
    { key: 'currentGovernorate', label: 'Current Governorate' },
    { key: 'previousGovernorate', label: 'Previous Governorate' },
    { key: 'street', label: 'Street' },
    { key: 'building', label: 'Building' },
    { key: 'floor', label: 'Floor' },
    { key: 'specialNeeds', label: 'Special Needs', isArray: true },
    { key: 'needs', label: 'Immediate Needs', isArray: true },
    { key: 'aidUrgency', label: 'Aid Urgency' },
    { key: 'comments', label: 'Comments' },
  ];
  const ageRangeKeys = Object.keys(editMember.ageRanges) as Array<
    keyof typeof editMember.ageRanges
  >;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">Submissions</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder="Search by Name, Phone, Email, or Governorate"
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={urgencyFilter} onValueChange={handleUrgencyFilter}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Full Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Phone Number</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Gender</TableHead>
                  <TableHead className="font-semibold text-gray-700">Current Gov.</TableHead>
                  <TableHead className="font-semibold text-gray-700">Previous Gov.</TableHead>
                  <TableHead className="font-semibold text-gray-700">Street</TableHead>
                  <TableHead className="font-semibold text-gray-700">Building</TableHead>
                  <TableHead className="font-semibold text-gray-700">Floor</TableHead>
                  <TableHead className="font-semibold text-gray-700">Age Ranges</TableHead>
                  <TableHead className="font-semibold text-gray-700">Special Needs</TableHead>
                  <TableHead className="font-semibold text-gray-700">Immediate Needs</TableHead>
                  <TableHead className="font-semibold text-gray-700">Aid Urgency</TableHead>
                  <TableHead className="font-semibold text-gray-700">Comments</TableHead>
                  <TableHead className="font-semibold text-gray-700">Reg. Date</TableHead>
                  <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow key={member.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell>{member.phoneNumber}</TableCell>
                    <TableCell>{member.emailAddress}</TableCell>
                    <TableCell>{member.gender}</TableCell>
                    <TableCell>{member.currentGovernorate}</TableCell>
                    <TableCell>{member.previousGovernorate}</TableCell>
                    <TableCell>{member.street}</TableCell>
                    <TableCell>{member.building}</TableCell>
                    <TableCell>{member.floor}</TableCell>
                    <TableCell className="text-xs">
                      {member.ageRanges && typeof member.ageRanges === 'object'
                        ? Object.entries(member.ageRanges)
                            .filter(([, v]) => Number(v) > 0)
                            .map(([range, count]) => `${range}: ${count}`)
                            .join(', ') || '—'
                        : '—'}
                    </TableCell>
                    <TableCell>{member.specialNeeds?.join(', ') || ''}</TableCell>
                    <TableCell>{member.needs?.join(', ') || ''}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.aidUrgency === 'High'
                            ? 'bg-red-100 text-red-700'
                            : member.aidUrgency === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {member.aidUrgency}
                      </span>
                    </TableCell>
                    <TableCell>{member.comments}</TableCell>
                    <TableCell>{member.registrationDate?.toDate().toLocaleDateString()}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                        onClick={() => handleEditClick(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(member.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filtered.length === 0
                ? `No results on page ${page}`
                : `${filtered.length} result(s) on page ${page}`}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editFields.map(({ key, label, isArray, disabled }) => (
              <div key={String(key)} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  value={
                    isArray
                      ? (editMember[key] as string[]).join(', ')
                      : key === 'registrationDate'
                        ? (editMember.registrationDate?.toDate().toLocaleDateString() ?? '')
                        : key === 'ageRanges'
                          ? Object.entries(editMember.ageRanges)
                              .map(([range, count]) => `${range}: ${count}`)
                              .join(', ')
                          : ((editMember[key] as string) ?? '')
                  }
                  disabled={disabled}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      [key]: isArray ? e.target.value.split(', ') : e.target.value,
                    })
                  }
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Age Ranges</Label>
              <div className="grid grid-cols-2 gap-3">
                {ageRangeKeys.map((range) => (
                  <div key={range} className="space-y-1">
                    <Label className="text-xs text-gray-600">{range}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editMember.ageRanges[range] ?? 0}
                      onChange={(e) =>
                        setEditMember((current) => ({
                          ...current,
                          ageRanges: {
                            ...current.ageRanges,
                            [range]: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button onClick={handleSaveEdit}>Save</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-[300px] text-center">
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>Are you sure you want to delete this submission?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={confirmDelete}>
              Confirm
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubmissions;
