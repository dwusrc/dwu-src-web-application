'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { ComplaintCategory, ComplaintPriority } from '@/types/supabase';

interface ComplaintFormData {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
}

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ComplaintFormData>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const CATEGORIES: { value: ComplaintCategory; label: string; description: string }[] = [
  { value: 'academic', label: 'Academic', description: 'Course-related issues, grades, faculty concerns' },
  { value: 'facilities', label: 'Facilities', description: 'Building maintenance, equipment, infrastructure' },
  { value: 'security', label: 'Security', description: 'Safety concerns, access issues, security incidents' },
  { value: 'health', label: 'Health', description: 'Medical services, wellness, health-related concerns' },
  { value: 'transport', label: 'Transport', description: 'Transportation, parking, shuttle services' },
  { value: 'other', label: 'Other', description: 'Other concerns not covered above' },
];

const PRIORITIES: { value: ComplaintPriority; label: string; color: string; description: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', description: 'Minor issue, not urgent' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', description: 'Moderate concern' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', description: 'Important issue' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', description: 'Critical issue requiring immediate attention' },
];

export default function ComplaintForm({
  onSubmit,
  onCancel,
  initialData = {},
  isSubmitting = false,
  submitLabel = 'Submit Complaint'
}: ComplaintFormProps) {
  const [formData, setFormData] = useState<ComplaintFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || 'academic',
    priority: initialData.priority || 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const handleInputChange = (field: keyof ComplaintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Complaint Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Brief description of your complaint..."
          maxLength={100}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Category Field */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value as ComplaintCategory)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
            errors.category ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
        {formData.category && (
          <p className="mt-1 text-xs text-gray-500">
            {CATEGORIES.find(c => c.value === formData.category)?.description}
          </p>
        )}
      </div>

      {/* Priority Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRIORITIES.map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => handleInputChange('priority', priority.value)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                formData.priority === priority.value
                  ? 'border-[#359d49] bg-[#359d49] text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{priority.label}</span>
                {formData.priority === priority.value && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className={`text-xs mt-1 ${
                formData.priority === priority.value ? 'text-white' : 'text-gray-500'
              }`}>
                {priority.description}
              </p>
            </button>
          ))}
        </div>
        {errors.priority && (
          <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={6}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Please provide a detailed description of your complaint. Include relevant details such as location, time, people involved, and any previous attempts to resolve the issue..."
          maxLength={1000}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.description.length}/1000 characters
        </p>
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Submission Guidelines</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Be specific and provide relevant details</li>
          <li>• Include location, time, and people involved if applicable</li>
          <li>• Mention any previous attempts to resolve the issue</li>
          <li>• Use appropriate priority level (urgent for safety/security issues)</li>
          <li>• Your complaint will be reviewed by SRC members</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </div>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
} 