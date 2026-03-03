import { useEffect, useState } from 'react';
import { List, Building2, Bell, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

function Dashboard() {
  const [submissions, setsubmissions] = useState(0);
  const [businesses, setBusinesses] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [averageRating] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
        setsubmissions(submissionsSnapshot.size);

        const businessesSnapshot = await getDocs(collection(db, 'businesses'));
        setBusinesses(businessesSnapshot.size);

        const requestsSnapshot = await getDocs(
          query(collection(db, 'requests'), where('status', '==', 'pending')),
        );
        setPendingRequests(requestsSnapshot.size);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="AdminDash">
      <div className="main__container">
        <div className="main__title">
          <div className="main__greeting">
            <h1>Hello,</h1>
            <p>Welcome to your admin dashboard</p>
          </div>
        </div>
        <div className="main__cards">
          <div className="card">
            <div className="card_inner">
              <div>
                <List />
                <p className="text-primary-p">Submissions</p>
              </div>
              <span className="font-bold text-title">{submissions}</span>
            </div>
          </div>

          <div className="card">
            <div className="card_inner">
              <div>
                <Building2 />
                <p className="text-primary-p">NGOs</p>
              </div>
              <span className="font-bold text-title">{businesses}</span>
            </div>
          </div>

          <div className="card">
            <div className="card_inner">
              <div>
                <Bell />
                <p className="text-primary-p">Pending NGO Requests</p>
              </div>
              <span className="font-bold text-title">{pendingRequests}</span>
            </div>
          </div>

          <div className="card">
            <div className="card_inner">
              <div>
                <MessageSquare />
                <p className="text-primary-p">Unread Feedback</p>
              </div>
              <span className="font-bold text-title">{averageRating}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
