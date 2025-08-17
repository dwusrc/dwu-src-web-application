'use client';

import { useState } from 'react';
import SrcProjectForm from '@/app/components/forms/src-project-form';
import { SrcProjectFormData } from '@/types/supabase';

export default function TestSrcProjectsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SrcProjectFormData | null>(null);

  const handleSubmit = async (data: SrcProjectFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Form submitted with data:', data);
    setSubmittedData(data);
    setIsSubmitting(false);
    
    // Show success message
    alert('Project submitted successfully! Check console for data.');
  };

  const handleCancel = () => {
    alert('Form cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🧪 SRC Projects - Phase 1 Testing
        </h1>
        
        {submittedData ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              ✅ Form Submitted Successfully!
            </h2>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
            <button
              onClick={() => setSubmittedData(null)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Again
            </button>
          </div>
        ) : (
          <SrcProjectForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitLabel="Submit Test Project"
          />
        )}
      </div>
    </div>
  );
}
