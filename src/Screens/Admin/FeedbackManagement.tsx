import { useEffect, useState } from 'react';
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
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [filtered, setFiltered] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [viewItem, setViewItem] = useState<FeedbackRow | null>(null);
  const [page, setPage] = useState(1);

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
      toast.error('Failed to load feedback.');
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
      toast.success('Marked as read.');
    } catch {
      toast.error('Failed to update.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
      const updated = items.filter((f) => f.id !== id);
      setItems(updated);
      applyFilters(searchQuery, typeFilter, readFilter, updated);
      toast.success('Feedback deleted.');
    } catch {
      toast.error('Failed to delete.');
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
      <h1 className="text-2xl font-bold mb-5 text-gray-800">Feedback</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <Input
          placeholder="Search by name, email, or message"
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
            {['General', 'Bug Report', 'Feature Request', 'Complaint', 'Compliment'].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={handleReadFilter}>
          <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="false">Unread</SelectItem>
            <SelectItem value="true">Read</SelectItem>
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
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Message</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
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
                      {item.read ? 'Read' : 'Unread'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell>{item.name || '—'}</TableCell>
                  <TableCell>{item.email || '—'}</TableCell>
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
                      View
                    </Button>
                    {!item.read && (
                      <Button
                        size="sm"
                        className="bg-[#12a89d] hover:bg-[#0e9088] text-white"
                        onClick={() => handleMarkRead(item.id)}
                      >
                        Mark Read
                      </Button>
                    )}
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
              {viewItem?.name ? `From: ${viewItem.name}` : 'Anonymous'}
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
    </div>
  );
}

export default FeedbackManagement;
