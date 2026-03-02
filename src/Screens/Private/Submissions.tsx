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
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { SubmissionDocument } from '../../types';
import { SelectChangeEvent } from '@mui/material/Select';

interface SubmissionRow extends SubmissionDocument {
  id: string;
}

interface FilterState {
  governorate: string;
  gender: string;
  urgency: string;
}

function Submissions() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<SubmissionRow[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<SubmissionRow[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    governorate: '',
    gender: '',
    urgency: '',
  });

  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!userUid) {
        navigate('/auth/login');
        return;
      }

      const role = localStorage.getItem('userRole');
      if (role !== 'member') {
        if (role === 'agent') {
          navigate('/agent/create');
          return;
        }
        navigate('/');
        return;
      }

      const memberDoc = await getDoc(doc(db, 'members', userUid));
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();

        if (memberData['validated'] && auth.currentUser?.emailVerified) {
          setIsVerified(true);

          const membersSnapshot = await getDocs(collection(db, 'submissions'));
          const membersData = membersSnapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as SubmissionDocument),
          }));
          setMembers(membersData);
          setFilteredMembers(membersData);
        } else {
          setIsVerified(false);
        }
      }
    };

    fetchMembers();
  }, [userUid, navigate]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = members.filter((member) =>
      [member.fullName, member.phoneNumber].some((field) =>
        (field ?? '').toLowerCase().includes(query),
      ),
    );
    setFilteredMembers(filtered);
  };

  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    let filtered = members;

    if (filter.governorate) {
      filtered = filtered.filter((member) => member.currentGovernorate === filter.governorate);
    }
    if (filter.gender) {
      filtered = filtered.filter((member) => member.gender === filter.gender);
    }
    if (filter.urgency) {
      filtered = filtered.filter((member) => member.aidUrgency === filter.urgency);
    }

    setFilteredMembers(filtered);
  };

  const downloadCSV = () => {
    const csvRows: string[] = [];
    const headers = [
      'Full Name',
      'Phone Number',
      'Email Address',
      'Gender',
      'Current Governorate',
      'Previous Governorate',
      'Street',
      'Building',
      'Floor',
      'Age Ranges',
      'Special Needs',
      'Immediate Needs',
      'Aid Urgency',
      'Comments',
      'Registration Date',
    ];
    csvRows.push(headers.join(','));

    filteredMembers.forEach((member) => {
      const row = [
        member.fullName,
        member.phoneNumber,
        member.emailAddress,
        member.gender,
        member.currentGovernorate,
        member.previousGovernorate,
        member.street,
        member.building,
        member.floor,
        JSON.stringify(member.ageRanges),
        member.specialNeeds.join(', '),
        member.needs.join(', '),
        member.aidUrgency,
        member.comments,
        member.registrationDate?.toDate().toLocaleDateString() ?? '',
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'members_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Members List
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name, phone, or ID"
          fullWidth
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Governorate</InputLabel>
          <Select name="governorate" value={filter.governorate} onChange={handleFilterChange}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Beirut">Beirut</MenuItem>
            <MenuItem value="Mount Lebanon">Mount Lebanon</MenuItem>
            <MenuItem value="North">North</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Gender</InputLabel>
          <Select name="gender" value={filter.gender} onChange={handleFilterChange}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Aid Urgency</InputLabel>
          <Select name="urgency" value={filter.urgency} onChange={handleFilterChange}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={applyFilters}>
          Apply Filters
        </Button>

        <Button variant="contained" color="primary" onClick={downloadCSV}>
          Download CSV
        </Button>
      </Box>

      <TableContainer component={Paper}>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {isVerified ? (
              filteredMembers.map((member) => (
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
                  <TableCell>{JSON.stringify(member.ageRanges)}</TableCell>
                  <TableCell>{member.specialNeeds.join(', ')}</TableCell>
                  <TableCell>{member.needs.join(', ')}</TableCell>
                  <TableCell>{member.aidUrgency}</TableCell>
                  <TableCell>{member.comments}</TableCell>
                  <TableCell>{member.registrationDate?.toDate().toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={16} align="center">
                  Your account is being verified. Please check back later.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Submissions;
