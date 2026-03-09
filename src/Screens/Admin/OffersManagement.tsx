import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import ConfirmDialog from '@/Components/ConfirmDialog';

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
  const { t } = useTranslation();
  const [items, setItems] = useState<OfferRow[]>([]);
  const [filtered, setFiltered] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);

  const typeLabels: Record<string, string> = {
    Shelter: t('admin.offers.shelter'),
    Food: t('admin.offers.food'),
    Medical: t('admin.offers.medical'),
    Clothing: t('admin.offers.clothing'),
    Water: t('admin.offers.water'),
    Other: t('admin.offers.other'),
  };

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
      toast.error(t('admin.offers.loadError'));
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

  const handleDelete = async () => {
    if (!deletingOfferId) return;
    try {
      await deleteDoc(doc(db, 'offers', deletingOfferId));
      const updated = items.filter((o) => o.id !== deletingOfferId);
      setItems(updated);
      applyFilters(searchQuery, typeFilter, updated);
      toast.success(t('admin.offers.deleteSuccess'));
      setDeletingOfferId(null);
    } catch {
      toast.error(t('admin.offers.deleteError'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('admin.offers.title')}</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder={t('admin.offers.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={typeFilter} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.offers.typePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.offers.allTypes')}</SelectItem>
            {OFFER_TYPES.map((t_type) => (
              <SelectItem key={t_type} value={t_type}>
                {typeLabels[t_type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('admin.offers.loading')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.typeHeader')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.phone')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.region')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.neighborhood')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.capacity')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.description')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.date')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.offers.actions')}
                </TableHead>
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
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingOfferId(item.id)}
                    >
                      {t('admin.offers.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filtered.length === 0
                ? t('admin.offers.zeroResults')
                : t('admin.offers.paginationRange', {
                    start: (page - 1) * PAGE_SIZE + 1,
                    end: Math.min(page * PAGE_SIZE, filtered.length),
                    total: filtered.length,
                  })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                {t('admin.offers.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                {t('admin.offers.next')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingOfferId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingOfferId(null);
        }}
        title={t('admin.offers.delete')}
        description={t('admin.offers.deleteConfirm')}
        confirmLabel={t('admin.offers.delete')}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default OffersManagement;
