'use client';

import { useState } from 'react';
import CategoryManagement from '@/app/components/reports/category-management';

export default function TestCategoryManagement() {
  const [userRole, setUserRole] = useState<'admin' | 'src' | 'student'>('admin');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management Test</h1>
          <p className="text-gray-600">Testing the new Category Management UI functionality</p>
        </div>

        {/* Role Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Different User Roles</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setUserRole('admin')}
              className={`px-4 py-2 rounded-lg font-medium ${
                userRole === 'admin' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Admin Role
            </button>
            <button
              onClick={() => setUserRole('src')}
              className={`px-4 py-2 rounded-lg font-medium ${
                userRole === 'src' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              SRC Role
            </button>
            <button
              onClick={() => setUserRole('student')}
              className={`px-4 py-2 rounded-lg font-medium ${
                userRole === 'student' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Student Role
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current Role: <span className="font-medium">{userRole}</span>
          </p>
        </div>

        {/* Category Management Component */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Management Component</h2>
          <CategoryManagement userRole={userRole} />
        </div>

        {/* Test Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Instructions</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ <strong>Admin Role:</strong> Full access to create, edit, delete categories</p>
            <p>✅ <strong>SRC Role:</strong> Full access to create, edit, delete categories</p>
            <p>❌ <strong>Student Role:</strong> No access - shows permission message</p>
            <p>✅ <strong>Features to Test:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Add new category with name, description, and color</li>
              <li>Edit existing category properties</li>
              <li>Toggle category active/inactive status</li>
              <li>Delete categories (only if not used by reports)</li>
              <li>Color picker and hex input validation</li>
              <li>Form validation and error handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
