import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Modal,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { SelectChangeEvent } from '@mui/material/Select';
import { useSnackBar } from '../../Components/NasnaSnackBar';
import type { MemberDocument } from '../../types';

interface MemberRow extends MemberDocument {
  id: string;
}

interface FilterState {
  validated: string;
}

function Members() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ validated: '' });
  const [editMember, setEditMember] = useState<MemberRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'members'));
      const membersData = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as MemberDocument) }))
        .filter((member) => member.role === 'member');

      setMembers(membersData);
      setFilteredMembers(membersData);
    } catch (error) {
      console.error('Error fetching members: ', error);
      showSnackbar('Error fetching members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = members.filter((member) =>
      [member.name, member.contactPersonName, member.email].some((field) =>
        (field ?? '').toLowerCase().includes(query),
      ),
    );
    setFilteredMembers(filtered);
  };

  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));

    let filtered = members;
    if (value) {
      filtered = members.filter((member) => String(member.validated) === value);
    }
    setFilteredMembers(filtered);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this member?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'members', id));
      showSnackbar('Member deleted successfully.', 'success');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member: ', error);
      showSnackbar('Error deleting member. Please try again.', 'error');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { validated: true });
      showSnackbar('Member validated successfully.', 'success');
      fetchMembers();
    } catch (error) {
      console.error('Error validating member: ', error);
      showSnackbar('Error validating member. Please try again.', 'error');
    }
  };

  const handleOpenModal = (member: MemberRow) => {
    setEditMember(member);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditMember(null);
    setModalOpen(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditMember((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    try {
      await updateDoc(doc(db, 'members', editMember.id), { ...editMember });
      showSnackbar('Member updated successfully.', 'success');
      handleCloseModal();
      fetchMembers();
    } catch (error) {
      console.error('Error updating member: ', error);
      showSnackbar('Error updating member. Please try again.', 'error');
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        NGO Members
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by Name, Contact Person, or Email"
          fullWidth
        />

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Validated</InputLabel>
          <Select name="validated" value={filters.validated} onChange={handleFilterChange}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Validated</MenuItem>
            <MenuItem value="false">Not Validated</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Validated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.contactPersonName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phoneNumber}</TableCell>
                  <TableCell>{member.validated ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {!member.validated && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleValidate(member.id)}
                      >
                        Validate
                      </Button>
                    )}
                    {member.validated && (
                      <>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleOpenModal(member)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(member.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            maxWidth: 400,
            margin: 'auto',
            backgroundColor: '#fff',
            padding: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Member
          </Typography>
          <form onSubmit={handleEditSubmit}>
            <TextField
              label="Name"
              name="name"
              value={editMember?.name || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Contact Person"
              name="contactPersonName"
              value={editMember?.contactPersonName || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              name="email"
              value={editMember?.email || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={editMember?.phoneNumber || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </form>
        </Box>
      </Modal>
    </Box>
  );
}

export default Members;
