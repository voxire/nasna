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

interface AgentRow extends MemberDocument {
  id: string;
}

interface FilterState {
  validated: string;
}

function Agents() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ validated: '' });
  const [editAgent, setEditAgent] = useState<AgentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'members'));
      const agentsData = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as MemberDocument) }))
        .filter((agent) => agent.role === 'agent');

      setAgents(agentsData);
      setFilteredAgents(agentsData);
    } catch (error) {
      console.error('Error fetching agents: ', error);
      showSnackbar('Error fetching agents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = agents.filter((agent) =>
      [agent.name, agent.contactPersonName, agent.email].some((field) =>
        (field ?? '').toLowerCase().includes(query),
      ),
    );
    setFilteredAgents(filtered);
  };

  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));

    let filtered = agents;
    if (value) {
      filtered = agents.filter((agent) => String(agent.validated) === value);
    }
    setFilteredAgents(filtered);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this agent?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'members', id));
      showSnackbar('Agent deleted successfully.', 'success');
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent: ', error);
      showSnackbar('Error deleting agent. Please try again.', 'error');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { validated: true });
      showSnackbar('Agent validated successfully.', 'success');
      fetchAgents();
    } catch (error) {
      console.error('Error validating agent: ', error);
      showSnackbar('Error validating agent. Please try again.', 'error');
    }
  };

  const handleOpenModal = (agent: AgentRow) => {
    setEditAgent(agent);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditAgent(null);
    setModalOpen(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditAgent((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAgent) return;
    try {
      await updateDoc(doc(db, 'members', editAgent.id), { ...editAgent });
      showSnackbar('Agent updated successfully.', 'success');
      handleCloseModal();
      fetchAgents();
    } catch (error) {
      console.error('Error updating agent: ', error);
      showSnackbar('Error updating agent. Please try again.', 'error');
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Agent Members
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
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.contactPersonName}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.phoneNumber}</TableCell>
                  <TableCell>{agent.validated ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {!agent.validated && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleValidate(agent.id)}
                      >
                        Validate
                      </Button>
                    )}
                    {agent.validated && (
                      <>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleOpenModal(agent)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(agent.id)}
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
            Edit Agent
          </Typography>
          <form onSubmit={handleEditSubmit}>
            <TextField
              label="Name"
              name="name"
              value={editAgent?.name || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Contact Person"
              name="contactPersonName"
              value={editAgent?.contactPersonName || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              name="email"
              value={editAgent?.email || ''}
              onChange={handleEditChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={editAgent?.phoneNumber || ''}
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

export default Agents;
