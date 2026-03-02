import { useEffect, useState } from 'react';
import { db } from '../../firebase';
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
  Button,
  Modal,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useSnackBar } from '../../Components/NasnaSnackBar';
import type { SubmissionDocument } from '../../types';

interface SubmissionRow extends SubmissionDocument {
  id: string;
}

interface EditState {
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  gender?: string;
  currentGovernorate?: string;
  previousGovernorate?: string;
  street?: string;
  building?: string;
  floor?: string;
  ageRanges: string[];
  specialNeeds: string[];
  needs: string[];
  aidUrgency?: string;
  comments?: string;
  registrationDate?: { toDate: () => Date };
}

function AdminSubmissions() {
  const { showSnackbar } = useSnackBar();
  const [members, setMembers] = useState<SubmissionRow[]>([]);
  const [editMember, setEditMember] = useState<EditState>({
    ageRanges: [],
    specialNeeds: [],
    needs: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      const membersCollection = await getDocs(collection(db, 'submissions'));
      const membersData = membersCollection.docs.map((d) => ({
        id: d.id,
        ...(d.data() as SubmissionDocument),
      }));
      setMembers(membersData);
    };

    fetchMembers();
  }, []);

  const handleEditClick = (member: SubmissionRow) => {
    setEditMember({
      ...member,
      ageRanges: Array.isArray(member.ageRanges) ? (member.ageRanges as unknown as string[]) : [],
      specialNeeds: Array.isArray(member.specialNeeds) ? member.specialNeeds : [],
      needs: Array.isArray(member.needs) ? member.needs : [],
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteDoc(doc(db, 'submissions', memberToDelete));
      showSnackbar('Member deleted successfully.', 'success');
      setMembers(members.filter((member) => member.id !== memberToDelete));
      setConfirmDeleteOpen(false);
    } catch {
      setError('Failed to delete member.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editMember.id) return;
    try {
      await updateDoc(doc(db, 'submissions', editMember.id), {
        ...editMember,
        ageRanges: editMember.ageRanges,
        specialNeeds: editMember.specialNeeds,
        needs: editMember.needs,
      });
      setModalOpen(false);
    } catch {
      setError('Failed to update member details.');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Submissions
      </Typography>
      <TableContainer component={Paper} sx={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Email Address</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Current Governorate</TableCell>
              <TableCell>Previous Governorate</TableCell>
              <TableCell>Street</TableCell>
              <TableCell>Building</TableCell>
              <TableCell>Floor</TableCell>
              <TableCell>Age Ranges</TableCell>
              <TableCell>Special Needs</TableCell>
              <TableCell>Immediate Needs</TableCell>
              <TableCell>Aid Urgency</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.fullName}</TableCell>
                <TableCell>{member.phoneNumber}</TableCell>
                <TableCell>{member.emailAddress}</TableCell>
                <TableCell>{member.gender}</TableCell>
                <TableCell>{member.currentGovernorate}</TableCell>
                <TableCell>{member.previousGovernorate}</TableCell>
                <TableCell>{member.street}</TableCell>
                <TableCell>{member.building}</TableCell>
                <TableCell>{member.floor}</TableCell>
                <TableCell>{JSON.stringify(member.ageRanges || [])}</TableCell>
                <TableCell>{member.specialNeeds?.join(', ') || ''}</TableCell>
                <TableCell>{member.needs?.join(', ') || ''}</TableCell>
                <TableCell>{member.aidUrgency}</TableCell>
                <TableCell>{member.comments}</TableCell>
                <TableCell>{member.registrationDate?.toDate().toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleEditClick(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDeleteClick(member.id)}
                    sx={{ marginLeft: '10px' }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            padding: 2,
            backgroundColor: 'white',
            borderRadius: 2,
            width: '500px',
            maxWidth: '90%',
            margin: 'auto',
            marginTop: '50px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6">Edit Member</Typography>
          <TextField
            label="Full Name"
            value={editMember.fullName || ''}
            onChange={(e) => setEditMember({ ...editMember, fullName: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Phone Number"
            value={editMember.phoneNumber || ''}
            onChange={(e) => setEditMember({ ...editMember, phoneNumber: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email Address"
            value={editMember.emailAddress || ''}
            onChange={(e) => setEditMember({ ...editMember, emailAddress: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Gender"
            value={editMember.gender || ''}
            onChange={(e) => setEditMember({ ...editMember, gender: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Current Governorate"
            value={editMember.currentGovernorate || ''}
            onChange={(e) => setEditMember({ ...editMember, currentGovernorate: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Previous Governorate"
            value={editMember.previousGovernorate || ''}
            onChange={(e) => setEditMember({ ...editMember, previousGovernorate: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Street"
            value={editMember.street || ''}
            onChange={(e) => setEditMember({ ...editMember, street: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Building"
            value={editMember.building || ''}
            onChange={(e) => setEditMember({ ...editMember, building: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Floor"
            value={editMember.floor || ''}
            onChange={(e) => setEditMember({ ...editMember, floor: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Age Ranges"
            value={editMember.ageRanges.join(', ') || ''}
            onChange={(e) =>
              setEditMember({ ...editMember, ageRanges: e.target.value.split(', ') })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Special Needs"
            value={editMember.specialNeeds.join(', ') || ''}
            onChange={(e) =>
              setEditMember({ ...editMember, specialNeeds: e.target.value.split(', ') })
            }
            fullWidth
            margin="normal"
          />
          <TextField
            label="Immediate Needs"
            value={editMember.needs.join(', ') || ''}
            onChange={(e) => setEditMember({ ...editMember, needs: e.target.value.split(', ') })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Aid Urgency"
            value={editMember.aidUrgency || ''}
            onChange={(e) => setEditMember({ ...editMember, aidUrgency: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Comments"
            value={editMember.comments || ''}
            onChange={(e) => setEditMember({ ...editMember, comments: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Registration Date"
            value={editMember.registrationDate?.toDate().toLocaleDateString() || ''}
            fullWidth
            margin="normal"
            disabled
          />
          <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveEdit}
              sx={{ marginRight: '10px' }}
            >
              Save
            </Button>
            <Button variant="contained" color="secondary" onClick={handleModalClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={confirmDeleteOpen} onClose={handleConfirmDeleteClose}>
        <Box
          sx={{
            padding: 2,
            backgroundColor: 'white',
            borderRadius: 2,
            width: '300px',
            margin: 'auto',
            marginTop: '10%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6">Are you sure you want to delete this member?</Typography>
          <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              sx={{ marginRight: '10px' }}
            >
              Confirm
            </Button>
            <Button variant="contained" color="secondary" onClick={handleConfirmDeleteClose}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminSubmissions;
