import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, Timestamp, query, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
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

const PAGE_SIZE = 10;

const OFFER_TYPES = ['Shelter', 'Food', 'Medical', 'Clothing', 'Water', 'Other'] as const;

interface OfferRow {
  id: string;
  type: string;
  phone: string;
  region: string;
  neighborhood?: string;
  capacity?: number;
  description?: string;
  lat?: number;
  lng?: number;
  createdAt: Timestamp;
}

function OffersManagement() {
  const [items, setItems] = useState<OfferRow[]>([]);
  const [filtered, setFiltered] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'offers'), limit(50)));
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OfferRow, 'id'>) }));
      data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setItems(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load offers.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (query: string, type: string, data: OfferRow[]) => {
    let result = data;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((o) =>
        [o.phone, o.region, o.neighborhood].some((v) => (v ?? '').toLowerCase().includes(q)),
      );
    }
    if (type && type !== 'all') result = result.filter((o) => o.type === type);
    setFiltered(result);
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(q, typeFilter, items);
  };

  const handleTypeFilter = (v: string) => {
    setTypeFilter(v);
    applyFilters(searchQuery, v, items);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      const updated = items.filter((o) => o.id !== id);
      setItems(updated);
      applyFilters(searchQuery, typeFilter, updated);
      toast.success('Offer deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">Aid Offers</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder="Search by phone, region, or neighborhood"
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={typeFilter} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OFFER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                <TableHead className="font-semibold text-gray-700">Region</TableHead>
                <TableHead className="font-semibold text-gray-700">Neighborhood</TableHead>
                <TableHead className="font-semibold text-gray-700">Capacity</TableHead>
                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.region}</TableCell>
                  <TableCell>{item.neighborhood || '—'}</TableCell>
                  <TableCell>{item.capacity ?? '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-gray-500 text-xs">
                    {item.description || '—'}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filtered.length === 0
                ? '0 results'
                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OffersManagement;
