'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'src' | 'admin';
  student_id: string | null;
  department: string | null;
  year_level: number | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface EditUserForm {
  full_name: string;
  email: string;
  role: 'student' | 'src' | 'admin';
  student_id: string;
  department: string;
  year_level: number;
  phone: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    full_name: '',
    email: '',
    role: 'student',
    student_id: '',
    department: '',
    year_level: 1,
    phone: '',
    is_active: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch users' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      student_id: user.student_id || '',
      department: user.department || '',
      year_level: user.year_level || 1,
      phone: user.phone || '',
      is_active: user.is_active,
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      full_name: '',
      email: '',
      role: 'student',
      student_id: '',
      department: '',
      year_level: 1,
      phone: '',
      is_active: true,
    });
    setShowDeleteConfirm(false);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value,
    }));
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          ...editForm,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'User updated successfully' });
        closeEditModal();
        fetchUsers(); // Refresh the user list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update user' });
    }
  };

  const deleteUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'User deleted successfully' });
        closeEditModal();
        fetchUsers(); // Refresh the user list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete user' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.student_id && user.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <PageLayout>
          <div className="flex h-screen items-center justify-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#359d49]"></div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <PageLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2a6b39]">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and system settings</p>
          </div>

          {message && (
            <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                />
              </div>
              <div className="sm:w-48">
                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role
                </label>
                <select
                  id="role-filter"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="src">SRC Members</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
              <p className="text-sm text-gray-600 mt-1">Total Users: {filteredUsers.length}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.student_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'src' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => openEditModal(user)}
                          className="bg-[#359d49] hover:bg-[#2a6b39] text-white text-xs px-3 py-1"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Edit User: {editingUser.full_name}</h3>
                </div>
                
                <form onSubmit={handleEditFormSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={editForm.full_name}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={editForm.role}
                        onChange={handleEditFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      >
                        <option value="student">Student</option>
                        <option value="src">SRC Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID
                      </label>
                      <input
                        type="text"
                        id="student_id"
                        name="student_id"
                        value={editForm.student_id}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={editForm.department}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="year_level" className="block text-sm font-medium text-gray-700 mb-1">
                        Year Level
                      </label>
                      <input
                        type="number"
                        id="year_level"
                        name="year_level"
                        min="1"
                        max="4"
                        value={editForm.year_level}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">
                        Account Status
                      </label>
                      <select
                        id="is_active"
                        name="is_active"
                        value={editForm.is_active.toString()}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        onClick={closeEditModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!showDeleteConfirm ? (
                        <Button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete User
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            onClick={deleteUser}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Confirm Delete
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 