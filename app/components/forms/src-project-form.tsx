'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { SrcProjectFormData, ProjectStatus } from '@/types/supabase';

interface SrcProjectFormProps {
  onSubmit: (data: SrcProjectFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  initialData?: SrcProjectFormData;
}

export default function SrcProjectForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Submit Project',
  initialData
}: SrcProjectFormProps) {
  const [formData, setFormData] = useState<SrcProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    objectives: initialData?.objectives || '',
    start_date: initialData?.start_date || '',
    target_finish_date: initialData?.target_finish_date || '',
    budget_allocated: initialData?.budget_allocated,
    team_members: initialData?.team_members || [],
    progress_percentage: initialData?.progress_percentage || 0,
    status: initialData?.status || 'not_started'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teamMemberInput, setTeamMemberInput] = useState('');

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

    if (!formData.objectives.trim()) {
      newErrors.objectives = 'Objectives are required';
    } else if (formData.objectives.trim().length < 20) {
      newErrors.objectives = 'Objectives must be at least 20 characters long';
    }

    // Validate dates
    if (formData.start_date && formData.target_finish_date) {
      const startDate = new Date(formData.start_date);
      const targetDate = new Date(formData.target_finish_date);
      if (startDate >= targetDate) {
        newErrors.target_finish_date = 'Target finish date must be after start date';
      }
    }

    // Validate budget
    if (formData.budget_allocated !== undefined && formData.budget_allocated < 0) {
      newErrors.budget_allocated = 'Budget cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting project:', error);
    }
  };

  const handleInputChange = (field: keyof SrcProjectFormData, value: string | number | string[] | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addTeamMember = () => {
    if (teamMemberInput.trim() && !formData.team_members?.includes(teamMemberInput.trim())) {
      handleInputChange('team_members', [...(formData.team_members || []), teamMemberInput.trim()]);
      setTeamMemberInput('');
    }
  };

  const removeTeamMember = (index: number) => {
    const newTeamMembers = formData.team_members?.filter((_, i) => i !== index) || [];
    handleInputChange('team_members', newTeamMembers);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTeamMember();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit New SRC Project</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter project title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Project Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the project in detail"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Objectives */}
        <div>
          <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 mb-2">
            Project Objectives *
          </label>
          <textarea
            id="objectives"
            rows={3}
            value={formData.objectives}
            onChange={(e) => handleInputChange('objectives', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
              errors.objectives ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="What are the main objectives of this project?"
          />
          {errors.objectives && (
            <p className="mt-1 text-sm text-red-600">{errors.objectives}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
            />
          </div>
          <div>
            <label htmlFor="target_finish_date" className="block text-sm font-medium text-gray-700 mb-2">
              Target Finish Date
            </label>
            <input
              type="date"
              id="target_finish_date"
              value={formData.target_finish_date}
              onChange={(e) => handleInputChange('target_finish_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
                errors.target_finish_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.target_finish_date && (
              <p className="mt-1 text-sm text-red-600">{errors.target_finish_date}</p>
            )}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget_allocated" className="block text-sm font-medium text-gray-700 mb-2">
            Budget Allocated (K)
          </label>
          <input
            type="number"
            id="budget_allocated"
            value={formData.budget_allocated || ''}
            onChange={(e) => handleInputChange('budget_allocated', e.target.value ? parseFloat(e.target.value) : null)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] ${
              errors.budget_allocated ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter budget amount in Kina"
            min="0"
            step="0.01"
          />
          {errors.budget_allocated && (
            <p className="mt-1 text-sm text-red-600">{errors.budget_allocated}</p>
          )}
        </div>

        {/* Progress Percentage */}
        <div>
          <label htmlFor="progress_percentage" className="block text-sm font-medium text-gray-700 mb-2">
            Progress Percentage
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              id="progress_percentage"
              min="0"
              max="100"
              value={formData.progress_percentage || 0}
              onChange={(e) => handleInputChange('progress_percentage', parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
              {formData.progress_percentage || 0}%
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Drag the slider to set project completion percentage
          </div>
        </div>

        {/* Project Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Project Status
          </label>
          <select
            id="status"
            value={formData.status || 'not_started'}
            onChange={(e) => handleInputChange('status', e.target.value as ProjectStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          >
            <option value="not_started">Not Started</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Team Members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={teamMemberInput}
              onChange={(e) => setTeamMemberInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              placeholder="Add team member name"
            />
            <Button
              type="button"
              onClick={addTeamMember}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </Button>
          </div>
          
          {formData.team_members && formData.team_members.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.team_members.map((member, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {member}
                  <button
                    type="button"
                    onClick={() => removeTeamMember(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Project Submission Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                                 <p>Your project will be submitted for admin approval. You will be notified once it&apos;s reviewed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-[#359d49] disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
