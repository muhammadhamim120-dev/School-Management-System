# Greenwood International School — School Management System

A full-stack, production-oriented **School Management System** built with the Next.js App Router. It includes a public marketing website, a secure admin dashboard, and complete CRUD across all core school entities.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Auth.js (NextAuth v5) with credentials + JWT sessions
- **Forms & Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** lucide-react
- **Theming:** next-themes (light/dark)

## Features

### Public Website (`/`)
Home, About, Admissions, Faculty, Gallery, Notice Board, Events, and Contact — responsive with light/dark mode. Faculty, Notices, and Events read live from the database (with sensible sample fallbacks when empty).

### Admin Dashboard (`/dashboard`)
- **Overview:** stat cards + gender distribution (pie) and students-per-class (bar) charts, recent records.
- **Students / Teachers / Parents:** full CRUD with search, pagination, avatars, status badges. Parents link to multiple students.
- **Classes & Sections:** class cards with inline section management.
- **Subjects:** linked to a class and a teacher.
- **Attendance:** date + class filter, per-student PRESENT/ABSENT/LATE/EXCUSED marking, bulk save.
- **Examinations & Results:** schedule exams; enter marks per student/subject with automatic grading (A+ → F).
- **Fees:** track amount/paid/status with auto status calculation.
- **Notices:** publish announcements with pin-to-top and audience targeting.
- **Events:** manage events with status and dates.
- **Settings:** configure school information.

### Authentication
- `/login` (credentials), `/forgot-password`, `/reset-password`. Middleware protects `/dashboard/*` and redirects authenticated users away from auth pages.
- Since no email service is configured, the "forgot password" flow returns the reset token in the response and renders a direct reset link (demo behavior — replace with real email in production).

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy the example env and fill in values:
```bash
cp .env.example .env
```
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sms?schema=public"
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
```

### 3. Set up the database
```bash
npx prisma generate
npx prisma migrate dev --name init   # or: npx prisma db push
npm run db:seed
```

### 4. Run the dev server
```bash
npm run dev
```
Open http://localhost:3000.

### Demo credentials (created by the seed)
- **Email:** `admin@greenwood.edu`
- **Password:** `admin123`

## Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Start the production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema without migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure
```
prisma/
  schema.prisma        # data model
  seed.ts              # sample data + admin user
src/
  app/
    (public)/          # marketing website
    (auth)/            # login / forgot / reset
    (dashboard)/       # protected admin app
    api/               # REST route handlers
  components/
    ui/                # shadcn/ui primitives
    dashboard/         # shell, sidebar, topbar, data-table, charts
    public/            # navbar, footer, hero
    students|teachers|parents/  # entity forms
  lib/                 # prisma, auth, validations, api helpers, utils
  services/            # typed API client
  hooks/               # useResourceList, useToast
  types/               # shared types
```

## API Overview
All under `/api`. List endpoints support `?page`, `?limit`, `?search`. Mutations require an authenticated session.

`students`, `teachers`, `parents`, `classes`, `sections`, `subjects`, `exams`, `results`, `fees`, `notices`, `events`, `attendance`, `dashboard`, `settings`, `auth/forgot`, `auth/reset`.

## Production Notes
- Replace the demo password-reset flow with a real transactional email provider.
- Set a strong `AUTH_SECRET` and use managed PostgreSQL.
- Add role-based authorization checks per route if you introduce non-admin roles.

## Build Verification Disclaimer
This project was authored in an environment **without network access to the npm registry and without a running PostgreSQL instance**, so `npm install`, `prisma generate`, `next build`, and the seed script could **not** be executed or verified here. The code is written to compile and run once dependencies are installed and a database is connected, but you should run `npm install` and `npm run build` locally and resolve any environment-specific issues before deploying.
