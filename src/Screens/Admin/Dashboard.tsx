import { useEffect, useState } from 'react';
import { List, Building2, Bell, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/Components/ui/card';

const STATS = [
  { label: 'Submissions', icon: List, key: 'submissions' as const },
  { label: 'Validated NGOs', icon: Building2, key: 'ngoCount' as const },
  { label: 'Pending NGO Approvals', icon: Bell, key: 'pendingNgo' as const },
  { label: 'Unread Feedback', icon: MessageSquare, key: 'feedback' as const },
];

function Dashboard() {
  const [counts, setCounts] = useState({ submissions: 0, ngoCount: 0, pendingNgo: 0, feedback: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsSnap, ngoSnap, pendingSnap, feedbackSnap] = await Promise.all([
          getDocs(collection(db, 'submissions')),
          getDocs(query(collection(db, 'members'), where('role', '==', 'member'), where('validated', '==', true))),
          getDocs(query(collection(db, 'members'), where('role', '==', 'member'), where('validated', '==', false))),
          getDocs(query(collection(db, 'feedback'), where('read', '==', false))),
        ]);
        setCounts({
          submissions: submissionsSnap.size,
          ngoCount: ngoSnap.size,
          pendingNgo: pendingSnap.size,
          feedback: feedbackSnap.size,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome to your admin panel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon, key }) => (
          <Card key={key}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                </div>
                <span className="text-2xl font-bold">{counts[key]}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
