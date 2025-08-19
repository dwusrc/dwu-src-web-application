'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { SrcProjectWithRelations, ProjectStatus } from '@/types/supabase';

export default function SrcProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<SrcProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/src-projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'planning': return 'Planning';
      case 'in_progress': return 'In Progress';
      case 'on_hold': return 'On Hold';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49]"></div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The requested project could not be found.'}</p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              >
                Go Back
              </button>
            </div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-[#359d49] hover:text-[#2a6b39] font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Projects
              </button>
            </div>

            {/* Project Header */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: project.department?.color + '20',
                        color: project.department?.color
                      }}
                    >
                      {project.department?.name}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Project Progress</span>
                  <span className="font-semibold">{project.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#359d49] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Project Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>

              {/* Project Objectives */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Objectives</h2>
                <p className="text-gray-700 leading-relaxed">{project.objectives}</p>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Timeline Information */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
                <div className="space-y-4">
                  {project.start_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Start Date</p>
                        <p className="text-gray-600">{formatDate(project.start_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {project.target_finish_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Target Finish Date</p>
                        <p className="text-gray-600">{formatDate(project.target_finish_date)}</p>
                      </div>
                    </div>
                  )}

                  {project.actual_finish_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Actual Finish Date</p>
                        <p className="text-gray-600">{formatDate(project.actual_finish_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Details</h2>
                <div className="space-y-4">
                  {project.budget_allocated && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Budget Allocated</p>
                        <p className="text-gray-600">K{project.budget_allocated.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {project.budget_spent && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Budget Spent</p>
                        <p className="text-gray-600">K{project.budget_spent.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team Members */}
            {project.team_members && project.team_members.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
                <div className="flex flex-wrap gap-2">
                  {project.team_members.map((member, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Project Metadata */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-gray-900">{project.created_by_user?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created On</p>
                  <p className="text-gray-900">{formatDate(project.created_at)}</p>
                </div>
                {project.approved_by_user && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Approved By</p>
                    <p className="text-gray-900">{project.approved_by_user.full_name}</p>
                  </div>
                )}
                {project.approved_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Approved On</p>
                    <p className="text-gray-900">{formatDate(project.approved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}

