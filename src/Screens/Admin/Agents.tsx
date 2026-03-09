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

interface AgentRow extends MemberDocument {
  id: string;
}

function Agents() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [validatedFilter, setValidatedFilter] = useState('');
  const [editAgent, setEditAgent] = useState<AgentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const membersCollectionRef = useMemo(() => collection(db, 'members'), []);
  const agentConstraints = useMemo(() => [where('role', '==', 'agent')], []);
  const mapAgent = useCallback(
    (documentSnapshot: QueryDocumentSnapshot<DocumentData>) => ({
      id: documentSnapshot.id,
      ...(documentSnapshot.data() as MemberDocument),
    }),
    [],
  );
  const {
    items: agents,
    loading,
    error,
    page,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePaginatedQuery<AgentRow>({
    collectionRef: membersCollectionRef,
    constraints: agentConstraints,
    orderByField: 'createdAt',
    pageSize: PAGE_SIZE,
    mapDoc: mapAgent,
  });

  const filteredAgents = useMemo(() => {
    let result = agents;
    if (searchQuery) {
      const queryValue = searchQuery.toLowerCase();
      result = result.filter((agent) =>
        [agent.name, agent.contactPersonName, agent.email].some((field) =>
          (field ?? '').toLowerCase().includes(queryValue),
        ),
      );
    }
    if (validatedFilter && validatedFilter !== 'all') {
      result = result.filter((agent) => String(agent.validated) === validatedFilter);
    }
    return result;
  }, [agents, searchQuery, validatedFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setValidatedFilter(value);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.agents.deleteConfirm'))) return;
    try {
      await deleteDoc(doc(db, 'members', id));
      toast.success(t('admin.agents.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting agent: ', error);
      toast.error(t('admin.agents.deleteError'));
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { validated: true, updatedAt: new Date() });
      toast.success(t('admin.agents.validateSuccess'));
    } catch (error) {
      console.error('Error validating agent: ', error);
      toast.error(t('admin.agents.validateError'));
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditAgent((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAgent) return;
    try {
      await updateDoc(doc(db, 'members', editAgent.id), {
        name: editAgent.name,
        contactPersonName: editAgent.contactPersonName ?? '',
        email: editAgent.email,
        phoneNumber: editAgent.phoneNumber,
        updatedAt: new Date(),
      });
      toast.success(t('admin.agents.updateSuccess'));
      setModalOpen(false);
      setEditAgent(null);
    } catch (error) {
      console.error('Error updating agent: ', error);
      toast.error(t('admin.agents.updateError'));
    }
  };

  const editFormFields = useMemo(
    () => [
      { name: 'name', label: t('admin.agents.name') },
      { name: 'contactPersonName', label: t('admin.agents.contactPerson') },
      { name: 'email', label: t('admin.agents.email') },
      { name: 'phoneNumber', label: t('admin.agents.phoneNumber') },
    ],
    [t],
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('admin.agents.title')}</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder={t('admin.agents.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={validatedFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.agents.validatedFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.agents.all')}</SelectItem>
            <SelectItem value="true">{t('admin.agents.validated')}</SelectItem>
            <SelectItem value="false">{t('admin.agents.notValidated')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('admin.agents.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.agents.name')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.agents.contactPerson')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.agents.email')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.agents.phoneNumber')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.agents.validatedLabel')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.agents.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.contactPersonName}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.phoneNumber}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${agent.validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                      {agent.validated
                        ? t('admin.agents.validatedBadge')
                        : t('admin.agents.pendingBadge')}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {!agent.validated && (
                      <Button
                        size="sm"
                        className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                        onClick={() => handleValidate(agent.id)}
                      >
                        {t('admin.agents.validate')}
                      </Button>
                    )}
                    {agent.validated && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
                          onClick={() => {
                            setEditAgent(agent);
                            setModalOpen(true);
                          }}
                        >
                          {t('admin.agents.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(agent.id)}
                        >
                          {t('admin.agents.delete')}
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
              {filteredAgents.length === 0
                ? t('admin.agents.noResultsPage', { page })
                : t('admin.agents.resultsPage', { count: filteredAgents.length, page })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={!hasPreviousPage}
              >
                {t('admin.agents.previous')}
              </Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
                {t('admin.agents.next')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditAgent(null);
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('admin.agents.editTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            {editFormFields.map(({ name, label }) => (
              <div key={name} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  name={name}
                  value={(editAgent?.[name as keyof AgentRow] as string) ?? ''}
                  onChange={handleEditChange}
                  required
                />
              </div>
            ))}
            <DialogFooter>
              <Button type="submit">{t('admin.agents.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Agents;
