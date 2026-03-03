import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const agentUid = auth.currentUser?.uid;
        if (!agentUid) {
          navigate('/');
          return;
        }
        const q = query(collection(db, 'submissions'), where('agent', '==', agentUid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as SubmissionDocument),
        }));
        setSubmissions(data);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
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
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-600 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Agent Submissions</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Full Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Phone Number</TableHead>
              <TableHead className="font-semibold text-gray-700">Date Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-500">No submissions found.</TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{submission.fullName}</TableCell>
                  <TableCell>{submission.emailAddress}</TableCell>
                  <TableCell>{submission.phoneNumber}</TableCell>
                  <TableCell>{submission.registrationDate?.toDate().toLocaleDateString()}</TableCell>
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
