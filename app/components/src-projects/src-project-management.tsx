'use client';

import { useState, useEffect } from 'react';
import { SrcProjectWithRelations, ProjectStatus, ApprovalStatus } from '@/types/supabase';
import SrcProjectForm from '@/app/components/forms/src-project-form';
import { SrcProjectFormData } from '@/types/supabase';

interface SrcProjectManagementProps {
  userDepartment: string;
}

interface ProjectSummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function SrcProjectManagement({ userDepartment }: SrcProjectManagementProps) {
  const [projects, setProjects] = useState<SrcProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<SrcProjectWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [projectSummary, setProjectSummary] = useState<ProjectSummary>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchProjects();
  }, [selectedStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new SRC-specific endpoint that shows all projects including pending
      let url = '/api/src-projects/src';
      if (selectedStatus !== 'all') {
        url += `?status=${selectedStatus}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        setProjectSummary(data.summary || {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: 0
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: SrcProjectFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/src-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Project created successfully and pending approval!');
        setShowCreateForm(false);
        fetchProjects(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to create project: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (data: SrcProjectFormData) => {
    if (!editingProject) return;

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/src-projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Project updated successfully!');
        setEditingProject(null);
        fetchProjects(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to update project: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/src-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Project deleted successfully!');
        fetchProjects(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to delete project: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
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

  const getApprovalStatusColor = (approvalStatus: ApprovalStatus) => {
    switch (approvalStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusLabel = (approvalStatus: ApprovalStatus) => {
    switch (approvalStatus) {
      case 'pending': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return approvalStatus;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <SrcProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={isSubmitting}
          submitLabel="Create Project"
        />
      </div>
    );
  }

  if (editingProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
          <button
            onClick={() => setEditingProject(null)}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <SrcProjectForm
          onSubmit={handleUpdateProject}
          onCancel={() => setEditingProject(null)}
          isSubmitting={isSubmitting}
          submitLabel="Update Project"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage SRC Projects</h2>
          <p className="text-gray-600">Create and manage projects for {userDepartment} department</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:ring-offset-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Project Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{projectSummary.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{projectSummary.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{projectSummary.rejected}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{projectSummary.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      {projectSummary.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⏳ Pending Approval ({projectSummary.pending} project{projectSummary.pending !== 1 ? 's' : ''})
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You have {projectSummary.pending} project{projectSummary.pending !== 1 ? 's' : ''} waiting for admin approval. 
                These will appear in the list below once approved.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="w-full sm:w-64">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStatus !== 'all' 
              ? 'Try adjusting your status filter to see more projects.'
              : 'Get started by creating your first project!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Projects by Approval Status */}
          {projectSummary.pending > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="text-yellow-600 mr-2">⏳</span>
                Pending Approval ({projectSummary.pending})
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-yellow-200">
                  {projects
                    .filter(project => project.approval_status === 'pending')
                    .map((project) => (
                      <li key={project.id}>
                        <div className="px-4 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {project.title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                    {getStatusLabel(project.status)}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(project.approval_status)}`}>
                                    {getApprovalStatusLabel(project.approval_status)}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {project.description}
                              </p>
                              
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span>Progress: {project.progress_percentage}%</span>
                                {project.start_date && (
                                  <span>Started: {formatDate(project.start_date)}</span>
                                )}
                                {project.target_finish_date && (
                                  <span>Target: {formatDate(project.target_finish_date)}</span>
                                )}
                                {project.budget_allocated && (
                                  <span>Budget: K{project.budget_allocated.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {/* Approved Projects */}
          {projectSummary.approved > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                Approved Projects ({projectSummary.approved})
              </h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {projects
                    .filter(project => project.approval_status === 'approved')
                    .map((project) => (
                      <li key={project.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-[#359d49] truncate">
                                  {project.title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                    {getStatusLabel(project.status)}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(project.approval_status)}`}>
                                    {getApprovalStatusLabel(project.approval_status)}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {project.description}
                              </p>
                              
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span>Progress: {project.progress_percentage}%</span>
                                {project.start_date && (
                                  <span>Started: {formatDate(project.start_date)}</span>
                                )}
                                {project.target_finish_date && (
                                  <span>Target: {formatDate(project.target_finish_date)}</span>
                                )}
                                {project.budget_allocated && (
                                  <span>Budget: K{project.budget_allocated.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => setEditingProject(project)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {/* Rejected Projects */}
          {projectSummary.rejected > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                Rejected Projects ({projectSummary.rejected})
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-red-200">
                  {projects
                    .filter(project => project.approval_status === 'rejected')
                    .map((project) => (
                      <li key={project.id}>
                        <div className="px-4 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {project.title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                    {getStatusLabel(project.status)}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(project.approval_status)}`}>
                                    {getApprovalStatusLabel(project.approval_status)}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {project.description}
                              </p>
                              
                              {project.rejection_reason && (
                                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                                  <strong>Rejection Reason:</strong> {project.rejection_reason}
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span>Progress: {project.progress_percentage}%</span>
                                {project.start_date && (
                                  <span>Started: {formatDate(project.start_date)}</span>
                                )}
                                {project.target_finish_date && (
                                  <span>Target: {formatDate(project.target_finish_date)}</span>
                                )}
                                {project.budget_allocated && (
                                  <span>Budget: K{project.budget_allocated.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

