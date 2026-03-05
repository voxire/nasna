import { useEffect, useMemo, useState } from 'react';
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
        toast.success('Emergency contact updated.');
      } else {
        await addDoc(collection(db, 'emergencyContacts'), {
          ...formState,
          lastVerifiedAt: formState.verified ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success('Emergency contact added.');
      }

      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save emergency contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      await deleteDoc(doc(db, 'emergencyContacts', contactId));
      toast.success('Emergency contact deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete emergency contact.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Emergency Contacts</h1>
          <p className="text-sm text-gray-500">
            Maintain the public emergency directory and keep contact verification current.
          </p>
        </div>
        <Button
          className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
          onClick={() => {
            resetForm();
            setEditingContact({ id: '', ...DEFAULT_FORM });
          }}
        >
          Add Contact
        </Button>
      </div>

      <Input
        placeholder="Search by name, number, category, or coverage"
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
                  {contact.verified ? 'Verified' : 'Needs review'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{contact.phoneNumber}</p>
                <p className="text-sm text-gray-500">{contact.notes || 'No notes added.'}</p>
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
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => void handleDelete(contact.id)}>
                  Delete
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
              {editingContact?.id ? 'Edit Contact' : 'Add Emergency Contact'}
            </DialogTitle>
            <DialogDescription>
              Publish verified hotlines and response points to the public directory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formState.phoneNumber}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, phoneNumber: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
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
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="protection">Protection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coverage</Label>
              <Input
                value={formState.coverage}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, coverage: event.target.value }))
                }
                placeholder="Beirut, Lebanon-wide, South Lebanon..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Verification Status</Label>
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
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Needs review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-[#12a89d] text-white hover:bg-[#0e9088]"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
