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

interface AgentRow extends MemberDocument {
  id: string;
}

function Agents() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [validatedFilter, setValidatedFilter] = useState('');
  const [editAgent, setEditAgent] = useState<AgentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    areaOfOperation: '',
    password: '',
    validateImmediately: true,
  });
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

  const handleDelete = async () => {
    if (!deletingAgentId) return;
    try {
      await deleteManagedUserAccount(deletingAgentId);
      toast.success(t('admin.agents.deleteSuccess'));
      setDeletingAgentId(null);
    } catch (error) {
      console.error('Error deleting agent: ', error);
      toast.error(error instanceof Error ? error.message : t('admin.agents.deleteError'));
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await validateManagedUserAccount(id);
      toast.success(t('admin.agents.validateSuccess'));
    } catch (error) {
      console.error('Error validating agent: ', error);
      toast.error(error instanceof Error ? error.message : t('admin.agents.validateError'));
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
      await updateManagedUserAccount({
        uid: editAgent.id,
        role: 'agent',
        name: editAgent.name,
        email: editAgent.email,
        phoneNumber: editAgent.phoneNumber,
        areaOfOperation: editAgent.areaOfOperation ?? '',
      });
      toast.success(t('admin.agents.updateSuccess'));
      setModalOpen(false);
      setEditAgent(null);
    } catch (error) {
      console.error('Error updating agent: ', error);
      toast.error(error instanceof Error ? error.message : t('admin.agents.updateError'));
    }
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAgent((previous) => ({ ...previous, [name]: value }));
  };

  const resetCreateForm = () => {
    setNewAgent({
      name: '',
      email: '',
      phoneNumber: '',
      areaOfOperation: '',
      password: '',
      validateImmediately: true,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createManagedUserAccount({
        role: 'agent',
        name: newAgent.name,
        email: newAgent.email,
        phoneNumber: newAgent.phoneNumber,
        areaOfOperation: newAgent.areaOfOperation,
        password: newAgent.password,
        validateImmediately: newAgent.validateImmediately,
      });
      toast.success('Agent account created.');
      setCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error('Error creating agent: ', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create agent account.');
    } finally {
      setCreating(false);
    }
  };

  const editFormFields = useMemo(
    () => [
      { name: 'name', label: t('admin.agents.name') },
      { name: 'email', label: t('admin.agents.email') },
      { name: 'phoneNumber', label: t('admin.agents.phoneNumber') },
      { name: 'areaOfOperation', label: t('admin.agents.areaOfOperation') },
    ],
    [t],
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.agents.title')}</h1>
        <Button
          className="bg-[#12a89d] hover:bg-[#0e9088]"
          onClick={() => setCreateModalOpen(true)}
        >
          Create Agent
        </Button>
      </div>

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
                      onClick={() => setDeletingAgentId(agent.id)}
                    >
                      {t('admin.agents.delete')}
                    </Button>
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
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>
              This creates both the Firebase Auth account and the agent profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input name="name" value={newAgent.name} onChange={handleCreateChange} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={newAgent.email}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Phone number</Label>
              <Input
                name="phoneNumber"
                value={newAgent.phoneNumber}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Area of operation</Label>
              <Input
                name="areaOfOperation"
                value={newAgent.areaOfOperation}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Temporary password</Label>
              <Input
                type="password"
                name="password"
                value={newAgent.password}
                onChange={handleCreateChange}
                minLength={6}
                required
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm">
              <Checkbox
                checked={newAgent.validateImmediately}
                onCheckedChange={(checked) =>
                  setNewAgent((previous) => ({
                    ...previous,
                    validateImmediately: checked === true,
                  }))
                }
              />
              Validate this agent immediately
            </label>
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Agent'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingAgentId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingAgentId(null);
        }}
        title={t('admin.agents.delete')}
        description={t('admin.agents.deleteConfirm')}
        confirmLabel={t('admin.agents.delete')}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
      />

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
