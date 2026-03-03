import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import type { SubmissionDocument } from '../../types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
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
  const [members, setMembers] = useState<SubmissionRow[]>([]);
  const [editMember, setEditMember] = useState<EditState>({ ageRanges: [], specialNeeds: [], needs: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const snap = await getDocs(collection(db, 'submissions'));
      setMembers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as SubmissionDocument) })));
    };
    fetchMembers();
  }, []);

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
      toast.success('Member deleted successfully.');
      setMembers(members.filter((m) => m.id !== memberToDelete));
      setConfirmDeleteOpen(false);
    } catch {
      toast.error('Failed to delete member.');
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
      toast.success('Member updated successfully.');
      setModalOpen(false);
    } catch {
      toast.error('Failed to update member details.');
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">Submissions</h1>
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
              {members.map((member) => (
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
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
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>Are you sure you want to delete this member?</DialogDescription>
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
