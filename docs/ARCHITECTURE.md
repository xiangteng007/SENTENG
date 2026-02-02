# SENTENG ERP Architecture Guide

> **Version**: 1.0 | **Last Updated**: 2026-02-03

---

## Overview

```
SENTENG/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # React Frontend
├── libs/             # Shared libraries
└── docs/             # Documentation
```

---

## Backend Architecture

### Module Structure

```
apps/api/src/
├── common/
│   ├── decorators/   # Custom decorators
│   ├── guards/       # Auth guards
│   ├── interceptors/ # Request/Response interceptors
│   └── services/     # Shared services
├── core/
│   ├── ownership/    # IDOR protection
│   └── services/     # Core services
└── modules/
    ├── auth/         # Authentication
    ├── projects/     # Project management
    ├── contracts/    # Contract management
    ├── invoices/     # Invoice management
    └── ...           # Other domain modules
```

### Key Patterns

1. **IDOR Protection**
   - `OwnershipGuard` for guard-level protection
   - `ResourceAccessInterceptor` for response-level verification

2. **Rate Limiting**
   - Global 60 req/60s via `ThrottlerGuard`

3. **Audit Logging**
   - `AuditLogInterceptor` for tracking changes

---

## Frontend Architecture

### Component Structure

```
apps/web/src/
├── components/
│   ├── calculator/   # Material calculator modules
│   ├── common/       # Shared UI components
│   └── ...
├── pages/            # Page components
├── services/         # API services
├── styles/
│   ├── design-tokens.js  # Design system tokens
│   └── a11y.css          # Accessibility styles
└── utils/
    └── a11y.js           # A11Y utilities
```

### Design System

- **Tokens**: `styles/design-tokens.js`
- **Base CSS**: `index.css` (v3.2.0)
- **A11Y**: `styles/a11y.css`

---

## Testing

### E2E Tests

```bash
cd apps/web
npx playwright test
```

### Unit Tests

```bash
npx nx run api:test
npx nx run web:test
```

---

## Deployment

- **API**: Google Cloud Run (asia-east1)
- **Web**: Vercel

---

*Updated: 2026-02-03*
