# FuelCore – Enterprise Fuel Station Management System

<div align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/node-20.x-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/react-18.x-61DAFB?style=flat-square" />
  <img src="https://img.shields.io/badge/postgresql-15-blue?style=flat-square" />
</div>

---

A production-ready, enterprise-grade fuel station management system with real-time analytics, fleet billing, multi-station support, and role-based access control.

## Architecture

```
fuelcore/
├── backend/          # Node.js 20 + TypeScript + Express + Prisma
│   ├── src/
│   │   ├── config/   # DB, Redis, Logger, JWT config
│   │   ├── middleware/   # Auth, RBAC, RateLimit, Audit
│   │   ├── modules/  # 12 feature modules
│   │   └── utils/    # Helpers, Cron jobs
│   └── prisma/       # Schema + Migrations + Seed
└── frontend/         # React 18 + TypeScript + Vite + Tailwind
    └── src/
        ├── api/      # Axios instance + interceptors
        ├── store/    # Zustand state (auth, ui)
        ├── pages/    # 12 page modules
        └── components/   # Reusable UI components
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | Zustand, TanStack Query v5 |
| **Backend** | Node.js 20, Express, TypeScript |
| **Database** | PostgreSQL 15 + Prisma ORM |
| **Cache/Queue** | Redis 7 |
| **Auth** | JWT RS256 (15m access + 7d refresh) |
| **Deployment** | Docker, Docker Compose, PM2, Nginx |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- npm 10+

### 1. Clone and configure

```bash
git clone <repo> fuelcore
cd fuelcore
cp .env.example .env
# Edit .env with your secrets
```

### 2. Generate RS256 keys

```bash
cd backend
npm install
npm run keys:generate
```

### 3. Start with Docker Compose (Development)

```bash
docker-compose up -d
```

Services:
- **API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: `npm run db:studio` → http://localhost:5555

### 4. Run migrations and seed

```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 5. Start frontend (development)

```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@fuelcore.io | Admin@1234 |
| Station Manager | james.wilson@fuelcore.io | Manager@1234 |
| Employee | alex.johnson@fuelcore.io | Employee@1234 |

## Core Modules

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `/api/v1/auth/*` | Login, refresh, logout, forgot/reset password |
| **Dashboard** | `/api/v1/dashboard/*` | KPIs, charts, recent sales, alerts |
| **Sales** | `/api/v1/sales/*` | CRUD, atomic tank deductions, fleet billing |
| **Pumps** | `/api/v1/pumps/*` | Status management, meter readings |
| **Inventory** | `/api/v1/inventory/*` | Tanks, refills, suppliers |
| **Employees** | `/api/v1/employees/*` | CRUD, attendance, payroll summary |
| **Fleet** | `/api/v1/fleet/*` | Corporate accounts, credit limits, payments |
| **Expenses** | `/api/v1/expenses/*` | CRUD, categories, summary |
| **Reports** | `/api/v1/reports/*` | Daily/weekly/monthly P&L |
| **Analytics** | `/api/v1/analytics/*` | Trends, fuel mix, demand forecast, recommendations |
| **Notifications** | `/api/v1/notifications/*` | CRUD + Server-Sent Events stream |
| **Settings** | `/api/v1/settings/*` | Station config, fuel prices |

## Role-Based Access Control

| Permission | Super Admin | Station Manager | Employee |
|------------|:-----------:|:---------------:|:--------:|
| Manage stations | ✅ | ❌ | ❌ |
| View dashboard | ✅ | ✅ | ❌ |
| Create sales | ✅ | ✅ | ✅ |
| Manage employees | ✅ | ✅ | ❌ |
| Manage fleet | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ❌ |
| Export data | ✅ | ✅ | ❌ |
| Attendance check-in | ✅ | ✅ | ✅ |

## Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d --build

# Or with PM2 (no Docker)
cd backend
npm run build
npm run start:pm2
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
CORS_ORIGINS=http://localhost:5173
NODE_ENV=development
```

## Security Features

- RS256 asymmetric JWT signing
- Refresh token rotation with Redis blacklisting
- Redis-backed rate limiting (100 req/15min per IP)
- Helmet HTTP security headers
- Station-level data isolation for multi-tenant RBAC
- Audit log for all CREATE/UPDATE/DELETE operations
- bcrypt password hashing (12 rounds)

## License

MIT © FuelCore 2024
