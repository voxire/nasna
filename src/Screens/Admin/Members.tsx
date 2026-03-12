import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import {
  collection,
  type DocumentData,
  type QueryDocumentSnapshot,
  where,
} from 'firebase/firestore';
import { toast } from 'sonner';
import type { MemberDocument } from '../../types';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Components/ui/dialog';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import {
  createManagedUser as createManagedUserAccount,
  deleteManagedUser as deleteManagedUserAccount,
  updateManagedUser as updateManagedUserAccount,
  validateManagedUser as validateManagedUserAccount,
} from '@/services/adminUsers';
import ConfirmDialog from '@/Components/ConfirmDialog';

const PAGE_SIZE = 10;

interface MemberRow extends MemberDocument {
  id: string;
}

function Members() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [validatedFilter, setValidatedFilter] = useState('');
  const [editMember, setEditMember] = useState<MemberRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    contactPersonName: '',
    email: '',
    phoneNumber: '',
    password: '',
    validateImmediately: true,
  });
  const membersCollectionRef = useMemo(() => collection(db, 'members'), []);
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
    collectionRef: membersCollectionRef,
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

  const handleDelete = async () => {
    if (!deletingMemberId) return;
    try {
      await deleteManagedUserAccount(deletingMemberId);
      toast.success(t('admin.members.deleteSuccess'));
      setDeletingMemberId(null);
    } catch (error) {
      console.error('Error deleting member: ', error);
      toast.error(error instanceof Error ? error.message : t('admin.members.deleteError'));
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await validateManagedUserAccount(id);
      toast.success(t('admin.members.validateSuccess'));
    } catch (error) {
      console.error('Error validating member: ', error);
      toast.error(error instanceof Error ? error.message : t('admin.members.validateError'));
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
      await updateManagedUserAccount({
        uid: editMember.id,
        role: 'member',
        name: editMember.name,
        contactPersonName: editMember.contactPersonName ?? '',
        email: editMember.email,
        phoneNumber: editMember.phoneNumber,
      });
      toast.success(t('admin.members.updateSuccess'));
      setModalOpen(false);
      setEditMember(null);
    } catch (error) {
      console.error('Error updating member: ', error);
      toast.error(error instanceof Error ? error.message : t('admin.members.updateError'));
    }
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember((previous) => ({ ...previous, [name]: value }));
  };

  const resetCreateForm = () => {
    setNewMember({
      name: '',
      contactPersonName: '',
      email: '',
      phoneNumber: '',
      password: '',
      validateImmediately: true,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createManagedUserAccount({
        role: 'member',
        name: newMember.name,
        contactPersonName: newMember.contactPersonName,
        email: newMember.email,
        phoneNumber: newMember.phoneNumber,
        password: newMember.password,
        validateImmediately: newMember.validateImmediately,
      });
      toast.success('NGO account created.');
      setCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error('Error creating NGO: ', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create NGO account.');
    } finally {
      setCreating(false);
    }
  };

  const editFormFields = useMemo(
    () => [
      { name: 'name', label: t('admin.members.name') },
      { name: 'contactPersonName', label: t('admin.members.contactPerson') },
      { name: 'email', label: t('admin.members.email') },
      { name: 'phoneNumber', label: t('admin.members.phoneNumber') },
    ],
    [t],
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.members.title')}</h1>
        <Button
          className="bg-[#12a89d] hover:bg-[#0e9088]"
          onClick={() => setCreateModalOpen(true)}
        >
          Create NGO
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder={t('admin.members.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={validatedFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.members.validatedFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.members.all')}</SelectItem>
            <SelectItem value="true">{t('admin.members.validated')}</SelectItem>
            <SelectItem value="false">{t('admin.members.notValidated')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('admin.members.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.members.name')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.members.contactPerson')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.members.email')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.members.phoneNumber')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.members.validatedLabel')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.members.actions')}
                </TableHead>
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
                      {member.validated
                        ? t('admin.members.validatedBadge')
                        : t('admin.members.pendingBadge')}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {!member.validated && (
                      <Button
                        size="sm"
                        className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                        onClick={() => handleValidate(member.id)}
                      >
                        {t('admin.members.validate')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => {
                        setEditMember(member);
                        setModalOpen(true);
                      }}
                    >
                      {t('admin.members.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingMemberId(member.id)}
                    >
                      {t('admin.members.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filteredMembers.length === 0
                ? t('admin.members.noResultsPage', { page })
                : t('admin.members.resultsPage', { count: filteredMembers.length, page })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                {t('admin.members.previous')}
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
                {t('admin.members.next')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create NGO</DialogTitle>
            <DialogDescription>
              This creates both the Firebase Auth account and the NGO profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>NGO name</Label>
              <Input name="name" value={newMember.name} onChange={handleCreateChange} required />
            </div>
            <div className="space-y-1">
              <Label>Contact person</Label>
              <Input
                name="contactPersonName"
                value={newMember.contactPersonName}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={newMember.email}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Phone number</Label>
              <Input
                name="phoneNumber"
                value={newMember.phoneNumber}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Temporary password</Label>
              <Input
                type="password"
                name="password"
                value={newMember.password}
                onChange={handleCreateChange}
                minLength={6}
                required
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm">
              <Checkbox
                checked={newMember.validateImmediately}
                onCheckedChange={(checked) =>
                  setNewMember((previous) => ({
                    ...previous,
                    validateImmediately: checked === true,
                  }))
                }
              />
              Validate this NGO immediately
            </label>
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create NGO'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingMemberId(null);
        }}
        title={t('admin.members.delete')}
        description={t('admin.members.deleteConfirm')}
        confirmLabel={t('admin.members.delete')}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
      />

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditMember(null);
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('admin.members.editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            {editFormFields.map(({ name, label }) => (
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
              <Button type="submit">{t('admin.members.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Members;
