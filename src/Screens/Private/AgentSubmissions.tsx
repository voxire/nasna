import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import type { SubmissionDocument } from '../../types';

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

  if (loading)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate(-1)}
        sx={{ marginBottom: 2 }}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </Button>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Agent Submissions
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Date Registered</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.fullName}</TableCell>
                <TableCell>{submission.emailAddress}</TableCell>
                <TableCell>{submission.phoneNumber}</TableCell>
                <TableCell>{submission.registrationDate?.toDate().toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AgentSubmissions;
