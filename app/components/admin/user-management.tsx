'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'src' | 'admin';
  src_department?: string;
  department?: string;
  year_level?: number;
  student_id?: string;
  phone?: string;
  created_at: string;
  is_active: boolean;
}

interface Department {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface CreateUserFormProps {
  departments: Department[];
  onSubmit: (formData: {
    full_name: string;
    email: string;
    password: string;
    role: 'student' | 'src' | 'admin';
    student_id?: string;
    department?: string;
    year_level?: number;
    phone?: string;
    src_department?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [yearLevelFilter, setYearLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Bulk delete states
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteCriteria, setBulkDeleteCriteria] = useState({
    role: 'all',
    yearLevel: 'all',
    department: 'all',
    srcDepartment: 'all'
  });
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleUpdateRole = async (userId: string, role: Profile['role'], srcDepartment?: string) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role,
          src_department: srcDepartment
        }),
      });

      if (response.ok) {
        await response.json();
        alert('User role updated successfully!');
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to update user role: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isActive: !currentStatus
        }),
      });

      if (response.ok) {
        alert('User status updated successfully!');
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to update user status: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert('User deleted successfully!');
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to delete user: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm('Are you sure you want to delete all users matching these criteria? This action cannot be undone.')) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      
      // Get users matching the criteria
      const usersToDelete = filteredUsers.filter(user => {
        if (bulkDeleteCriteria.role !== 'all' && user.role !== bulkDeleteCriteria.role) {
          return false;
        }
        if (bulkDeleteCriteria.yearLevel !== 'all' && user.role === 'student') {
          if (user.year_level !== parseInt(bulkDeleteCriteria.yearLevel)) {
            return false;
          }
        }
        if (bulkDeleteCriteria.department !== 'all' && user.role === 'student') {
          if (user.department !== bulkDeleteCriteria.department) {
            return false;
          }
        }
        if (bulkDeleteCriteria.srcDepartment !== 'all' && user.role === 'src') {
          if (user.src_department !== bulkDeleteCriteria.srcDepartment) {
            return false;
          }
        }
        return true;
      });

      if (usersToDelete.length === 0) {
        alert('No users match the selected criteria.');
        return;
      }

      // Delete users one by one
      let deletedCount = 0;
      for (const user of usersToDelete) {
        try {
          const response = await fetch('/api/admin/users/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          });

          if (response.ok) {
            deletedCount++;
          }
        } catch (error) {
          console.error(`Error deleting user ${user.id}:`, error);
        }
      }

      alert(`Successfully deleted ${deletedCount} out of ${usersToDelete.length} users.`);
      setShowBulkDeleteModal(false);
      setBulkDeleteCriteria({
        role: 'all',
        yearLevel: 'all',
        department: 'all',
        srcDepartment: 'all'
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error during bulk delete:', error);
      alert('An error occurred during bulk delete. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getUsersMatchingCriteria = () => {
    return filteredUsers.filter(user => {
      if (bulkDeleteCriteria.role !== 'all' && user.role !== bulkDeleteCriteria.role) {
        return false;
      }
      if (bulkDeleteCriteria.yearLevel !== 'all' && user.role === 'student') {
        if (user.year_level !== parseInt(bulkDeleteCriteria.yearLevel)) {
          return false;
        }
      }
      if (bulkDeleteCriteria.department !== 'all' && user.role === 'student') {
        if (user.department !== bulkDeleteCriteria.department) {
          return false;
        }
      }
      if (bulkDeleteCriteria.srcDepartment !== 'all' && user.role === 'src') {
        if (user.src_department !== bulkDeleteCriteria.srcDepartment) {
          return false;
        }
      }
      return true;
    });
  };

  const handleCreateUser = async (formData: {
    full_name: string;
    email: string;
    password: string;
    role: 'student' | 'src' | 'admin';
    student_id?: string;
    department?: string;
    year_level?: number;
    phone?: string;
    src_department?: string;
  }) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'User created successfully!');
        setShowCreateForm(false);
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to create user: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'src': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter users based on selected filters and search query
  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchableFields = [
        user.full_name || '',
        user.email || '',
        user.student_id || '',
        user.department || '',
        user.src_department || '',
        user.phone || ''
      ];
      
      const hasMatch = searchableFields.some(field => 
        field.toLowerCase().includes(query)
      );
      
      if (!hasMatch) {
        return false;
      }
    }
    
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    // Year level filter (only apply to students)
    if (yearLevelFilter !== 'all' && user.role === 'student') {
      if (user.year_level !== parseInt(yearLevelFilter)) {
        return false;
      }
    }
    
    return true;
  });

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
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
                 <div className="flex items-center gap-4">
           <div className="text-sm text-gray-500">
             Total Users: {filteredUsers.length} of {users.length}
           </div>
           <button
             onClick={() => setShowBulkDeleteModal(true)}
             className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
           >
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
             Bulk Delete
           </button>
           <button
             onClick={() => setShowCreateForm(true)}
             className="inline-flex items-center px-4 py-2 bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:ring-offset-2"
           >
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
             </svg>
             Create User
           </button>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, student ID, department, phone..."
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Role Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] min-w-[140px]"
                >
                  <option value="all">All Types</option>
                  <option value="student">Students</option>
                  <option value="src">SRC Members</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              {/* Year Level Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Year Level</label>
                <select
                  value={yearLevelFilter}
                  onChange={(e) => setYearLevelFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] min-w-[140px]"
                >
                  <option value="all">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(roleFilter !== 'all' || yearLevelFilter !== 'all' || searchQuery.trim()) && (
              <button
                onClick={() => {
                  setRoleFilter('all');
                  setYearLevelFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.full_name || 'No Name'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.is_active)}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {formatDate(user.created_at)}</span>
                      {user.role === 'student' && user.department && (
                        <span>Department: {user.department}</span>
                      )}
                      {user.role === 'student' && user.year_level && (
                        <span>Year: {user.year_level}</span>
                      )}
                      {user.role === 'src' && user.src_department && (
                        <span>SRC Department: {user.src_department}</span>
                      )}
                      {user.student_id && (
                        <span>ID: {user.student_id}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className={`text-sm font-medium ${
                        user.is_active 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.full_name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'student' | 'src' | 'admin' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                  >
                    <option value="student">Student</option>
                    <option value="src">SRC Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                {editingUser.role === 'src' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SRC Department
                    </label>
                    <select
                      value={editingUser.src_department || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, src_department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateRole(
                    editingUser.id, 
                    editingUser.role, 
                    editingUser.role === 'src' ? editingUser.src_department : undefined
                  )}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#359d49] rounded-md hover:bg-[#2a6b39] disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Create User Modal */}
       {showCreateForm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                 <button
                   onClick={() => setShowCreateForm(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               <CreateUserForm 
                 departments={departments}
                 onSubmit={handleCreateUser}
                 onCancel={() => setShowCreateForm(false)}
                 isSubmitting={isSubmitting}
               />
             </div>
           </div>
         </div>
       )}

       {/* Bulk Delete Modal */}
       {showBulkDeleteModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
             <div className="p-6">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-semibold text-gray-900">Bulk Delete Users</h3>
                 <button
                   onClick={() => setShowBulkDeleteModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               <div className="mb-6">
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                   <div className="flex">
                     <div className="flex-shrink-0">
                       <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                       </svg>
                     </div>
                     <div className="ml-3">
                       <h3 className="text-sm font-medium text-red-800">Warning</h3>
                       <div className="mt-2 text-sm text-red-700">
                         <p>This action will permanently delete all users matching the selected criteria. This action cannot be undone.</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 <h4 className="text-lg font-medium text-gray-900 mb-4">Select Criteria for Bulk Delete</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Role Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                     <select
                       value={bulkDeleteCriteria.role}
                       onChange={(e) => setBulkDeleteCriteria(prev => ({ ...prev, role: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                     >
                       <option value="all">All Types</option>
                       <option value="student">Students</option>
                       <option value="src">SRC Members</option>
                       <option value="admin">Admins</option>
                     </select>
                   </div>

                   {/* Year Level Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                     <select
                       value={bulkDeleteCriteria.yearLevel}
                       onChange={(e) => setBulkDeleteCriteria(prev => ({ ...prev, yearLevel: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                     >
                       <option value="all">All Years</option>
                       <option value="1">Year 1</option>
                       <option value="2">Year 2</option>
                       <option value="3">Year 3</option>
                       <option value="4">Year 4</option>
                     </select>
                   </div>

                   {/* Department Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                     <select
                       value={bulkDeleteCriteria.department}
                       onChange={(e) => setBulkDeleteCriteria(prev => ({ ...prev, department: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                     >
                       <option value="all">All Departments</option>
                       {Array.from(new Set(users.filter(u => u.role === 'student' && u.department).map(u => u.department))).map(dept => (
                         <option key={dept} value={dept}>{dept}</option>
                       ))}
                     </select>
                   </div>

                   {/* SRC Department Filter */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">SRC Department</label>
                     <select
                       value={bulkDeleteCriteria.srcDepartment}
                       onChange={(e) => setBulkDeleteCriteria(prev => ({ ...prev, srcDepartment: e.target.value }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                     >
                       <option value="all">All SRC Departments</option>
                       {Array.from(new Set(users.filter(u => u.role === 'src' && u.src_department).map(u => u.src_department))).map(dept => (
                         <option key={dept} value={dept}>{dept}</option>
                       ))}
                     </select>
                   </div>
                 </div>

                 {/* Preview of users to be deleted */}
                 <div className="mt-6">
                   <h5 className="text-sm font-medium text-gray-700 mb-2">Users that will be deleted:</h5>
                   <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                     {getUsersMatchingCriteria().length > 0 ? (
                       <div className="text-sm text-gray-600">
                         <p className="font-medium">{getUsersMatchingCriteria().length} users match the criteria:</p>
                         <ul className="mt-2 space-y-1">
                           {getUsersMatchingCriteria().slice(0, 5).map(user => (
                             <li key={user.id} className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                               <span>{user.full_name} ({user.email})</span>
                             </li>
                           ))}
                           {getUsersMatchingCriteria().length > 5 && (
                             <li className="text-gray-500 italic">... and {getUsersMatchingCriteria().length - 5} more</li>
                           )}
                         </ul>
                       </div>
                     ) : (
                       <p className="text-gray-500 italic">No users match the selected criteria.</p>
                     )}
                   </div>
                 </div>
               </div>

               <div className="flex justify-end space-x-3">
                 <button
                   onClick={() => setShowBulkDeleteModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleBulkDelete}
                   disabled={isBulkDeleting || getUsersMatchingCriteria().length === 0}
                   className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isBulkDeleting ? 'Deleting...' : `Delete ${getUsersMatchingCriteria().length} Users`}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

function CreateUserForm({ departments, onSubmit, onCancel, isSubmitting }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'src' | 'admin',
    student_id: '',
    department: '',
    year_level: 1,
    phone: '',
    src_department: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on role
    if (formData.role === 'student') {
      if (!formData.student_id || !formData.department || !formData.year_level) {
        alert('Please fill in all required fields for students');
        return;
      }
    }
    
    if (formData.role === 'src' && !formData.src_department) {
      alert('Please select an SRC department');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            placeholder="Enter full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            placeholder="Enter email address"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            placeholder="Enter password"
            minLength={6}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            placeholder="Enter phone number"
          />
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          required
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
        >
          <option value="student">Student</option>
          <option value="src">SRC Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Student-specific fields */}
      {formData.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID *
            </label>
            <input
              type="text"
              required
              value={formData.student_id}
              onChange={(e) => handleInputChange('student_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              placeholder="Enter student ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              placeholder="e.g., Computer Science"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Level *
            </label>
            <select
              required
              value={formData.year_level}
              onChange={(e) => handleInputChange('year_level', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
          </div>
        </div>
      )}

      {/* SRC-specific fields */}
      {formData.role === 'src' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SRC Department *
          </label>
          <select
            required
            value={formData.src_department}
            onChange={(e) => handleInputChange('src_department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Form Actions */}
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
          {isSubmitting ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
