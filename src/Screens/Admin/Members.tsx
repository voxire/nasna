import { useCallback, useMemo, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  doc,
  type DocumentData,
  deleteDoc,
  type QueryDocumentSnapshot,
  updateDoc,
  where,
} from 'firebase/firestore';
import { toast } from 'sonner';
import type { MemberDocument } from '../../types';
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
} from '@/Components/ui/dialog';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';

const PAGE_SIZE = 10;

interface MemberRow extends MemberDocument {
  id: string;
}

function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [validatedFilter, setValidatedFilter] = useState('');
  const [editMember, setEditMember] = useState<MemberRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const memberConstraints = useMemo(() => [where('role', '==', 'member')], []);
  const mapMember = useCallback(
    (documentSnapshot: QueryDocumentSnapshot<DocumentData>) => ({
      id: documentSnapshot.id,
      ...(documentSnapshot.data() as MemberDocument),
    }),
    [],
  );
  const {
    items: members,
    loading,
    error,
    page,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePaginatedQuery<MemberRow>({
    collectionRef: collection(db, 'members'),
    constraints: memberConstraints,
    orderByField: 'createdAt',
    pageSize: PAGE_SIZE,
    mapDoc: mapMember,
  });

  const filteredMembers = useMemo(() => {
    let result = members;
    if (searchQuery) {
      const queryValue = searchQuery.toLowerCase();
      result = result.filter((member) =>
        [member.name, member.contactPersonName, member.email].some((field) =>
          (field ?? '').toLowerCase().includes(queryValue),
        ),
      );
    }
    if (validatedFilter && validatedFilter !== 'all') {
      result = result.filter((member) => String(member.validated) === validatedFilter);
    }
    return result;
  }, [members, searchQuery, validatedFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setValidatedFilter(value);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      toast.success('Member deleted successfully.');
    } catch (error) {
      console.error('Error deleting member: ', error);
      toast.error('Error deleting member. Please try again.');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { validated: true, updatedAt: new Date() });
      toast.success('Member validated successfully.');
    } catch (error) {
      console.error('Error validating member: ', error);
      toast.error('Error validating member. Please try again.');
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditMember((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    try {
      await updateDoc(doc(db, 'members', editMember.id), {
        name: editMember.name,
        contactPersonName: editMember.contactPersonName ?? '',
        email: editMember.email,
        phoneNumber: editMember.phoneNumber,
        updatedAt: new Date(),
      });
      toast.success('Member updated successfully.');
      setModalOpen(false);
      setEditMember(null);
    } catch (error) {
      console.error('Error updating member: ', error);
      toast.error('Error updating member. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">NGO Members</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder="Search by Name, Contact Person, or Email"
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={validatedFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder="Validated" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Validated</SelectItem>
            <SelectItem value="false">Not Validated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Contact Person</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Phone Number</TableHead>
                <TableHead className="font-semibold text-gray-700">Validated</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.contactPersonName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phoneNumber}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                      {member.validated ? 'Validated' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {!member.validated && (
                      <Button
                        size="sm"
                        className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                        onClick={() => handleValidate(member.id)}
                      >
                        Validate
                      </Button>
                    )}
                    {member.validated && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
                          onClick={() => {
                            setEditMember(member);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(member.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filteredMembers.length === 0
                ? `No results on page ${page}`
                : `${filteredMembers.length} result(s) on page ${page}`}
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

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditMember(null);
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            {[
              { name: 'name', label: 'Name' },
              { name: 'contactPersonName', label: 'Contact Person' },
              { name: 'email', label: 'Email' },
              { name: 'phoneNumber', label: 'Phone Number' },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  name={name}
                  value={(editMember?.[name as keyof MemberRow] as string) ?? ''}
                  onChange={handleEditChange}
                  required
                />
              </div>
            ))}
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Members;
