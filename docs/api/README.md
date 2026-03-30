# Nursery-SaaS API Documentation

Welcome to the Nursery-SaaS API documentation. This is the REST API for the childcare management platform.

## Base URL

```
https://api.mynurse.app
https://dev.mynurse.local/api (Development)
```

## Authentication

All API endpoints require authentication via Bearer token (JWT):

```bash
Authorization: Bearer <jwt_token>
```

Obtain a token via:
1. POST `/auth/login` with email/password
2. POST `/auth/refresh` to get new access token
3. OAuth 2.0 social login endpoints

## Response Format

All responses are JSON:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-03-30T14:23:45Z"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": []
  },
  "timestamp": "2026-03-30T14:23:45Z"
}
```

## API Endpoints

### Authentication Endpoints

- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and revoke token
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/reset-password` - Complete password reset
- `POST /auth/mfa/setup` - Setup multi-factor authentication
- `POST /auth/mfa/verify` - Verify MFA code
- `GET /auth/profile` - Get current user profile

### Tenant Management

- `GET /tenants` - List accessible tenants
- `GET /tenants/:id` - Get tenant details
- `POST /tenants` - Create new tenant
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

### User Management

- `GET /tenants/:tenantId/users` - List users
- `GET /tenants/:tenantId/users/:userId` - Get user details
- `POST /tenants/:tenantId/users` - Create user
- `PUT /tenants/:tenantId/users/:userId` - Update user
- `DELETE /tenants/:tenantId/users/:userId` - Delete user
- `POST /tenants/:tenantId/users/:userId/roles` - Assign role to user
- `DELETE /tenants/:tenantId/users/:userId/roles/:roleId` - Remove role

### Children Management

- `GET /tenants/:tenantId/children` - List children
- `GET /tenants/:tenantId/children/:childId` - Get child details
- `POST /tenants/:tenantId/children` - Create child record
- `PUT /tenants/:tenantId/children/:childId` - Update child
- `DELETE /tenants/:tenantId/children/:childId` - Delete child
- `GET /tenants/:tenantId/children/:childId/allergies` - Get child allergies
- `POST /tenants/:tenantId/children/:childId/allergies` - Add allergy
- `GET /tenants/:tenantId/children/:childId/medications` - Get medications
- `POST /tenants/:tenantId/children/:childId/medications` - Add medication

### Attendance & Visits

- `GET /tenants/:tenantId/visits` - List visits
- `POST /tenants/:tenantId/visits` - Check-in child
- `PUT /tenants/:tenantId/visits/:visitId` - Check-out child
- `GET /tenants/:tenantId/attendance` - Get attendance report

### Employee Management

- `GET /tenants/:tenantId/employees` - List employees
- `GET /tenants/:tenantId/employees/:employeeId` - Get employee details
- `POST /tenants/:tenantId/employees` - Create employee
- `PUT /tenants/:tenantId/employees/:employeeId` - Update employee
- `DELETE /tenants/:tenantId/employees/:employeeId` - Delete employee

### Classes & Departments

- `GET /tenants/:tenantId/departments` - List departments
- `POST /tenants/:tenantId/departments` - Create department
- `GET /tenants/:tenantId/classes` - List classes
- `POST /tenants/:tenantId/classes` - Create class
- `PUT /tenants/:tenantId/classes/:classId` - Update class
- `DELETE /tenants/:tenantId/classes/:classId` - Delete class

### Reports & Analytics

- `GET /tenants/:tenantId/reports/attendance` - Attendance report
- `GET /tenants/:tenantId/reports/children` - Children summary
- `GET /tenants/:tenantId/reports/staff` - Staff report
- `GET /tenants/:tenantId/reports/health` - Health & allergies report

### Health & Status

- `GET /health` - API health check
- `GET /health/status` - Detailed system status

## Query Parameters

### Pagination

```
?limit=20&offset=0
```

- `limit` - Number of results (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)

### Filtering

```
?status=active&department=preschool
```

### Sorting

```
?sort=name&order=asc
```

- `sort` - Field to sort by
- `order` - asc or desc

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

## Rate Limiting

API is rate limited:
- **Default**: 100 requests per minute per user
- **Burst**: 20 requests per second
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp of reset

## Webhooks

Register webhooks to receive events:

```
POST /webhooks/subscribe
{
  "event_type": "child.checked_in",
  "callback_url": "https://yourapp.com/webhooks/nursery"
}
```

Events:
- `child.checked_in` - Child checked in
- `child.checked_out` - Child checked out
- `child.created` - New child created
- `child.updated` - Child information updated
- `medication.added` - Medication added to child
- `allergy.updated` - Allergy information updated
- `visit.ended` - Visit completed

## SDKs

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Go
- Swift

## Examples

See `postman.json` for example API calls and collection.

## Support

- Documentation: https://docs.mynurse.app
- API Status: https://status.mynurse.app
- Support Email: support@mynurse.app
- Support Chat: https://chat.mynurse.app
