'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectSummary, setProjectSummary] = useState<ProjectSummary>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });



  const fetchProjects = useCallback(async () => {
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
  }, [selectedStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  const handleApproveProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to approve this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/src-projects/${projectId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Project approved successfully!');
        fetchProjects(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to approve project: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error approving project:', error);
      alert('Failed to approve project. Please try again.');
    }
  };

  const handleRejectProject = async (projectId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      alert('Rejection reason is required');
      return;
    }

    if (!confirm('Are you sure you want to reject this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/src-projects/${projectId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (response.ok) {
        alert('Project rejected successfully!');
        fetchProjects(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to reject project: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('Failed to reject project. Please try again.');
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started': 
        return { 
          bg: 'bg-slate-50', 
          text: 'text-slate-700', 
          border: 'border-slate-200',
          icon: '⏸️'
        };
      case 'planning': 
        return { 
          bg: 'bg-blue-50', 
          text: 'text-blue-700', 
          border: 'border-blue-200',
          icon: '📋'
        };
      case 'in_progress': 
        return { 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          border: 'border-amber-200',
          icon: '🚀'
        };
      case 'on_hold': 
        return { 
          bg: 'bg-orange-50', 
          text: 'text-orange-700', 
          border: 'border-orange-200',
          icon: '⏸️'
        };
      case 'completed': 
        return { 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-emerald-200',
          icon: '✅'
        };
      case 'cancelled': 
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-700', 
          border: 'border-red-200',
          icon: '❌'
        };
      default: 
        return { 
          bg: 'bg-slate-50', 
          text: 'text-slate-700', 
          border: 'border-slate-200',
          icon: '❓'
        };
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
      case 'pending': 
        return { 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          border: 'border-amber-200',
          icon: '⏳'
        };
      case 'approved': 
        return { 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-emerald-200',
          icon: '✅'
        };
      case 'rejected': 
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-700', 
          border: 'border-red-200',
          icon: '❌'
        };
      default: 
        return { 
          bg: 'bg-slate-50', 
          text: 'text-slate-700', 
          border: 'border-slate-200',
          icon: '❓'
        };
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

  // Filter projects based on search query and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.objectives.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.department?.name && project.department.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

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
                     initialData={{
             title: editingProject.title,
             description: editingProject.description,
             objectives: editingProject.objectives,
             start_date: editingProject.start_date || '',
             target_finish_date: editingProject.target_finish_date || '',
             budget_allocated: editingProject.budget_allocated,
             team_members: editingProject.team_members || [],
             progress_percentage: editingProject.progress_percentage,
             status: editingProject.status
           }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Manage SRC Projects</h2>
          <p className="text-slate-600 text-sm sm:text-base">Create and manage projects for {userDepartment} department</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-[#359d49] to-[#2a6b39] text-white rounded-xl hover:from-[#2a6b39] hover:to-[#1e4d2e] focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:ring-offset-2 shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Project Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-slate-600">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-600">{projectSummary.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{projectSummary.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-slate-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{projectSummary.rejected}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-slate-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{projectSummary.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      {projectSummary.pending > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-amber-100 rounded-xl border border-amber-200">
                <svg className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-800 mb-2">
                ⏳ Pending Approval ({projectSummary.pending} project{projectSummary.pending !== 1 ? 's' : ''})
              </h3>
              <div className="text-sm text-amber-700">
                <p>You have {projectSummary.pending} project{projectSummary.pending !== 1 ? 's' : ''} waiting for admin approval. 
                These will appear in the list below once approved.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="w-full">
          <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">
            Search Projects
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, objectives, or department..."
              className="w-full pl-12 pr-12 py-3 border-0 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:bg-white text-base transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors duration-200"
                title="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-semibold text-slate-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-all duration-200 bg-white/80 backdrop-blur-sm"
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

          {/* Reset Filters Button */}
          {(searchQuery || selectedStatus !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                }}
                className="w-full px-4 py-3 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#359d49] transition-all duration-200 bg-white/80 backdrop-blur-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Counter */}
      {(searchQuery || selectedStatus !== 'all') && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center text-sm text-blue-800">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-medium">
              Showing {filteredProjects.length} of {projects.length} projects
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedStatus !== 'all' && ` with status "${selectedStatus}"`}
            </span>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-800">Error loading projects</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-16 w-16 text-slate-300 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery || selectedStatus !== 'all' ? 'No projects match your search/filter' : 'No projects found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {searchQuery 
              ? `No projects found matching "${searchQuery}". Try adjusting your search terms.`
              : selectedStatus !== 'all' 
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
                                     {filteredProjects
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
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status).bg} ${getStatusColor(project.status).border}`}>
                                   {getStatusLabel(project.status)}
                                 </span>
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(project.approval_status).bg} ${getApprovalStatusColor(project.approval_status).border}`}>
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
                               {userDepartment === 'President' && (
                                 <>
                                   <button
                                     onClick={() => handleApproveProject(project.id)}
                                     className="text-green-600 hover:text-green-800 text-sm font-medium"
                                   >
                                     Approve
                                   </button>
                                   <button
                                     onClick={() => handleRejectProject(project.id)}
                                     className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                   >
                                     Reject
                                   </button>
                                 </>
                               )}
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
                                     {filteredProjects
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status).bg} ${getStatusColor(project.status).border}`}>
                            {getStatusLabel(project.status)}
                          </span>
                                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(project.approval_status).bg} ${getApprovalStatusColor(project.approval_status).border}`}>
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
                   {filteredProjects
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
                                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status).bg} ${getStatusColor(project.status).border}`}>
                                     {getStatusLabel(project.status)}
                                   </span>
                                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(project.approval_status).bg} ${getApprovalStatusColor(project.approval_status).border}`}>
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

