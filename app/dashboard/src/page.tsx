'use client';

import { PageLayout } from '@/app/components/layout/page-layout';
import { useSession } from '@/app/contexts/session-context';
import { SRCMemberRoute } from '@/app/components/auth/protected-route';

function SRCDashboardContent() {
  const { profile } = useSession();

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-[#2a6b39] mb-4">SRC Member Dashboard</h1>
        <p className="mb-4">Welcome, <span className="font-semibold">{profile?.full_name}</span>!</p>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-[#359d49]">This is the SRC member dashboard. You have access to SRC features.</p>
        </div>
      </div>
    </PageLayout>
  );
}

export default function SRCDashboard() {
  return (
    <SRCMemberRoute>
      <SRCDashboardContent />
    </SRCMemberRoute>
  );
} 