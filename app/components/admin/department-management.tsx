'use client';

import { useState, useEffect } from 'react';

interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
  color: string;
}

interface DepartmentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState<{[key: string]: DepartmentUser[]}>({});
  const [showUsersModal, setShowUsersModal] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Fetch user counts for all departments when departments are loaded
    if (departments.length > 0) {
      departments.forEach(dept => {
        if (!departmentUsers[dept.id]) {
          fetchDepartmentUsers(dept.id);
        }
      });
    }
  }, [departments, departmentUsers]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (formData: DepartmentFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await response.json();
        alert('Department created successfully!');
        setShowCreateForm(false);
        fetchDepartments(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to create department: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (department: Department) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(department),
      });

      if (response.ok) {
        await response.json();
        alert('Department updated successfully!');
        setEditingDepartment(null);
        fetchDepartments(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to update department: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    // First, check if department has users
    try {
      const checkResponse = await fetch(`/api/admin/departments?id=${departmentId}`, {
        method: 'DELETE',
      });

      if (checkResponse.ok) {
        // No users, safe to delete
        if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
          alert('Department deleted successfully!');
          fetchDepartments(); // Refresh the list
        }
      } else {
        const errorData = await checkResponse.json();
        
                 if (errorData.users && errorData.users.length > 0) {
           // Show detailed warning with user information
           const userList = errorData.users.map((user: DepartmentUser) => 
             `• ${user.full_name} (${user.email})`
           ).join('\n');
          
          const warningMessage = `⚠️ WARNING: Cannot delete this department!\n\n` +
            `The following ${errorData.users.length} SRC member(s) are currently assigned to this department:\n\n` +
            `${userList}\n\n` +
            `To delete this department, you must first:\n` +
            `1. Reassign these users to a different department, OR\n` +
            `2. Deactivate these user accounts\n\n` +
            `Please handle the user assignments before attempting to delete the department.`;
          
          alert(warningMessage);
        } else {
          alert(`Failed to delete department: ${errorData.error}`);
        }
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department. Please try again.');
    }
  };

  const handleToggleStatus = async (department: Department) => {
    try {
      setIsSubmitting(true);

      const updatedDepartment = {
        ...department,
        is_active: !department.is_active
      };

      await handleUpdateDepartment(updatedDepartment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const fetchDepartmentUsers = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/admin/departments/${departmentId}/users`);

      if (response.ok) {
        const data = await response.json();
        setDepartmentUsers(prev => ({ ...prev, [departmentId]: data.users || [] }));
      } else {
        console.error('Failed to fetch department users');
        setDepartmentUsers(prev => ({ ...prev, [departmentId]: [] }));
      }
    } catch (error) {
      console.error('Error fetching department users:', error);
      setDepartmentUsers(prev => ({ ...prev, [departmentId]: [] }));
    }
  };

  const getDepartmentUserCount = (departmentId: string) => {
    return departmentUsers[departmentId]?.length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading departments</h3>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600">Manage SRC departments, colors, and descriptions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total Departments: {departments.length}
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:ring-offset-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Department
          </button>
        </div>
      </div>

      {/* Departments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {departments.map((department) => (
            <li key={department.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: department.color }}
                          >
                            <span className="text-white font-medium text-sm">
                              {department.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {department.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {department.description || 'No description'}
                          </p>
                        </div>
                      </div>
                                             <div className="flex items-center gap-2">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           department.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                         }`}>
                           {department.is_active ? 'Active' : 'Inactive'}
                         </span>
                         {getDepartmentUserCount(department.id) > 0 && (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                             {getDepartmentUserCount(department.id)} User(s)
                           </span>
                         )}
                         <div 
                           className="w-4 h-4 rounded-full border border-gray-300"
                           style={{ backgroundColor: department.color }}
                           title={`Color: ${department.color}`}
                         />
                       </div>
                    </div>
                    
                                         <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                       <span>Created: {formatDate(department.created_at)}</span>
                       <span>Color: {department.color}</span>
                       <button
                         onClick={() => {
                           if (!departmentUsers[department.id]) {
                             fetchDepartmentUsers(department.id);
                           }
                           setShowUsersModal(department.id);
                         }}
                         className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                       >
                         View Users ({getDepartmentUserCount(department.id)})
                       </button>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingDepartment(department)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(department)}
                      className={`text-sm font-medium ${
                        department.is_active 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {department.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department.id)}
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

      {/* Create Department Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Department</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <CreateDepartmentForm 
                onSubmit={handleCreateDepartment}
                onCancel={() => setShowCreateForm(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Department</h3>
                <button
                  onClick={() => setEditingDepartment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <EditDepartmentForm 
                department={editingDepartment}
                onSubmit={handleUpdateDepartment}
                onCancel={() => setEditingDepartment(null)}
                isSubmitting={isSubmitting}
                             />
             </div>
           </div>
         </div>
       )}

       {/* Users Modal */}
       {showUsersModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">
                   Department Users - {departments.find(d => d.id === showUsersModal)?.name}
                 </h3>
                 <button
                   onClick={() => setShowUsersModal(null)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               {departmentUsers[showUsersModal] && departmentUsers[showUsersModal].length > 0 ? (
                 <div className="space-y-4">
                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                     <div className="flex">
                       <div className="flex-shrink-0">
                         <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                         </svg>
                       </div>
                       <div className="ml-3">
                         <h3 className="text-sm font-medium text-yellow-800">
                           ⚠️ Cannot Delete Department
                         </h3>
                         <div className="mt-2 text-sm text-yellow-700">
                           <p>
                             This department has {departmentUsers[showUsersModal].length} active SRC member(s) assigned. 
                             You must reassign or deactivate these users before deleting the department.
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="bg-white border border-gray-200 rounded-lg">
                     <div className="px-4 py-3 border-b border-gray-200">
                       <h4 className="text-sm font-medium text-gray-900">Assigned Users</h4>
                     </div>
                     <ul className="divide-y divide-gray-200">
                       {departmentUsers[showUsersModal].map((user: DepartmentUser) => (
                         <li key={user.id} className="px-4 py-3">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                               <p className="text-sm text-gray-500">{user.email}</p>
                             </div>
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                               {user.role}
                             </span>
                           </div>
                         </li>
                       ))}
                     </ul>
                   </div>
                   
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <div className="flex">
                       <div className="flex-shrink-0">
                         <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                         </svg>
                       </div>
                       <div className="ml-3">
                         <h3 className="text-sm font-medium text-blue-800">Next Steps</h3>
                         <div className="mt-2 text-sm text-blue-700">
                           <p>
                             To delete this department, you must first:
                           </p>
                           <ul className="mt-2 list-disc list-inside space-y-1">
                             <li>Go to User Management and reassign these users to a different department</li>
                             <li>Or deactivate these user accounts if they are no longer needed</li>
                           </ul>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <div className="text-gray-400 mb-4">
                     <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                     </svg>
                   </div>
                   <h3 className="text-sm font-medium text-gray-900 mb-2">No Users Assigned</h3>
                   <p className="text-sm text-gray-500">
                     This department has no active SRC members assigned and can be safely deleted.
                   </p>
                 </div>
               )}
               
               <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => setShowUsersModal(null)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

interface CreateDepartmentFormProps {
  onSubmit: (formData: DepartmentFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function CreateDepartmentForm({ onSubmit, onCancel, isSubmitting }: CreateDepartmentFormProps) {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    color: '#359d49'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Department name is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          placeholder="Enter department name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          placeholder="Enter department description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            placeholder="#359d49"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#359d49] rounded-md hover:bg-[#2a6b39] disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Department'}
        </button>
      </div>
    </form>
  );
}

interface EditDepartmentFormProps {
  department: Department;
  onSubmit: (department: Department) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function EditDepartmentForm({ department, onSubmit, onCancel, isSubmitting }: EditDepartmentFormProps) {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: department.name,
    description: department.description,
    color: department.color
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Department name is required');
      return;
    }
    onSubmit({
      ...department,
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          placeholder="Enter department name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          placeholder="Enter department description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            placeholder="#359d49"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#359d49] rounded-md hover:bg-[#2a6b39] disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update Department'}
        </button>
      </div>
    </form>
  );
}
