'use client';

import { AuthenticatedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { useSession } from '@/app/contexts/session-context';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AuthenticatedRoute>
      <DashboardContent />
    </AuthenticatedRoute>
  );
}

function DashboardContent() {
  const { user, profile } = useSession();

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2a6b39] mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your DWU SRC dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#359d49] mb-4">User Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900">{profile?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Student ID</label>
                <p className="text-gray-900">{profile?.student_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Role</label>
                <p className="text-gray-900 capitalize">{profile?.role}</p>
              </div>
              {profile?.department && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-900">{profile.department}</p>
                </div>
              )}
              {profile?.year_level && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Year Level</label>
                  <p className="text-gray-900">{profile.year_level}</p>
                </div>
              )}
              {profile?.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#359d49] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/news"
                className="block w-full text-left p-3 rounded-lg border border-[#359d49]/20 hover:bg-[#359d49]/5 transition-colors"
              >
                <div className="font-medium text-[#359d49]">View News & Announcements</div>
                <div className="text-sm text-gray-600">Stay updated with latest news</div>
              </a>
              <a
                href="/complaints"
                className="block w-full text-left p-3 rounded-lg border border-[#359d49]/20 hover:bg-[#359d49]/5 transition-colors"
              >
                <div className="font-medium text-[#359d49]">Submit Complaint</div>
                <div className="text-sm text-gray-600">Report issues or concerns</div>
              </a>
              <a
                href="/forum"
                className="block w-full text-left p-3 rounded-lg border border-[#359d49]/20 hover:bg-[#359d49]/5 transition-colors"
              >
                <div className="font-medium text-[#359d49]">Visit Forum</div>
                <div className="text-sm text-gray-600">Join student discussions</div>
              </a>
            </div>
          </div>

          {/* Role-Specific Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#359d49] mb-4">Role Features</h2>
            <div className="space-y-3">
              {profile?.role === 'student' && (
                <>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="font-medium text-blue-800">Student Features</div>
                    <div className="text-sm text-blue-600">Access to news, complaints, and forum</div>
                  </div>
                </>
              )}
              {profile?.role === 'src' && (
                <>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="font-medium text-purple-800">SRC Member Features</div>
                    <div className="text-sm text-purple-600">Manage complaints and announcements</div>
                  </div>
                  <a
                    href="/admin/complaints"
                    className="block w-full text-left p-3 rounded-lg border border-[#359d49]/20 hover:bg-[#359d49]/5 transition-colors"
                  >
                    <div className="font-medium text-[#359d49]">Manage Complaints</div>
                    <div className="text-sm text-gray-600">Review and respond to complaints</div>
                  </a>
                </>
              )}
              {profile?.role === 'admin' && (
                <>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="font-medium text-red-800">Admin Features</div>
                    <div className="text-sm text-red-600">Full system access and management</div>
                  </div>
                  <a
                    href="/admin"
                    className="block w-full text-left p-3 rounded-lg border border-[#359d49]/20 hover:bg-[#359d49]/5 transition-colors"
                  >
                    <div className="font-medium text-[#359d49]">Admin Panel</div>
                    <div className="text-sm text-gray-600">System administration</div>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Testing Links */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Testing & Development</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="/test-session"
              className="bg-[#359d49] text-white px-4 py-2 rounded hover:bg-[#2a6b39] transition-colors"
            >
              Session Test
            </a>
            <a
              href="/test-protected"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Protected Routes Test
            </a>
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Home Page
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 