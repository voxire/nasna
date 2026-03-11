import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { auth, db } from '@/firebase';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { HousingDocument, HousingStatus } from '@/types';
import HousingCard from '@/Components/HousingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { toast } from 'sonner';

const housingStatusUpdateSchema = z.object({
  status: z.enum(['available', 'reserved', 'filled']),
});

interface HousingRow extends HousingDocument {
  id: string;
}

export default function HousingReview() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<HousingRow[]>([]);
  const [approved, setApproved] = useState<HousingRow[]>([]);

  useEffect(() => {
    const pendingQuery = query(
      collection(db, 'housing'),
      where('status', '==', 'pending_review'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );
    const approvedQuery = query(
      collection(db, 'housing'),
      where('status', 'in', ['available', 'reserved', 'filled']),
      orderBy('createdAt', 'desc'),
      limit(25),
    );

    const unsubPending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        setPending(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as HousingDocument) })));
      },
      (error) => {
        console.error('housing pending listener error:', error);
        toast.error(t('housing.admin.errorUpdate'));
      },
    );
    const unsubApproved = onSnapshot(
      approvedQuery,
      (snapshot) => {
        setApproved(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as HousingDocument) })));
      },
      (error) => {
        console.error('housing approved listener error:', error);
        toast.error(t('housing.admin.errorUpdate'));
      },
    );

    return () => {
      unsubPending();
      unsubApproved();
    };
  }, []);

  const approveListing = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error(t('common.notAuthenticated'));
      return;
    }
    try {
      await updateDoc(doc(db, 'housing', id), {
        status: 'available',
        approvedBy: uid,
        updatedAt: serverTimestamp(),
      });
      toast.success(t('housing.admin.approveSuccess'));
    } catch (error) {
      console.error('Failed to approve housing:', error);
      toast.error(t('housing.admin.errorUpdate'));
    }
  };

  const rejectListing = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'housing', id));
      toast.success(t('housing.admin.rejectSuccess'));
    } catch (error) {
      console.error('Failed to reject housing:', error);
      toast.error(t('housing.admin.errorUpdate'));
    }
  };

  const updateStatus = async (id: string, status: HousingStatus) => {
    const parsed = housingStatusUpdateSchema.safeParse({ status });
    if (!parsed.success) {
      toast.error(t('housing.admin.errorUpdate'));
      return;
    }
    try {
      await updateDoc(doc(db, 'housing', id), {
        status: parsed.data.status,
        updatedAt: serverTimestamp(),
      });
      toast.success(t('housing.admin.statusUpdated'));
    } catch (error) {
      console.error('Failed to update housing status:', error);
      toast.error(t('housing.admin.errorUpdate'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('housing.admin.title')}</h1>
        <p className="text-sm text-gray-500">{t('housing.admin.description')}</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {t('housing.admin.pendingReview')}
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">{t('housing.admin.approvedListings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {t('housing.admin.noPending')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pending.map((housing) => (
                <HousingCard
                  key={housing.id}
                  housing={housing}
                  showAdminFields
                  primaryAction={{
                    label: t('housing.admin.approve'),
                    onClick: () => void approveListing(housing.id),
                  }}
                  tertiaryAction={{
                    label: t('housing.admin.reject'),
                    onClick: () => void rejectListing(housing.id),
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approved.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              {t('housing.admin.noApproved')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approved.map((housing) => (
                <HousingCard
                  key={housing.id}
                  housing={housing}
                  showAdminFields
                  primaryAction={
                    housing.status === 'available'
                      ? {
                          label: t('housing.admin.markReserved'),
                          onClick: () => void updateStatus(housing.id, 'reserved'),
                        }
                      : housing.status === 'reserved'
                        ? {
                            label: t('housing.admin.markFilled'),
                            onClick: () => void updateStatus(housing.id, 'filled'),
                          }
                        : undefined
                  }
                  tertiaryAction={{
                    label: t('housing.admin.delete'),
                    onClick: () => void rejectListing(housing.id),
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
