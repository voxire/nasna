import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import type { EmergencyContactDocument } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
import { Textarea } from '@/Components/ui/textarea';
import { toast } from 'sonner';

interface ContactRow extends EmergencyContactDocument {
  id: string;
}

const DEFAULT_FORM = {
  name: '',
  phoneNumber: '',
  category: 'medical',
  coverage: '',
  notes: '',
  verified: true,
};

export default function EmergencyContactsManagement() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const contactQuery = query(collection(db, 'emergencyContacts'), orderBy('name'));

    return onSnapshot(contactQuery, (snapshot) => {
      setContacts(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as EmergencyContactDocument),
        })),
      );
    });
  }, []);

  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return contacts.filter((contact) =>
      normalizedQuery.length === 0
        ? true
        : [contact.name, contact.phoneNumber, contact.category, contact.coverage].some((field) =>
            (field ?? '').toLowerCase().includes(normalizedQuery),
          ),
    );
  }, [contacts, searchQuery]);

  const resetForm = () => {
    setFormState(DEFAULT_FORM);
    setEditingContact(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingContact) {
        await updateDoc(doc(db, 'emergencyContacts', editingContact.id), {
          ...formState,
          lastVerifiedAt: formState.verified ? new Date() : null,
          updatedAt: new Date(),
        });
        toast.success(t('admin.emergencyContacts.updateSuccess'));
      } else {
        await addDoc(collection(db, 'emergencyContacts'), {
          ...formState,
          lastVerifiedAt: formState.verified ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success(t('admin.emergencyContacts.addSuccess'));
      }

      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(t('admin.emergencyContacts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      await deleteDoc(doc(db, 'emergencyContacts', contactId));
      toast.success(t('admin.emergencyContacts.deleteSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(t('admin.emergencyContacts.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.emergencyContacts.title')}</h1>
          <p className="text-sm text-gray-500">
            {t('admin.emergencyContacts.description')}
          </p>
        </div>
        <Button
          className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
          onClick={() => {
            resetForm();
            setEditingContact({ id: '', ...DEFAULT_FORM });
          }}
        >
          {t('admin.emergencyContacts.addContact')}
        </Button>
      </div>

      <Input
        placeholder={t('admin.emergencyContacts.searchPlaceholder')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="bg-white"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredContacts.map((contact) => (
          <Card key={contact.id}>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <p className="text-sm text-gray-500 capitalize">
                    {contact.category} • {contact.coverage}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    contact.verified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {contact.verified ? t('admin.emergencyContacts.verified') : t('admin.emergencyContacts.needsReview')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{contact.phoneNumber}</p>
                <p className="text-sm text-gray-500">{contact.notes || t('admin.emergencyContacts.noNotes')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingContact(contact);
                    setFormState({
                      name: contact.name,
                      phoneNumber: contact.phoneNumber,
                      category: contact.category,
                      coverage: contact.coverage,
                      notes: contact.notes ?? '',
                      verified: contact.verified,
                    });
                  }}
                >
                  {t('admin.emergencyContacts.edit')}
                </Button>
                <Button variant="destructive" onClick={() => void handleDelete(contact.id)}>
                  {t('admin.emergencyContacts.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={editingContact !== null}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact?.id ? t('admin.emergencyContacts.editTitle') : t('admin.emergencyContacts.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.emergencyContacts.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.emergencyContacts.name')}</Label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.emergencyContacts.phoneNumber')}</Label>
              <Input
                value={formState.phoneNumber}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, phoneNumber: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.emergencyContacts.category')}</Label>
              <Select
                value={formState.category}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">{t('admin.emergencyContacts.medical')}</SelectItem>
                  <SelectItem value="shelter">{t('admin.emergencyContacts.shelter')}</SelectItem>
                  <SelectItem value="food">{t('admin.emergencyContacts.food')}</SelectItem>
                  <SelectItem value="legal">{t('admin.emergencyContacts.legal')}</SelectItem>
                  <SelectItem value="protection">{t('admin.emergencyContacts.protection')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.emergencyContacts.coverage')}</Label>
              <Input
                value={formState.coverage}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, coverage: event.target.value }))
                }
                placeholder={t('admin.emergencyContacts.coveragePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.emergencyContacts.notes')}</Label>
              <Textarea
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.emergencyContacts.verificationStatus')}</Label>
              <Select
                value={String(formState.verified)}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, verified: value === 'true' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('admin.emergencyContacts.verified')}</SelectItem>
                  <SelectItem value="false">{t('admin.emergencyContacts.needsReview')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? t('admin.emergencyContacts.saving') : t('admin.emergencyContacts.saveContact')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
