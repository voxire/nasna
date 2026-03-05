import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { EmergencyContactDocument } from '@/types';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { PhoneCall } from 'lucide-react';

interface ContactRow extends EmergencyContactDocument {
  id: string;
}

export default function Emergency() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [coverageFilter, setCoverageFilter] = useState('all');

  useEffect(() => {
    const contactQuery = query(collection(db, 'emergencyContacts'), orderBy('name'));

    return onSnapshot(contactQuery, (snapshot) => {
      setContacts(
        snapshot.docs
          .map((document) => ({
            id: document.id,
            ...(document.data() as EmergencyContactDocument),
          }))
          .filter((contact) => contact.verified),
      );
    });
  }, []);

  const coverageOptions = useMemo(
    () => Array.from(new Set(contacts.map((contact) => contact.coverage).filter(Boolean))),
    [contacts],
  );

  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [contact.name, contact.phoneNumber, contact.category, contact.coverage, contact.notes].some((field) =>
          (field ?? '').toLowerCase().includes(normalizedQuery),
        );
      const matchesCategory = categoryFilter === 'all' || contact.category === categoryFilter;
      const matchesCoverage = coverageFilter === 'all' || contact.coverage === coverageFilter;

      return matchesSearch && matchesCategory && matchesCoverage;
    });
  }, [categoryFilter, contacts, coverageFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#12a89d]">
          Emergency Directory
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Verified emergency and response contacts
        </h1>
        <p className="mt-3 text-base text-gray-600">
          Browse trusted hotlines, shelters, medical responders, and protection contacts. Call the
          numbers directly from your phone when you need urgent support.
        </p>
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px]">
        <Input
          placeholder="Search by name, phone, category, or area"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="bg-gray-50"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="shelter">Shelter</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="protection">Protection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={coverageFilter} onValueChange={setCoverageFilter}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Coverage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All coverage</SelectItem>
            {coverageOptions.map((coverage) => (
              <SelectItem key={coverage} value={coverage}>
                {coverage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="border-gray-200 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#12a89d]">
                    {contact.category}
                  </p>
                  <CardTitle className="mt-1 text-xl">{contact.name}</CardTitle>
                </div>
                <span className="rounded-full bg-[#12a89d]/10 px-2.5 py-1 text-xs font-medium text-[#12a89d]">
                  {contact.coverage}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-600">
                {contact.notes || 'No extra notes provided.'}
              </p>
              <a
                href={`tel:${contact.phoneNumber}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition hover:border-[#12a89d] hover:bg-[#12a89d]/5"
              >
                <span>{contact.phoneNumber}</span>
                <PhoneCall className="h-4 w-4 text-[#12a89d]" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No emergency contacts matched the current filters.
        </div>
      ) : null}
    </div>
  );
}
