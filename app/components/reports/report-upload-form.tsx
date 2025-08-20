'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { ReportFormData, ReportCategory } from '@/types/supabase';

interface ReportUploadFormProps {
  onSubmit: (data: ReportFormData, file: File) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  initialData?: ReportFormData;
}

export default function ReportUploadForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Upload Report',
  initialData
}: ReportUploadFormProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    month: new Date().getMonth() + 1, // Always use current month
    year: new Date().getFullYear(),    // Always use current year
    visibility: initialData?.visibility || ['src', 'student']
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch report categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/reports/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    if (!selectedFile) {
      newErrors.file = 'Please select a PDF file';
    } else if (selectedFile.type !== 'application/pdf') {
      newErrors.file = 'Only PDF files are allowed';
    } else if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      newErrors.file = 'File size must be less than 10MB';
    }

    if (formData.visibility.length === 0) {
      newErrors.visibility = 'Please select at least one visibility option';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData, selectedFile!);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        visibility: ['src', 'student'],
        category_id: ''
      });
      setSelectedFile(null);
      setErrors({});
    } catch (error) {
      console.error('Error uploading report:', error);
    }
  };

  const handleInputChange = (field: keyof ReportFormData, value: string | number | string[]) => {
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

  const handleVisibilityChange = (visibility: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      visibility: checked 
        ? [...prev.visibility, visibility]
        : prev.visibility.filter(v => v !== visibility)
    }));
    
    if (errors.visibility) {
      setErrors(prev => ({
        ...prev,
        visibility: ''
      }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));
    } else {
      setErrors(prev => ({ ...prev, file: 'Only PDF files are allowed' }));
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };



  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Report Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter report title"
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter report description (optional)"
          />
        </div>

        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          {loadingCategories ? (
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">Loading categories...</p>
            </div>
          ) : (
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.category_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
          )}
        </div>

        {/* Auto-Date Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">📅</span>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Report Date: {getMonthName(formData.month)} {formData.year}
              </p>
              <p className="text-xs text-blue-600">
                Automatically set to current month and year
              </p>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Visibility *
          </label>
          <div className="space-y-3">
            {['src', 'student'].map(visibility => (
              <label key={visibility} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.visibility.includes(visibility)}
                  onChange={(e) => handleVisibilityChange(visibility, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 capitalize">
                  {visibility} Dashboard
                </span>
              </label>
            ))}
          </div>
          {errors.visibility && (
            <p className="mt-1 text-sm text-red-600">{errors.visibility}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            PDF File *
          </label>
          
          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-2">
              <div className="text-4xl">📄</div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-green-600">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Drop your PDF file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {errors.file && (
            <p className="mt-1 text-sm text-red-600">{errors.file}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Uploading...' : submitLabel}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
