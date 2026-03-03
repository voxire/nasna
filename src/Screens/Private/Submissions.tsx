import { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { SubmissionDocument } from '../../types';
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
  const [filter, setFilter] = useState<FilterState>({ governorate: '', gender: '', urgency: '' });

  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchMembers = async () => {
      if (!userUid) {
        navigate('/auth/login');
        return;
      }
      const role = localStorage.getItem('userRole');
      if (role !== 'member') {
        if (role === 'agent') { navigate('/agent/create'); return; }
        navigate('/');
        return;
      }
      const memberDoc = await getDoc(doc(db, 'members', userUid));
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        if (memberData['validated'] && auth.currentUser?.emailVerified) {
          setIsVerified(true);
          const snap = await getDocs(collection(db, 'submissions'));
          const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SubmissionDocument) }));
          setMembers(data);
          setFilteredMembers(data);
        }
      }
    };
    fetchMembers();
  }, [userUid, navigate]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);
    setFilteredMembers(
      members.filter((m) => [m.fullName, m.phoneNumber].some((f) => (f ?? '').toLowerCase().includes(q)))
    );
  };

  const applyFilters = () => {
    let filtered = members;
    if (filter.governorate) filtered = filtered.filter((m) => m.currentGovernorate === filter.governorate);
    if (filter.gender) filtered = filtered.filter((m) => m.gender === filter.gender);
    if (filter.urgency) filtered = filtered.filter((m) => m.aidUrgency === filter.urgency);
    setFilteredMembers(filtered);
  };

  const downloadCSV = () => {
    const headers = [
      'Full Name', 'Phone Number', 'Email Address', 'Gender', 'Current Governorate',
      'Previous Governorate', 'Street', 'Building', 'Floor', 'Age Ranges',
      'Special Needs', 'Immediate Needs', 'Aid Urgency', 'Comments', 'Registration Date',
    ];
    const rows = filteredMembers.map((m) => [
      m.fullName, m.phoneNumber, m.emailAddress, m.gender, m.currentGovernorate,
      m.previousGovernorate, m.street, m.building, m.floor, JSON.stringify(m.ageRanges),
      m.specialNeeds.join(', '), m.needs.join(', '), m.aidUrgency, m.comments,
      m.registrationDate?.toDate().toLocaleDateString() ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'members_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Members List</h1>
        <Button className="bg-[#12a89d] hover:bg-[#0e9088] text-white" onClick={downloadCSV}>Download CSV</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
          />
          <Select value={filter.governorate} onValueChange={(v) => setFilter((p) => ({ ...p, governorate: v }))}>
            <SelectTrigger className="w-[150px] bg-gray-50 border-gray-200"><SelectValue placeholder="Governorate" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Governorates</SelectItem>
              <SelectItem value="Beirut">Beirut</SelectItem>
              <SelectItem value="Mount Lebanon">Mount Lebanon</SelectItem>
              <SelectItem value="North">North</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.gender} onValueChange={(v) => setFilter((p) => ({ ...p, gender: v }))}>
            <SelectTrigger className="w-[120px] bg-gray-50 border-gray-200"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.urgency} onValueChange={(v) => setFilter((p) => ({ ...p, urgency: v }))}>
            <SelectTrigger className="w-[130px] bg-gray-50 border-gray-200"><SelectValue placeholder="Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-300" onClick={applyFilters}>Apply Filters</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Full Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Phone Number</TableHead>
                <TableHead className="font-semibold text-gray-700">Email Address</TableHead>
                <TableHead className="font-semibold text-gray-700">Gender</TableHead>
                <TableHead className="font-semibold text-gray-700">Current Governorate</TableHead>
                <TableHead className="font-semibold text-gray-700">Previous Governorate</TableHead>
                <TableHead className="font-semibold text-gray-700">Street</TableHead>
                <TableHead className="font-semibold text-gray-700">Building</TableHead>
                <TableHead className="font-semibold text-gray-700">Floor</TableHead>
                <TableHead className="font-semibold text-gray-700">Age Ranges</TableHead>
                <TableHead className="font-semibold text-gray-700">Special Needs</TableHead>
                <TableHead className="font-semibold text-gray-700">Immediate Needs</TableHead>
                <TableHead className="font-semibold text-gray-700">Aid Urgency</TableHead>
                <TableHead className="font-semibold text-gray-700">Comments</TableHead>
                <TableHead className="font-semibold text-gray-700">Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isVerified ? (
                filteredMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{member.fullName}</TableCell>
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
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.aidUrgency === 'High' ? 'bg-red-100 text-red-700' :
                        member.aidUrgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{member.aidUrgency}</span>
                    </TableCell>
                    <TableCell>{member.comments}</TableCell>
                    <TableCell>{member.registrationDate?.toDate().toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-gray-500">
                    Your account is being verified. Please check back later.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default Submissions;
