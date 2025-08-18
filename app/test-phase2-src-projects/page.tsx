'use client';

import { useState } from 'react';
import SrcProjectList from '@/app/components/src-projects/src-project-list';
import SrcProjectManagement from '@/app/components/src-projects/src-project-management';
import AdminProjectApproval from '@/app/components/src-projects/admin-project-approval';
import SrcProjectForm from '@/app/components/forms/src-project-form';
import { SrcProjectFormData } from '@/types/supabase';

export default function TestPhase2SrcProjectsPage() {
  const [activeComponent, setActiveComponent] = useState<'list' | 'management' | 'admin'>('list');
  const [userRole, setUserRole] = useState<'student' | 'src' | 'admin'>('student');
  const [userDepartment, setUserDepartment] = useState<string>('Academic Affairs');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const components = {
    list: 'SRC Project List (Student View)',
    management: 'SRC Project Management (SRC View)',
    admin: 'Admin Project Approval (Admin View)'
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
        // Refresh the current component if it's project management
        if (activeComponent === 'management') {
          // Force a refresh by toggling the component
          setActiveComponent('list');
          setTimeout(() => setActiveComponent('management'), 100);
        }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🧪 Phase 2 Testing - SRC Projects Components
        </h1>
        
        {/* Component Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as 'student' | 'src' | 'admin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              >
                <option value="student">Student</option>
                <option value="src">SRC Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* User Department Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Department
              </label>
              <select
                value={userDepartment}
                onChange={(e) => setUserDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              >
                <option value="Academic Affairs">Academic Affairs</option>
                <option value="Student Welfare">Student Welfare</option>
                <option value="Sports and Recreation">Sports and Recreation</option>
                <option value="Finance">Finance</option>
                <option value="President">President</option>
              </select>
            </div>

            {/* Component Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component to Test
              </label>
              <select
                value={activeComponent}
                onChange={(e) => setActiveComponent(e.target.value as 'list' | 'management' | 'admin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              >
                <option value="list">Project List</option>
                <option value="management">Project Management</option>
                <option value="admin">Admin Approval</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Current Test Configuration:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Role:</strong> {userRole}</p>
              <p><strong>Department:</strong> {userDepartment}</p>
              <p><strong>Component:</strong> {components[activeComponent]}</p>
            </div>
          </div>

          {/* Quick Actions */}
          {userRole === 'src' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-2">Quick Actions for SRC Members:</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  🚀 Create New Project
                </button>
                <button
                  onClick={() => setActiveComponent('management')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  📋 Switch to Project Management
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Creation Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Create New SRC Project</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
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
            </div>
          </div>
        )}

        {/* Component Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {components[activeComponent]}
            </h2>
            <p className="text-gray-600">
              Testing the {activeComponent} component with {userRole} role and {userDepartment} department
            </p>
          </div>

          {/* Component Rendering */}
          <div className="border-t border-gray-200 pt-6">
            {activeComponent === 'list' && (
              <SrcProjectList
                userRole={userRole}
                userDepartment={userDepartment}
                showCreateButton={userRole === 'src'}
                onCreateNew={() => setShowCreateForm(true)}
              />
            )}

            {activeComponent === 'management' && userRole === 'src' && (
              <SrcProjectManagement userDepartment={userDepartment} />
            )}

            {activeComponent === 'management' && userRole !== 'src' && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This component is only available to SRC members. Please change your role to &quot;SRC Member&quot; to test this component.
                </p>
              </div>
            )}

            {activeComponent === 'admin' && userRole === 'admin' && (
              <AdminProjectApproval />
            )}

            {activeComponent === 'admin' && userRole !== 'admin' && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This component is only available to Admins. Please change your role to &quot;Admin&quot; to test this component.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Testing Instructions
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Project List:</strong> Test viewing projects, filtering by department/status, and responsive design</li>
                  <li><strong>Project Management:</strong> Test creating, editing, and deleting projects (SRC role only)</li>
                  <li><strong>Admin Approval:</strong> Test approving, rejecting, and managing projects (Admin role only)</li>
                  <li><strong>Quick Project Creation:</strong> Use the &quot;Create New Project&quot; button above for quick testing</li>
                  <li>Switch between different user roles and departments to test access control</li>
                  <li>Check browser console for any errors or API responses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
