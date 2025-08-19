'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Report, ReportFormData } from '@/types/supabase';

export default function TestReportsPage() {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    description: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    visibility: ['src', 'student']
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({ email: session.user.email!, id: session.user.id });
          fetchReports();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setReports([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUser = async () => {
    try {
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email) {
        setUser({ email: session.user.email, id: session.user.id });
        fetchReports();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        setMessage(`Error fetching reports: ${response.statusText}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      setMessage('Please select a PDF file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Step 1: Get upload URL
      const uploadResponse = await fetch('/api/reports/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type
        })
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload URL error: ${uploadResponse.statusText}`);
      }

      const { signedUrl, path } = await uploadResponse.json();

      // Step 2: Upload file to Supabase Storage
      const uploadResult = await fetch(signedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': 'application/pdf' }
      });

      if (!uploadResult.ok) {
        throw new Error('File upload failed');
      }

      // Step 3: Create report record
      const reportData = {
        ...formData,
        file_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reports/${path}`,
        file_name: selectedFile.name,
        file_size: selectedFile.size
      };

      const createResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (createResponse.ok) {
        setMessage('Report created successfully!');
        setFormData({
          title: '',
          description: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          visibility: ['src', 'student']
        });
        setSelectedFile(null);
        fetchReports();
      } else {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create report');
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        // Create a download link
        const link = document.createElement('a');
        link.href = data.file_url;
        link.download = data.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessage('Download started!');
        fetchReports(); // Refresh to get updated download count
      } else {
        setMessage('Download failed');
      }
    } catch (error) {
      setMessage(`Download error: ${error}`);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('Report deleted successfully!');
        fetchReports();
      } else {
        setMessage('Delete failed');
      }
    } catch (error) {
      setMessage(`Delete error: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Reports API</h1>
        <p>Please log in to test the reports API.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Reports API</h1>
      
      {/* User Info */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload New Report</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month *</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
                required
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(2000, i).toLocaleDateString('en-US', {month: 'long'})}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Year *</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
                required
              >
                {Array.from({length: 11}, (_, i) => (
                  <option key={2020 + i} value={2020 + i}>
                    {2020 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Visibility *</label>
            <div className="space-y-2">
              {['src', 'student'].map(vis => (
                <label key={vis} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.visibility.includes(vis)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          visibility: [...formData.visibility, vis]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          visibility: formData.visibility.filter(v => v !== vis)
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  {vis.charAt(0).toUpperCase() + vis.slice(1)} Dashboard
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">PDF File *</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Report'}
          </button>
        </form>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Reports List</h2>
        {reports.length === 0 ? (
          <p className="text-gray-500">No reports found.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{report.title}</h3>
                    {report.description && (
                      <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                      <span>{report.month}/{report.year}</span>
                      <span>Downloads: {report.download_count || 0}</span>
                      <span>Visibility: {report.visibility.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(report.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
