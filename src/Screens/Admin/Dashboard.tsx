import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Building2, Bell, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/Components/ui/card';

function Dashboard() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({ submissions: 0, ngoCount: 0, pendingNgo: 0, feedback: 0 });

  const STATS = [
    { id: 'submissions', label: t('admin.dashboard.submissions'), icon: List, key: 'submissions' as const },
    { id: 'ngoCount', label: t('admin.dashboard.validatedNgos'), icon: Building2, key: 'ngoCount' as const },
    { id: 'pendingNgo', label: t('admin.dashboard.pendingApprovals'), icon: Bell, key: 'pendingNgo' as const },
    { id: 'feedback', label: t('admin.dashboard.unreadFeedback'), icon: MessageSquare, key: 'feedback' as const },
  ];

  useEffect(() => {
    const subscriptions = [
      onSnapshot(collection(db, 'submissions'), (snapshot) => {
        setCounts((current) => ({ ...current, submissions: snapshot.size }));
      }),
      onSnapshot(
        query(
          collection(db, 'members'),
          where('role', '==', 'member'),
          where('validated', '==', true),
        ),
        (snapshot) => {
          setCounts((current) => ({ ...current, ngoCount: snapshot.size }));
        },
      ),
      onSnapshot(
        query(
          collection(db, 'members'),
          where('role', '==', 'member'),
          where('validated', '==', false),
        ),
        (snapshot) => {
          setCounts((current) => ({ ...current, pendingNgo: snapshot.size }));
        },
      ),
      onSnapshot(query(collection(db, 'feedback'), where('read', '==', false)), (snapshot) => {
        setCounts((current) => ({ ...current, feedback: snapshot.size }));
      }),
    ];

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ id, label, icon: Icon, key }) => (
          <Card key={id}>
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
