import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { SubmissionDocument } from '../../types';
import { Button } from '@/Components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';

interface SubmissionRow extends SubmissionDocument {
  id: string;
}

function AgentSubmissions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const agentUid = auth.currentUser?.uid;
    if (!agentUid) {
      navigate('/');
      return;
    }

    const submissionQuery = query(
      collection(db, 'submissions'),
      where('agent', '==', agentUid),
      limit(20),
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
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

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
                {t('submission.agent.email')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.phoneNumber')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {t('submission.agent.dateRegistered')}
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  {t('submission.agent.noSubmissions')}
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow
                  key={submission.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/agent/submissions/${submission.id}`)}
                >
                  <TableCell className="font-medium">{submission.fullName}</TableCell>
                  <TableCell>{submission.emailAddress}</TableCell>
                  <TableCell>{submission.phoneNumber}</TableCell>
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
      </div>
    </div>
  );
}

export default AgentSubmissions;
