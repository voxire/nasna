import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  query,
  limit,
} from 'firebase/firestore';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/Components/ui/dialog';
import ConfirmDialog from '@/Components/ConfirmDialog';

const PAGE_SIZE = 10;

interface FeedbackRow {
  id: string;
  type: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

function FeedbackManagement() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [filtered, setFiltered] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [viewItem, setViewItem] = useState<FeedbackRow | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const typeLabels: Record<string, string> = {
    General: t('admin.feedbackMgmt.general'),
    'Bug Report': t('admin.feedbackMgmt.bugReport'),
    'Feature Request': t('admin.feedbackMgmt.featureRequest'),
    Complaint: t('admin.feedbackMgmt.complaint'),
    Compliment: t('admin.feedbackMgmt.compliment'),
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'feedback'), limit(50)));
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackRow, 'id'>) }));
      data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setItems(data);
      setFiltered(data);
    } catch {
      toast.error(t('admin.feedbackMgmt.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (query: string, type: string, read: string, data: FeedbackRow[]) => {
    let result = data;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((f) =>
        [f.name, f.email, f.message].some((v) => (v ?? '').toLowerCase().includes(q)),
      );
    }
    if (type && type !== 'all') result = result.filter((f) => f.type === type);
    if (read && read !== 'all') result = result.filter((f) => String(f.read) === read);
    setFiltered(result);
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(q, typeFilter, readFilter, items);
  };

  const handleTypeFilter = (v: string) => {
    setTypeFilter(v);
    applyFilters(searchQuery, v, readFilter, items);
  };
  const handleReadFilter = (v: string) => {
    setReadFilter(v);
    applyFilters(searchQuery, typeFilter, v, items);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { read: true });
      const updated = items.map((f) => (f.id === id ? { ...f, read: true } : f));
      setItems(updated);
      applyFilters(searchQuery, typeFilter, readFilter, updated);
      toast.success(t('admin.feedbackMgmt.markedRead'));
    } catch {
      toast.error(t('admin.feedbackMgmt.updateError'));
    }
  };

  const handleDelete = async () => {
    if (!deletingFeedbackId) return;
    try {
      await deleteDoc(doc(db, 'feedback', deletingFeedbackId));
      const updated = items.filter((f) => f.id !== deletingFeedbackId);
      setItems(updated);
      applyFilters(searchQuery, typeFilter, readFilter, updated);
      toast.success(t('admin.feedbackMgmt.deleteSuccess'));
      setDeletingFeedbackId(null);
    } catch {
      toast.error(t('admin.feedbackMgmt.deleteError'));
    }
  };

  const handleView = async (item: FeedbackRow) => {
    setViewItem(item);
    if (!item.read) await handleMarkRead(item.id);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5 text-gray-800">{t('admin.feedbackMgmt.title')}</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder={t('admin.feedbackMgmt.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
        />
        <Select value={typeFilter} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.feedbackMgmt.typePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.feedbackMgmt.allTypes')}</SelectItem>
            {['General', 'Bug Report', 'Feature Request', 'Complaint', 'Compliment'].map(
              (t_type) => (
                <SelectItem key={t_type} value={t_type}>
                  {typeLabels[t_type]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={handleReadFilter}>
          <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200">
            <SelectValue placeholder={t('admin.feedbackMgmt.statusPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.feedbackMgmt.all')}</SelectItem>
            <SelectItem value="false">{t('admin.feedbackMgmt.unread')}</SelectItem>
            <SelectItem value="true">{t('admin.feedbackMgmt.read')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('admin.feedbackMgmt.loading')}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.statusHeader')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.type')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.name')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.email')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.message')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.date')}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  {t('admin.feedbackMgmt.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow
                  key={item.id}
                  className={`hover:bg-gray-50 ${!item.read ? 'font-medium' : ''}`}
                >
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.read ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {item.read
                        ? t('admin.feedbackMgmt.readBadge')
                        : t('admin.feedbackMgmt.unreadBadge')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell>{item.name || '-'}</TableCell>
                  <TableCell>{item.email || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.message}</TableCell>
                  <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => handleView(item)}
                    >
                      {t('admin.feedbackMgmt.view')}
                    </Button>
                    {!item.read && (
                      <Button
                        size="sm"
                        className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                        onClick={() => handleMarkRead(item.id)}
                      >
                        {t('admin.feedbackMgmt.markRead')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingFeedbackId(item.id)}
                    >
                      {t('admin.feedbackMgmt.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {filtered.length === 0
                ? t('admin.feedbackMgmt.zeroResults')
                : t('admin.feedbackMgmt.paginationRange', {
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
                {t('admin.feedbackMgmt.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                {t('admin.feedbackMgmt.next')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={!!viewItem}
        onOpenChange={(open) => {
          if (!open) setViewItem(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewItem?.type}</DialogTitle>
            <DialogDescription>
              {viewItem?.name
                ? t('admin.feedbackMgmt.from', { name: viewItem.name })
                : t('admin.feedbackMgmt.anonymous')}
              {viewItem?.email ? ` · ${viewItem.email}` : ''}
              {' · '}
              {viewItem?.createdAt?.toDate().toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {viewItem?.message}
          </p>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingFeedbackId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingFeedbackId(null);
        }}
        title={t('admin.feedbackMgmt.delete')}
        description={t('admin.feedbackMgmt.deleteConfirm')}
        confirmLabel={t('admin.feedbackMgmt.delete')}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default FeedbackManagement;
