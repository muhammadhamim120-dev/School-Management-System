# Default Login Credentials

Demo accounts created by `prisma/seed.ts` for **Greenwood International School**.

> ⚠️ **Demo defaults — change these before real use.** All passwords are shared
> defaults. Rotate them or force a reset for any non-demo deployment.

**Organization / School code (the “School” field on the login form):** `greenwood`

The login form is at **`/login`**. Enter the **School code**, email, and password.
Super Admin logs in at **`/super-admin/login`** with **no school code**.

---

## Admin & staff logins

| Role | Login URL | School code | Email | Password |
|------|-----------|-------------|-------|----------|
| **Super Admin** | `/super-admin/login` | _(none)_ | `superadmin@greenwood.edu` | `superadmin123` |
| **School Admin** | `/login` | `greenwood` | `schooladmin@greenwood.edu` | `schooladmin123` |
| **Admin** | `/login` | `greenwood` | `admin@greenwood.edu` | `admin123` |

## Teacher logins — password **`teacher123`**, school code `greenwood`

| Email | Name |
|-------|------|
| `teacher1001@greenwood.edu` | Md. Abdul Karim |
| `teacher1002@greenwood.edu` | Shirin Akter |
| `teacher1003@greenwood.edu` | Mohammad Rafiqul Islam |
| `teacher1004@greenwood.edu` | Nasrin Sultana |
| `teacher1005@greenwood.edu` | Abul Kalam Azad |
| `teacher1006@greenwood.edu` | Farhana Yeasmin |

## Parent logins — password **`parent123`**, school code `greenwood`

| Email | Name |
|-------|------|
| `abdul0@example.com` | Abdul Hoque |
| `rokeya1@example.com` | Rokeya Begum |
| `shahidul2@example.com` | Shahidul Islam |
| `ayesha3@example.com` | Ayesha Siddiqua |
| `kamrul4@example.com` | Kamrul Hasan |
| `nurjahan5@example.com` | Nurjahan Akter |

Each parent has children assigned; **`abdul0@example.com`** has 4 children — good for demoing the parent portal.

## Student logins — password **`student123`**, school code `greenwood`

Students use email `<firstname><n>@student.greenwood.edu`. Examples (24 total):

| Email | Name |
|-------|------|
| `arif11@student.greenwood.edu` | Arif Akter |
| `ayesha2@student.greenwood.edu` | Ayesha Chowdhury |
| `fatema15@student.greenwood.edu` | Fatema Ahmed |
| `ayesha14@student.greenwood.edu` | Ayesha Chowdhury |
| `arif23@student.greenwood.edu` | Arif Akter |

---

## Portal login

The **`/portal`** route redirects into the unified email/password login and sends
each role to its area:

- **Parent** → `/parent` (parent portal)
- **Student** → `/student` (student portal)

So the **Portal login = Parent/Student login above** (email + password + school code `greenwood`).

## Profile

Every signed-in role can open **`/profile`** (avatar menu → Profile) to see their
account details (name, email, role, school).

---

## How the accounts map

- Auth is **NextAuth v5**; the secret env var is **`AUTH_SECRET`** (not `NEXTAUTH_SECRET`).
- Login queries the `User` table; parent/student/teacher portals resolve the
  logged-in user to their `Parent`/`Student`/`Teacher` record **by email**.
- Super Admin has `schoolId = null` (platform-level) → logs in without a school code.

## Required production environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (set by the Vercel Postgres/Neon integration) |
| `AUTH_SECRET` | NextAuth session/JWT signing + pay/portal token signing (**required**) |
| `CSRF_SECRET` | CSRF signing (recommended; falls back to `AUTH_SECRET`) |
| `AUTH_TRUST_HOST` | `true` on Vercel (avoids Auth.js host errors) |

## Re-seeding

The seed is **idempotent and additive** (upsert/create — never deletes). To
(re)create these accounts and demo data:

```bash
npx prisma migrate deploy   # apply schema
npx prisma db seed          # add accounts + demo data
```

On Vercel, set `RUN_DB_SEED=true` for one deploy (the build runs the seed), then remove it.
