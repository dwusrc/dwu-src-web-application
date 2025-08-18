'use client';

import { useState, useEffect } from 'react';
import { SrcProjectWithRelations, ProjectStatus } from '@/types/supabase';
import SrcProjectForm from '@/app/components/forms/src-project-form';
import { SrcProjectFormData } from '@/types/supabase';

interface SrcProjectManagementProps {
  userDepartment: string;
}

export default function SrcProjectManagement({ userDepartment }: SrcProjectManagementProps) {
  const [projects, setProjects] = useState<SrcProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<SrcProjectWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, [selectedStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/src-projects';
      if (selectedStatus !== 'all') {
        url += `?status=${selectedStatus}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter projects by user's department
        const departmentProjects = data.projects.filter((project: SrcProjectWithRelations) => 
          project.department?.name === userDepartment
        );
        setProjects(departmentProjects);
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
        const result = await response.json();
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
        const result = await response.json();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {projects.map((project) => (
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
                          {project.approval_status === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending Approval
                            </span>
                          )}
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
                      {project.approval_status === 'approved' && (
                        <button
                          onClick={() => setEditingProject(project)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
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
      )}
    </div>
  );
}

