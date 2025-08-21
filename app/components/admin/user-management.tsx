'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'src' | 'admin';
  src_department?: string;
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
            Total Users: {users.length}
          </div>
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

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
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
                      {user.src_department && (
                        <span>Department: {user.src_department}</span>
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
