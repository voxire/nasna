import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  const submissionsCollectionRef = useMemo(() => collection(db, 'submissions'), []);

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
    collectionRef: submissionsCollectionRef,
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
      toast.success(t('admin.submissions.deleteSuccess'));
      setConfirmDeleteOpen(false);
    } catch {
      toast.error(t('admin.submissions.deleteError'));
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
      toast.success(t('admin.submissions.updateSuccess'));
      setModalOpen(false);
    } catch {
      toast.error(t('admin.submissions.updateError'));
    }
  };

  const editFields: Array<{
    key: keyof EditState;
    label: string;
    isArray?: boolean;
    disabled?: boolean;
  }> = useMemo(
    () => [
      { key: 'fullName', label: t('admin.submissions.fullName'), disabled: true },
      { key: 'phoneNumber', label: t('admin.submissions.phoneNumber'), disabled: true },
      { key: 'emailAddress', label: t('admin.submissions.emailAddress'), disabled: true },
      { key: 'gender', label: t('admin.submissions.gender') },
      { key: 'currentGovernorate', label: t('admin.submissions.currentGovernorate') },
      { key: 'previousGovernorate', label: t('admin.submissions.previousGovernorate') },
      { key: 'street', label: t('admin.submissions.street') },
      { key: 'building', label: t('admin.submissions.building') },
      { key: 'floor', label: t('admin.submissions.floor') },
      { key: 'specialNeeds', label: t('admin.submissions.specialNeeds'), isArray: true },
      { key: 'needs', label: t('admin.submissions.immediateNeeds'), isArray: true },
      { key: 'aidUrgency', label: t('admin.submissions.aidUrgency') },
      { key: 'comments', label: t('admin.submissions.comments') },
    ],
    [t],
  );

  const ageRangeKeys = Object.keys(editMember.ageRanges) as Array<
    keyof typeof editMember.ageRanges
  >;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('admin.submissions.title')}</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder={t('admin.submissions.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={urgencyFilter} onValueChange={handleUrgencyFilter}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.submissions.aidUrgency')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.submissions.all')}</SelectItem>
            <SelectItem value="High">{t('admin.submissions.high')}</SelectItem>
            <SelectItem value="Medium">{t('admin.submissions.medium')}</SelectItem>
            <SelectItem value="Low">{t('admin.submissions.low')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('admin.submissions.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.fullName')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.phoneNumber')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.email')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.gender')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.currentGov')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.previousGov')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.street')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.building')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.floor')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.ageRanges')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.specialNeeds')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.immediateNeeds')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.aidUrgency')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.comments')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.regDate')}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    {t('admin.submissions.actions')}
                  </TableHead>
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
                        {t('admin.submissions.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(member.id)}
                      >
                        {t('admin.submissions.delete')}
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
                ? t('admin.submissions.noResultsPage', { page })
                : t('admin.submissions.resultsPage', { count: filtered.length, page })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                {t('admin.submissions.previous')}
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
                {t('admin.submissions.next')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.submissions.editTitle')}</DialogTitle>
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
              <Label>{t('admin.submissions.ageRanges')}</Label>
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
            <Button onClick={handleSaveEdit}>{t('admin.submissions.save')}</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('admin.submissions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-[300px] text-center">
          <DialogHeader>
            <DialogTitle>{t('admin.submissions.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('admin.submissions.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={confirmDelete}>
              {t('admin.submissions.confirm')}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>
              {t('admin.submissions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubmissions;
