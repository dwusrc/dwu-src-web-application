'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { ReportFormData } from '@/types/supabase';
import ReportUploadForm from './report-upload-form';
import ReportsList from './reports-list';
import CategoryManagement from './category-management';

interface ReportsManagementProps {
  userRole: 'student' | 'src' | 'admin';
  userDepartment?: string;
}

export default function ReportsManagement({ userRole, userDepartment }: ReportsManagementProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'categories'>('reports');

  // Check if user can upload reports
  const canUploadReports = userRole === 'admin' || (userRole === 'src' && userDepartment === 'President');
  
  // Check if user can manage categories
  const canManageCategories = userRole === 'admin' || (userRole === 'src' && userDepartment === 'President');

  const handleUpload = async (formData: ReportFormData, file: File) => {
    try {
      setIsUploading(true);
      
      // Step 1: Get upload URL
      const uploadResponse = await fetch('/api/reports/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload URL error: ${uploadResponse.statusText}`);
      }

      const { signedUrl, path } = await uploadResponse.json();

      // Step 2: Upload file to Supabase Storage
      const uploadResult = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' }
      });

      if (!uploadResult.ok) {
        throw new Error('File upload failed');
      }

      // Step 3: Create report record
      const reportData = {
        ...formData,
        file_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reports/${path}`,
        file_name: file.name,
        file_size: file.size
      };

      const createResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create report');
      }

      // Success - close modal and refresh list
      setShowUploadModal(false);
      // The ReportsList component will refresh automatically due to key change
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Reports
          </button>
          {canManageCategories && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏷️ Categories
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'reports' && (
        <>
          {/* Reports List */}
          <ReportsList
            key={showUploadModal ? 'uploading' : 'normal'} // Force refresh after upload
            userRole={userRole}
            showUploadButton={canUploadReports}
            onUploadClick={() => setShowUploadModal(true)}
          />

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Upload New Report</h2>
                  <Button
                    onClick={() => setShowUploadModal(false)}
                    variant="ghost"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <ReportUploadForm
                    onSubmit={handleUpload}
                    onCancel={() => setShowUploadModal(false)}
                    isSubmitting={isUploading}
                    submitLabel="Upload Report"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <CategoryManagement userRole={userRole} />
      )}
    </div>
  );
}
