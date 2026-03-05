import { useEffect, useMemo, useState } from 'react';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../../utils/cookies';
import type { MemberCase } from '@/services/memberCases';
import { listMemberPendingCases } from '@/services/memberCases';
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

interface FilterState {
  governorate: string;
  gender: string;
  urgency: string;
}

function Submissions() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<MemberCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    governorate: 'all',
    gender: 'all',
    urgency: 'all',
  });

  const userUid = auth.currentUser?.uid;

  useEffect(() => {
    const loadCases = async () => {
      if (!userUid) {
        navigate('/auth/login');
        return;
      }

      const role = getCookie('userRole');
      if (role !== 'member') {
        if (role === 'agent') {
          navigate('/agent/create');
          return;
        }

        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pendingCases = await listMemberPendingCases();
        setCases(pendingCases);
      } catch (loadError) {
        console.error('Error loading NGO cases:', loadError);
        setError('Your account is being verified or your case feed is unavailable right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, [navigate, userUid]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return cases.filter((memberCase) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [memberCase.fullName, memberCase.phoneNumber].some((field) =>
          (field ?? '').toLowerCase().includes(normalizedSearch),
        );
      const matchesGovernorate =
        filter.governorate === 'all' || memberCase.currentGovernorate === filter.governorate;
      const matchesGender = filter.gender === 'all' || memberCase.gender === filter.gender;
      const matchesUrgency = filter.urgency === 'all' || memberCase.aidUrgency === filter.urgency;

      return matchesSearch && matchesGovernorate && matchesGender && matchesUrgency;
    });
  }, [cases, filter.gender, filter.governorate, filter.urgency, searchQuery]);

  const downloadCSV = () => {
    const headers = [
      'Full Name',
      'Phone Number',
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
      'Status',
    ];

    const rows = filteredCases.map((memberCase) => [
      memberCase.fullName,
      memberCase.phoneNumber,
      memberCase.gender,
      memberCase.currentGovernorate,
      memberCase.previousGovernorate,
      memberCase.street,
      memberCase.building,
      memberCase.floor,
      JSON.stringify(memberCase.ageRanges),
      memberCase.specialNeeds.join(', '),
      memberCase.needs.join(', '),
      memberCase.aidUrgency,
      memberCase.comments,
      memberCase.registrationDate ? new Date(memberCase.registrationDate).toLocaleDateString() : '',
      memberCase.status,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ngo_case_feed.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pending Cases</h1>
        <Button className="bg-[#12a89d] hover:bg-[#0e9088] text-white" onClick={downloadCSV}>
          Download CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="flex-1 min-w-[200px] bg-gray-50 border-gray-200"
          />
          <Select
            value={filter.governorate}
            onValueChange={(value) => setFilter((current) => ({ ...current, governorate: value }))}
          >
            <SelectTrigger className="w-[150px] bg-gray-50 border-gray-200">
              <SelectValue placeholder="Governorate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Governorates</SelectItem>
              <SelectItem value="Beirut">Beirut</SelectItem>
              <SelectItem value="Mount Lebanon">Mount Lebanon</SelectItem>
              <SelectItem value="North Lebanon">North Lebanon</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.gender}
            onValueChange={(value) => setFilter((current) => ({ ...current, gender: value }))}
          >
            <SelectTrigger className="w-[120px] bg-gray-50 border-gray-200">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.urgency}
            onValueChange={(value) => setFilter((current) => ({ ...current, urgency: value }))}
          >
            <SelectTrigger className="w-[130px] bg-gray-50 border-gray-200">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Full Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Phone Number</TableHead>
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
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-gray-500">
                    Loading cases...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-gray-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-gray-500">
                    No matching cases found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((memberCase) => (
                  <TableRow key={memberCase.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{memberCase.fullName}</TableCell>
                    <TableCell>{memberCase.phoneNumber}</TableCell>
                    <TableCell>{memberCase.gender}</TableCell>
                    <TableCell>{memberCase.currentGovernorate}</TableCell>
                    <TableCell>{memberCase.previousGovernorate}</TableCell>
                    <TableCell>{memberCase.street}</TableCell>
                    <TableCell>{memberCase.building}</TableCell>
                    <TableCell>{memberCase.floor}</TableCell>
                    <TableCell className="text-xs">
                      {Object.entries(memberCase.ageRanges)
                        .filter(([, value]) => Number(value) > 0)
                        .map(([range, value]) => `${range}: ${value}`)
                        .join(', ') || '—'}
                    </TableCell>
                    <TableCell>{memberCase.specialNeeds.join(', ')}</TableCell>
                    <TableCell>{memberCase.needs.join(', ')}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          memberCase.aidUrgency === 'High'
                            ? 'bg-red-100 text-red-700'
                            : memberCase.aidUrgency === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {memberCase.aidUrgency}
                      </span>
                    </TableCell>
                    <TableCell>{memberCase.comments}</TableCell>
                    <TableCell>
                      {memberCase.registrationDate
                        ? new Date(memberCase.registrationDate).toLocaleDateString()
                        : ''}
                    </TableCell>
                    <TableCell className="capitalize">
                      {memberCase.status.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default Submissions;
