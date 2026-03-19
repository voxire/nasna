import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import type { SubmissionDocument } from '../../types';
import CaseStatusBadge from '@/Components/CaseStatusBadge';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;

interface SubmissionRow extends SubmissionDocument {
  id: string;
}

function AgentSubmissions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const currentUser = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const initialized = useAuthStore((state) => state.initialized);
  const authLoading = useAuthStore((state) => state.loading);
  const profileLoading = useAuthStore((state) => state.profileLoading);

  useEffect(() => {
    if (!initialized || authLoading || (currentUser && profileLoading)) {
      return;
    }

    setLoading(true);
    const agentUid = currentUser?.uid;
    if (!agentUid) {
      navigate('/auth/login');
      return;
    }

    if (!role) {
      return;
    }

    if (role !== 'agent') {
      navigate('/');
      return;
    }

    const submissionQuery = query(
      collection(db, 'submissions'),
      where('agent', '==', agentUid),
    );
    const unsubscribe = onSnapshot(
      submissionQuery,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as SubmissionDocument),
        }));
        setSubmissions(data);
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Error fetching submissions:', snapshotError);
        setError(t('submission.agent.loadError'));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [authLoading, currentUser, initialized, navigate, profileLoading, role]);

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const paginated = useMemo(
    () => submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [submissions, page],
  );

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">{t('submission.agent.title')}</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.fullName')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.phoneNumber')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.status')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.assignedNgo')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.dateRegistered')}
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {t('submission.agent.noSubmissions')}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {t('submission.agent.noSubmissionsHint')}
                  </p>
                  <Link
                    to="/agent/create"
                    className="text-sm font-medium text-[#12a89d] hover:underline"
                  >
                    {t('submission.agent.registerFirst')} →
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((submission) => (
                <TableRow
                  key={submission.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/agent/submissions/${submission.id}`)}
                >
                  <TableCell className="font-medium">{submission.fullName}</TableCell>
                  <TableCell>{submission.phoneNumber}</TableCell>
                  <TableCell>
                    <CaseStatusBadge
                      status={(submission.status as string) ?? 'pending'}
                      staleFlagged={submission.staleFlagged ?? false}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {submission.assignedToOrgName || t('submission.agent.unassigned')}
                  </TableCell>
                  <TableCell>
                    {submission.registrationDate?.toDate().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && submissions.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, submissions.length)}{' '}
              / {submissions.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-600 px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentSubmissions;
