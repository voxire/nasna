import { useEffect, useState } from 'react';
import { List, Building2, Bell, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/Components/ui/card';
import { auth } from '../../firebase';

const STATS = [
  { label: 'Submissions', icon: List, key: 'submissions' },
  { label: 'NGOs', icon: Building2, key: 'businesses' },
  { label: 'Pending NGO Requests', icon: Bell, key: 'pendingRequests' },
  { label: 'Unread Feedback', icon: MessageSquare, key: 'feedback' },
] as const;

function Dashboard() {
  const [counts, setCounts] = useState({ submissions: 0, businesses: 0, pendingRequests: 0, feedback: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsSnap, businessesSnap, requestsSnap, feedbackSnap] = await Promise.all([
          getDocs(collection(db, 'submissions')),
          getDocs(collection(db, 'businesses')),
          getDocs(query(collection(db, 'requests'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'feedback'), where('read', '==', false))),
        ]);
        setCounts({
          submissions: submissionsSnap.size,
          businesses: businessesSnap.size,
          pendingRequests: requestsSnap.size,
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
        <h1 className="text-2xl font-bold text-gray-900">Hello,</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {auth.currentUser?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon, key }) => (
          <Card key={key} className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{counts[key]}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
