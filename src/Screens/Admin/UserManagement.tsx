import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/firebase';
import type { CenterDocument, MemberDocument } from '@/types';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { createManagedUser, setManagedUserStatus, updateManagedUser } from '@/services/adminUsers';

type UserKind = 'ngo' | 'admin' | 'field_agent' | 'center_agent' | 'super_admin';

interface UserRow extends MemberDocument {
  id: string;
}

interface CenterOption {
  id: string;
  name: string;
}

interface NgoOption {
  id: string;
  name: string;
}

interface UserFormState {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserKind;
  contactPersonName: string;
  areaOfOperation: string;
  assignedNgoId: string;
  centerId: string;
}

const DEFAULT_FORM: UserFormState = {
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 'field_agent',
  contactPersonName: '',
  areaOfOperation: '',
  assignedNgoId: '',
  centerId: '',
};

function inferUserKind(user: UserRow): UserKind {
  if (user.role === 'super_admin') return 'super_admin';
  if (user.role === 'admin') return 'admin';
  if (user.role === 'member') return 'ngo';
  if (user.centerId) return 'center_agent';
  return 'field_agent';
}

function buildUpdatePayload(form: UserFormState, uid: string) {
  const base = {
    uid,
    name: form.name,
    email: form.email,
    phoneNumber: form.phoneNumber,
  };

  if (form.role === 'ngo') {
    return {
      ...base,
      role: 'member' as const,
      contactPersonName: form.contactPersonName,
    };
  }

  if (form.role === 'admin') {
    return {
      ...base,
      role: 'admin' as const,
    };
  }

  return {
    ...base,
    role: 'agent' as const,
    areaOfOperation: form.areaOfOperation,
    assignedNgoId: form.role === 'field_agent' ? form.assignedNgoId : '',
    centerId: form.role === 'center_agent' ? form.centerId : '',
  };
}

function buildCreatePayload(form: UserFormState) {
  if (form.role === 'ngo') {
    return {
      role: 'member' as const,
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      password: form.password,
      contactPersonName: form.contactPersonName,
      validateImmediately: true,
    };
  }

  return {
    role: 'agent' as const,
    name: form.name,
    email: form.email,
    phoneNumber: form.phoneNumber,
    password: form.password,
    areaOfOperation: form.areaOfOperation,
    assignedNgoId: form.role === 'field_agent' ? form.assignedNgoId : '',
    centerId: form.role === 'center_agent' ? form.centerId : '',
    validateImmediately: true,
  };
}

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [ngos, setNgos] = useState<NgoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'members'), orderBy('createdAt', 'desc'), limit(200)),
      (snapshot) => {
        setUsers(
          snapshot.docs.map((document: QueryDocumentSnapshot) => ({
            id: document.id,
            ...(document.data() as MemberDocument),
          })),
        );
        setLoading(false);
      },
      (error) => {
        console.error('User management users:', error);
        toast.error(t('admin.userManagement.loadError'));
        setLoading(false);
      },
    );

    const unsubscribeCenters = onSnapshot(
      query(collection(db, 'centers'), orderBy('name'), limit(200)),
      (snapshot) => {
        setCenters(
          snapshot.docs.map((document) => ({
            id: document.id,
            name: (document.data() as CenterDocument).name,
          })),
        );
      },
    );

    const unsubscribeNgos = onSnapshot(
      query(collection(db, 'members'), orderBy('name'), limit(200)),
      (snapshot) => {
        setNgos(
          snapshot.docs
            .map((document) => ({
              id: document.id,
              ...(document.data() as MemberDocument),
            }))
            .filter((user) => user.role === 'member')
            .map((user) => ({ id: user.id, name: user.name })),
        );
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeCenters();
      unsubscribeNgos();
    };
  }, [t]);

  const centerNameById = useMemo(
    () => Object.fromEntries(centers.map((center) => [center.id, center.name])),
    [centers],
  );
  const ngoNameById = useMemo(
    () => Object.fromEntries(ngos.map((ngo) => [ngo.id, ngo.name])),
    [ngos],
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const userKind = inferUserKind(user);
      const isActive = user.active !== false;
      const assignmentLabel = user.centerId
        ? (centerNameById[user.centerId] ?? user.centerId)
        : user.assignedNgoId
          ? (ngoNameById[user.assignedNgoId] ?? user.assignedNgoId)
          : '';

      const matchesSearch =
        !q ||
        [user.name, user.email, user.phoneNumber, assignmentLabel]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
      const matchesRole = roleFilter === 'all' || roleFilter === userKind;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [centerNameById, ngoNameById, roleFilter, searchQuery, statusFilter, users]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditTarget(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditTarget(user);
    setForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      password: '',
      role: inferUserKind(user),
      contactPersonName: user.contactPersonName ?? '',
      areaOfOperation: user.areaOfOperation ?? '',
      assignedNgoId: user.assignedNgoId ?? '',
      centerId: user.centerId ?? '',
    });
  };

  const closeDialogs = () => {
    setCreateOpen(false);
    setEditTarget(null);
    resetForm();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateManagedUser(buildUpdatePayload(form, editTarget.id));
        toast.success(t('admin.userManagement.updateSuccess'));
      } else {
        await createManagedUser(buildCreatePayload(form));
        toast.success(t('admin.userManagement.createSuccess'));
      }
      closeDialogs();
    } catch (error) {
      console.error('User management save:', error);
      toast.error(error instanceof Error ? error.message : t('admin.userManagement.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: UserRow) => {
    setStatusBusyId(user.id);
    try {
      await setManagedUserStatus(user.id, user.active === false);
      toast.success(
        user.active === false
          ? t('admin.userManagement.reactivateSuccess')
          : t('admin.userManagement.deactivateSuccess'),
      );
    } catch (error) {
      console.error('User status toggle:', error);
      toast.error(error instanceof Error ? error.message : t('admin.userManagement.statusError'));
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleMakeAdmin = async (user: UserRow) => {
    setPromotingUserId(user.id);
    try {
      await updateManagedUser({
        uid: user.id,
        role: 'admin',
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      });
      toast.success(t('admin.userManagement.makeAdminSuccess'));
    } catch (error) {
      console.error('Promote user to admin:', error);
      toast.error(
        error instanceof Error ? error.message : t('admin.userManagement.makeAdminError'),
      );
    } finally {
      setPromotingUserId(null);
    }
  };

  const getRoleLabel = (user: UserRow) => t(`admin.userManagement.roles.${inferUserKind(user)}`);

  const getAssignmentLabel = (user: UserRow) => {
    if (user.centerId) {
      return centerNameById[user.centerId] ?? user.centerId;
    }
    if (user.assignedNgoId) {
      return ngoNameById[user.assignedNgoId] ?? user.assignedNgoId;
    }
    return '—';
  };

  const isNgo = form.role === 'ngo';
  const isAgent = form.role === 'field_agent' || form.role === 'center_agent';
  const showNgoAssignment = form.role === 'field_agent';
  const showCenterAssignment = form.role === 'center_agent';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.userManagement.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.userManagement.description')}
          </p>
        </div>
        <Button className="bg-[#12a89d] hover:bg-[#0e9088]" onClick={openCreate}>
          {t('admin.userManagement.create')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Input
          placeholder={t('admin.userManagement.searchPlaceholder')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="min-w-[220px] flex-1 bg-gray-50 border-gray-200"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.userManagement.roleFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.userManagement.allRoles')}</SelectItem>
            <SelectItem value="super_admin">
              {t('admin.userManagement.roles.super_admin')}
            </SelectItem>
            <SelectItem value="admin">{t('admin.userManagement.roles.admin')}</SelectItem>
            <SelectItem value="ngo">{t('admin.userManagement.roles.ngo')}</SelectItem>
            <SelectItem value="field_agent">
              {t('admin.userManagement.roles.field_agent')}
            </SelectItem>
            <SelectItem value="center_agent">
              {t('admin.userManagement.roles.center_agent')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.userManagement.statusFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.userManagement.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('admin.userManagement.status.active')}</SelectItem>
            <SelectItem value="inactive">{t('admin.userManagement.status.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('admin.userManagement.loading')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead>{t('admin.userManagement.name')}</TableHead>
                  <TableHead>{t('admin.userManagement.email')}</TableHead>
                  <TableHead>{t('admin.userManagement.role')}</TableHead>
                  <TableHead>{t('admin.userManagement.assignment')}</TableHead>
                  <TableHead>{t('admin.userManagement.statusLabel')}</TableHead>
                  <TableHead>{t('admin.userManagement.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isActive = user.active !== false;
                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleLabel(user)}</TableCell>
                      <TableCell>{getAssignmentLabel(user)}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {isActive
                            ? t('admin.userManagement.status.active')
                            : t('admin.userManagement.status.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                          {t('admin.userManagement.edit')}
                        </Button>
                        {inferUserKind(user) !== 'admin' &&
                          inferUserKind(user) !== 'super_admin' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={promotingUserId === user.id}
                              onClick={() => handleMakeAdmin(user)}
                            >
                              {t('admin.userManagement.makeAdmin')}
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant={isActive ? 'destructive' : 'secondary'}
                          disabled={statusBusyId === user.id}
                          onClick={() => toggleStatus(user)}
                        >
                          {isActive
                            ? t('admin.userManagement.deactivate')
                            : t('admin.userManagement.reactivate')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog
        open={createOpen || Boolean(editTarget)}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? t('admin.userManagement.editTitle')
                : t('admin.userManagement.createTitle')}
            </DialogTitle>
            <DialogDescription>{t('admin.userManagement.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t('admin.userManagement.name')}</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.userManagement.email')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.userManagement.phoneNumber')}</Label>
              <Input
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phoneNumber: event.target.value }))
                }
              />
            </div>
            {!editTarget && (
              <div className="space-y-1">
                <Label>{t('admin.userManagement.temporaryPassword')}</Label>
                <Input
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>{t('admin.userManagement.role')}</Label>
              <Select
                value={form.role}
                onValueChange={(value: UserKind) =>
                  setForm((current) => ({
                    ...current,
                    role: value,
                    assignedNgoId: value === 'field_agent' ? current.assignedNgoId : '',
                    centerId: value === 'center_agent' ? current.centerId : '',
                  }))
                }
                disabled={editTarget?.role === 'super_admin' || editTarget?.role === 'admin'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ngo">{t('admin.userManagement.roles.ngo')}</SelectItem>
                  <SelectItem value="field_agent">
                    {t('admin.userManagement.roles.field_agent')}
                  </SelectItem>
                  <SelectItem value="center_agent">
                    {t('admin.userManagement.roles.center_agent')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isNgo && (
              <div className="space-y-1">
                <Label>{t('admin.userManagement.contactPerson')}</Label>
                <Input
                  value={form.contactPersonName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactPersonName: event.target.value,
                    }))
                  }
                />
              </div>
            )}

            {isAgent && (
              <div className="space-y-1">
                <Label>{t('admin.userManagement.areaOfOperation')}</Label>
                <Input
                  value={form.areaOfOperation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      areaOfOperation: event.target.value,
                    }))
                  }
                />
              </div>
            )}

            {showNgoAssignment && (
              <div className="space-y-1">
                <Label>{t('admin.userManagement.assignedNgo')}</Label>
                <Select
                  value={form.assignedNgoId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, assignedNgoId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.userManagement.selectNgo')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ngos.map((ngo) => (
                      <SelectItem key={ngo.id} value={ngo.id}>
                        {ngo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showCenterAssignment && (
              <div className="space-y-1">
                <Label>{t('admin.userManagement.assignedCenter')}</Label>
                <Select
                  value={form.centerId}
                  onValueChange={(value) => setForm((current) => ({ ...current, centerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.userManagement.selectCenter')} />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              {t('admin.userManagement.cancel')}
            </Button>
            <Button
              className="bg-[#12a89d] hover:bg-[#0e9088]"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? t('admin.userManagement.saving') : t('admin.userManagement.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
