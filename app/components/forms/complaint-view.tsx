'use client';

import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types/supabase';

interface ComplaintViewProps {
  complaint: Complaint & {
    student?: {
      id: string;
      full_name: string;
      student_id?: string;
      department?: string;
      year_level?: number;
    };
    assigned_to?: {
      id: string;
      full_name: string;
      role: string;
    };
  };
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onRespond?: () => void;
  onUpdateStatus?: () => void;
  userRole?: 'student' | 'src' | 'admin';
  isAssignedToUser?: boolean;
}

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  academic: 'Academic',
  facilities: 'Facilities',
  security: 'Security',
  health: 'Health',
  transport: 'Transport',
  other: 'Other',
};

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-green-800', bgColor: 'bg-green-100' },
  medium: { label: 'Medium', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  high: { label: 'High', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-800', bgColor: 'bg-red-100' },
};

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: '⏳' },
  in_progress: { label: 'In Progress', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: '🔄' },
  resolved: { label: 'Resolved', color: 'text-green-800', bgColor: 'bg-green-100', icon: '✅' },
  closed: { label: 'Closed', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: '🔒' },
  rejected: { label: 'Rejected', color: 'text-red-800', bgColor: 'bg-red-100', icon: '❌' },
};

export default function ComplaintView({
  complaint,
  showActions = false,
  onEdit,
  onDelete,
  onAssign,
  onRespond,
  onUpdateStatus,
  userRole,
  isAssignedToUser = false,
}: ComplaintViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canEdit = userRole === 'admin' || (userRole === 'student' && complaint.student_id === complaint.student?.id);
  const canManage = userRole === 'admin' || (userRole === 'src' && isAssignedToUser);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{complaint.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[complaint.priority].bgColor} ${PRIORITY_CONFIG[complaint.priority].color}`}>
                {PRIORITY_CONFIG[complaint.priority].label} Priority
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[complaint.status].bgColor} ${STATUS_CONFIG[complaint.status].color}`}>
                {STATUS_CONFIG[complaint.status].icon} {STATUS_CONFIG[complaint.status].label}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {CATEGORY_LABELS[complaint.category]}
              </span>
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-2">
              {canEdit && onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
              )}
              {canEdit && onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complaint Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {complaint.response && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">SRC Response</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap">
                {complaint.response}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Student Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted By</h3>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-900">{complaint.student?.full_name}</p>
              {complaint.student?.student_id && (
                <p className="text-xs text-gray-600">ID: {complaint.student.student_id}</p>
              )}
              {complaint.student?.department && (
                <p className="text-xs text-gray-600">{complaint.student.department}</p>
              )}
              {complaint.student?.year_level && (
                <p className="text-xs text-gray-600">Year {complaint.student.year_level}</p>
              )}
            </div>
          </div>

          {/* Assignment Information */}
          {complaint.assigned_to && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned To</h3>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-gray-900">{complaint.assigned_to.full_name}</p>
                <p className="text-xs text-gray-600 capitalize">{complaint.assigned_to.role} Member</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="text-gray-900">{formatDate(complaint.created_at)}</span>
              </div>
              {complaint.updated_at !== complaint.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-900">{formatDate(complaint.updated_at)}</span>
                </div>
              )}
              {complaint.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Resolved:</span>
                  <span className="text-gray-900">{formatDate(complaint.resolved_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SRC Actions */}
      {showActions && (userRole === 'src' || userRole === 'admin') && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">SRC Actions</h3>
          <div className="flex flex-wrap gap-2">
            {!complaint.assigned_to && onAssign && (
              <button
                onClick={onAssign}
                className="px-4 py-2 text-sm bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39] transition-colors"
              >
                Assign to Me
              </button>
            )}
            {canManage && onRespond && (
              <button
                onClick={onRespond}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Respond
              </button>
            )}
            {canManage && onUpdateStatus && (
              <button
                onClick={onUpdateStatus}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Update Status
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status History */}
      {complaint.status !== 'pending' && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status History</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[complaint.status].bgColor} ${STATUS_CONFIG[complaint.status].color}`}>
              {STATUS_CONFIG[complaint.status].icon} {STATUS_CONFIG[complaint.status].label}
            </span>
            {complaint.status === 'resolved' || complaint.status === 'closed' ? (
              <span>• Resolved on {complaint.resolved_at ? formatDate(complaint.resolved_at) : 'Unknown'}</span>
            ) : (
              <span>• Last updated on {formatDate(complaint.updated_at)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 