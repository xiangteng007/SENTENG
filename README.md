# SENTENG ERP Monorepo

A unified monorepo containing the SENTENG ERP platform - backend API and frontend web application.

## Structure

```
senteng-erp/
├── apps/
│   ├── api/           # NestJS Backend (Cloud Run)
│   └── web/           # React/Vite Frontend (Vercel)
├── libs/
│   └── shared/        # Shared TypeScript types
├── .github/workflows/ # CI/CD pipelines
├── nx.json            # Nx configuration
└── package.json       # Root workspace config
```

## Tech Stack

| App | Framework | Deployment |
|-----|-----------|------------|
| API | NestJS 11 + TypeORM + PostgreSQL | Google Cloud Run |
| Web | Vite 7 + React 18 + TailwindCSS | Vercel |

## Quick Start

```bash
# Install all dependencies
npm install

# Serve API in development
npm run serve:api

# Serve Web in development
npm run serve:web

# Build all applications
npm run build:all

# View project dependency graph
npm run graph
```

## Nx Commands

```bash
# Run single project
npx nx build api
npx nx serve web

# Run multiple projects
npx nx run-many --target=build --all

# Affected builds (only changed)
npx nx affected --target=build
```

## Environment Variables

### API (apps/api)

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `CWA_API_KEY` - Central Weather Administration API key (for weather alerts)

### Web (apps/web)

Copy `.env.example` to `.env` and configure:

- `VITE_API_URL` - Backend API URL

## License

Private - SENTENG Construction
