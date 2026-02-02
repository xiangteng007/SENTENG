# SENTENG ERP API Documentation v2.1

> **Base URL**: `https://erp-api-710372530107.asia-east1.run.app`  
> **Version**: v2.1.0 | **Auth**: JWT Bearer Token

---

## Authentication

### POST `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response**:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "role": "..." }
}
```

---

## Core Endpoints

### Projects

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/:id` | Get project |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Soft delete |

### Invoices

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice |
| GET | `/api/v1/invoices/stats` | Invoice statistics |

### Contracts

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/v1/contracts` | List contracts |
| POST | `/api/v1/contracts` | Create contract |
| GET | `/api/v1/contracts/:id` | Get contract |

---

## Query Parameters

### Pagination
```
?page=1&limit=20
```

### Filtering
```
?status=active&startDate=2026-01-01&endDate=2026-12-31
```

### Sorting
```
?sortBy=createdAt&sortOrder=desc
```

---

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

| Code | Description |
|:-----|:------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Rate Limiting

- **Limit**: 60 requests per 60 seconds
- **Header**: `X-RateLimit-Remaining`

---

## Health Check

```bash
curl https://erp-api-710372530107.asia-east1.run.app/health
```

---

*Updated: 2026-02-03*
