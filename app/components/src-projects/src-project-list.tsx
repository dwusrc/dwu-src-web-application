'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SrcProjectWithRelations, ProjectStatus } from '@/types/supabase';

interface SrcProjectListProps {
  showCreateButton?: boolean;
  onCreateNew?: () => void;
}

export default function SrcProjectList({
  showCreateButton = false,
  onCreateNew
}: SrcProjectListProps) {
  const [projects, setProjects] = useState<SrcProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{id: string, name: string, color: string}>>([]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/src-projects';
      const params = new URLSearchParams();
      
      if (selectedDepartment !== 'all') {
        params.append('department', selectedDepartment);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
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
  }, [selectedDepartment, selectedStatus]);

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, [fetchProjects]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to truncate text to a safe word limit
  const truncateText = (text: string, wordLimit: number = 25) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Filter projects based on search query, department, and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.objectives.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.department?.name && project.department.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDepartment = selectedDepartment === 'all' || project.department_id === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">SRC Projects</h2>
          <p className="text-slate-600 text-sm sm:text-base">Track the progress of SRC initiatives and projects</p>
        </div>
        
        {showCreateButton && onCreateNew && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-[#359d49] to-[#2a6b39] text-white rounded-xl hover:from-[#2a6b39] hover:to-[#1e4d2e] focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:ring-offset-2 shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

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

        {/* Department and Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="department-filter" className="block text-sm font-semibold text-slate-700 mb-2">
              Department
            </label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-all duration-200 bg-white/80 backdrop-blur-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-semibold text-slate-700 mb-2">
              Status
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
          {(searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDepartment('all');
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
      {(searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all') && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center text-sm text-blue-800">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-medium">
              Showing {filteredProjects.length} of {projects.length} projects
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedDepartment !== 'all' && ` from ${departments.find(d => d.id === selectedDepartment)?.name} department`}
              {selectedStatus !== 'all' && ` with status "${selectedStatus}"`}
            </span>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-16 w-16 text-slate-300 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all' ? 'No projects match your search/filter' : 'No projects found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {searchQuery 
              ? `No projects found matching "${searchQuery}". Try adjusting your search terms.`
              : selectedDepartment !== 'all' || selectedStatus !== 'all' 
                ? 'Try adjusting your filters to see more projects.'
                : 'No SRC projects have been approved yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const statusConfig = getStatusColor(project.status);
            return (
            <div
              key={project.id}
                className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Project Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#359d49] transition-colors duration-200">
                      {project.title}
                    </h3>
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm"
                        style={{
                          backgroundColor: project.department?.color + '20',
                            color: project.department?.color,
                            borderColor: project.department?.color + '40'
                        }}
                      >
                        {project.department?.name}
                      </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          {statusConfig.icon}
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Description - Truncated */}
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                  {truncateText(project.description, 20)}
                </p>

                {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="font-semibold">{project.progress_percentage}%</span>
                  </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[#359d49] to-[#2a6b39] h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${project.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Details - Truncated */}
                  <div className="space-y-3 text-sm text-slate-600 mb-6">
                  {project.start_date && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                        </div>
                      <span>Started: {formatDate(project.start_date)}</span>
                    </div>
                  )}
                  
                  {project.target_finish_date && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                        </div>
                      <span>Target: {formatDate(project.target_finish_date)}</span>
                    </div>
                  )}

                  {project.budget_allocated && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                        </div>
                      <span>Budget: K{project.budget_allocated.toLocaleString()}</span>
                    </div>
                  )}

                  {project.team_members && project.team_members.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                        </div>
                      <span>{project.team_members.length} team member{project.team_members.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Read More Link */}
                  <div className="pt-4 border-t border-slate-200">
                  <Link
                    href={`/src-projects/${project.id}`}
                      className="inline-flex items-center text-[#359d49] hover:text-[#2a6b39] font-semibold text-sm transition-all duration-200 group/link"
                  >
                    Read More
                      <svg className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Created By */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Created by {project.created_by_user?.full_name}</span>
                    <span>{formatDate(project.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

