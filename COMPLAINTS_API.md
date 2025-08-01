# Complaints API Documentation

## Overview
The Complaints API provides endpoints for managing student complaints in the DWU SRC system. It includes role-based access control where:
- **Students** can create and view their own complaints
- **SRC Members** can view, assign, respond to, and manage complaints
- **Admins** have full access to all complaints

## Base URL
```
/api/complaints
```

## Authentication
All endpoints require authentication via Supabase Auth. Include the session cookie in requests.

## Endpoints

### 1. List Complaints
**GET** `/api/complaints`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `in_progress`, `resolved`, `closed`, `rejected`)
- `category` (optional): Filter by category (`academic`, `facilities`, `security`, `health`, `transport`, `other`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `limit` (optional): Number of complaints to return (default: 10)
- `offset` (optional): Number of complaints to skip (default: 0)

**Response:**
```json
{
  "complaints": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "title": "WiFi connectivity issues",
      "description": "WiFi is not working in the library",
      "category": "facilities",
      "priority": "high",
      "status": "pending",
      "assigned_to": null,
      "response": null,
      "resolved_at": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "student": {
        "id": "uuid",
        "full_name": "John Doe",
        "student_id": "2024001",
        "department": "Computer Science",
        "year_level": 3
      },
      "assigned_to": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "role": "src"
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25
  }
}
```

### 2. Create Complaint
**POST** `/api/complaints`

**Request Body:**
```json
{
  "title": "WiFi connectivity issues",
  "description": "WiFi is not working in the library",
  "category": "facilities",
  "priority": "high"
}
```

**Response:** `201 Created`
```json
{
  "complaint": {
    // Same structure as above
  }
}
```

### 3. Get Single Complaint
**GET** `/api/complaints/{id}`

**Response:**
```json
{
  "complaint": {
    // Same structure as above
  }
}
```

### 4. Update Complaint
**PUT** `/api/complaints/{id}`

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "academic",
  "priority": "medium"
}
```

**Note:** Students can only update their own complaints and only certain fields.

### 5. Delete Complaint
**DELETE** `/api/complaints/{id}`

**Response:**
```json
{
  "message": "Complaint deleted successfully"
}
```

### 6. Assign Complaint
**POST** `/api/complaints/{id}/assign`

**Request Body:**
```json
{
  "assigned_to": "uuid-of-src-member"
}
```

**Response:**
```json
{
  "complaint": {
    // Updated complaint with assignment
  },
  "message": "Complaint assigned successfully"
}
```

### 7. Unassign Complaint
**DELETE** `/api/complaints/{id}/assign`

**Response:**
```json
{
  "complaint": {
    // Updated complaint without assignment
  },
  "message": "Complaint unassigned successfully"
}
```

### 8. Respond to Complaint
**POST** `/api/complaints/{id}/respond`

**Request Body:**
```json
{
  "response": "We are investigating the issue and will resolve it within 2 days.",
  "status": "in_progress"
}
```

**Response:**
```json
{
  "complaint": {
    // Updated complaint with response
  },
  "message": "Response added successfully"
}
```

### 9. Update Response
**PUT** `/api/complaints/{id}/respond`

**Request Body:**
```json
{
  "response": "Updated response text"
}
```

### 10. Update Status
**PUT** `/api/complaints/{id}/status`

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Response:**
```json
{
  "complaint": {
    // Updated complaint with new status
  },
  "message": "Status updated successfully"
}
```

### 11. Get Status
**GET** `/api/complaints/{id}/status`

**Response:**
```json
{
  "status": "pending",
  "canUpdate": true
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (complaint doesn't exist)
- `500` - Internal Server Error

## Role-Based Access Control

### Students
- ✅ Create complaints
- ✅ View own complaints
- ✅ Update own complaints (limited fields)
- ✅ Delete own complaints
- ❌ Assign complaints
- ❌ Respond to complaints
- ❌ Update status

### SRC Members
- ✅ View all complaints
- ✅ Assign complaints to themselves/others
- ✅ Respond to assigned complaints
- ✅ Update status of assigned complaints
- ❌ Delete complaints

### Admins
- ✅ Full access to all operations
- ✅ Can assign complaints to any SRC member
- ✅ Can respond to any complaint
- ✅ Can update any complaint status
- ✅ Can delete any complaint

## Testing Examples

### Create a Complaint (Student)
```bash
curl -X POST /api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Library WiFi Issues",
    "description": "WiFi is not working in the library",
    "category": "facilities",
    "priority": "high"
  }'
```

### Assign Complaint (SRC Member)
```bash
curl -X POST /api/complaints/{id}/assign \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": "src-member-uuid"
  }'
```

### Respond to Complaint (SRC Member)
```bash
curl -X POST /api/complaints/{id}/respond \
  -H "Content-Type: application/json" \
  -d '{
    "response": "We are investigating the issue.",
    "status": "in_progress"
  }'
``` 