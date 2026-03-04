import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
  ageRanges: string[];
  specialNeeds: string[];
  needs: string[];
  aidUrgency?: string;
  comments?: string;
  registrationDate?: { toDate: () => Date };
}

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [filtered, setFiltered] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [editMember, setEditMember] = useState<EditState>({ ageRanges: [], specialNeeds: [], needs: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'submissions'));
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SubmissionDocument) }));
        setSubmissions(data);
        setFiltered(data);
      } catch {
        toast.error('Failed to load submissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const applyFilters = (query: string, urgency: string, data: SubmissionRow[]) => {
    let result = data;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((s) =>
        [s.fullName, s.phoneNumber, s.emailAddress, s.currentGovernorate].some(
          (f) => (f ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (urgency && urgency !== 'all') {
      result = result.filter((s) => s.aidUrgency === urgency);
    }
    setFiltered(result);
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(q, urgencyFilter, submissions);
  };

  const handleUrgencyFilter = (value: string) => {
    setUrgencyFilter(value);
    applyFilters(searchQuery, value, submissions);
  };

  const handleEditClick = (member: SubmissionRow) => {
    setEditMember({
      ...member,
      ageRanges: Array.isArray(member.ageRanges) ? (member.ageRanges as unknown as string[]) : [],
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
      const updated = submissions.filter((s) => s.id !== memberToDelete);
      setSubmissions(updated);
      applyFilters(searchQuery, urgencyFilter, updated);
      setConfirmDeleteOpen(false);
    } catch {
      toast.error('Failed to delete submission.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editMember.id) return;
    try {
      await updateDoc(doc(db, 'submissions', editMember.id), {
        ...editMember,
        ageRanges: editMember.ageRanges,
        specialNeeds: editMember.specialNeeds,
        needs: editMember.needs,
      });
      toast.success('Submission updated successfully.');
      setModalOpen(false);
    } catch {
      toast.error('Failed to update submission.');
    }
  };

  const editFields: Array<{ key: keyof EditState; label: string; isArray?: boolean; disabled?: boolean }> = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'emailAddress', label: 'Email Address' },
    { key: 'gender', label: 'Gender' },
    { key: 'currentGovernorate', label: 'Current Governorate' },
    { key: 'previousGovernorate', label: 'Previous Governorate' },
    { key: 'street', label: 'Street' },
    { key: 'building', label: 'Building' },
    { key: 'floor', label: 'Floor' },
    { key: 'ageRanges', label: 'Age Ranges', isArray: true },
    { key: 'specialNeeds', label: 'Special Needs', isArray: true },
    { key: 'needs', label: 'Immediate Needs', isArray: true },
    { key: 'aidUrgency', label: 'Aid Urgency' },
    { key: 'comments', label: 'Comments' },
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200"><SelectValue placeholder="Urgency" /></SelectTrigger>
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
                {paged.map((member) => (
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
                    <TableCell>{JSON.stringify(member.ageRanges || [])}</TableCell>
                    <TableCell>{member.specialNeeds?.join(', ') || ''}</TableCell>
                    <TableCell>{member.needs?.join(', ') || ''}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.aidUrgency === 'High' ? 'bg-red-100 text-red-700' :
                        member.aidUrgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{member.aidUrgency}</span>
                    </TableCell>
                    <TableCell>{member.comments}</TableCell>
                    <TableCell>{member.registrationDate?.toDate().toLocaleDateString()}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" className="bg-[#12a89d] hover:bg-[#0e9088] text-white" onClick={() => handleEditClick(member)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(member.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filtered.length === 0
                ? '0 results'
                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</Button>
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
                      ? editMember.registrationDate?.toDate().toLocaleDateString() ?? ''
                      : (editMember[key] as string) ?? ''
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
          </div>
          <DialogFooter className="flex justify-between">
            <Button onClick={handleSaveEdit}>Save</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
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
            <Button variant="destructive" onClick={confirmDelete}>Confirm</Button>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubmissions;
