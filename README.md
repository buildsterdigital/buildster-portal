# Buildster Portal

CRM and job management for trade businesses (plumbing, heating, roofing, building).
One login can run several companies, each with its own users, roles, customers and settings.

## Phase 1 (this version)

- Sign up, sign in, sign out
- Create companies; switch between them from the sidebar
- Roles: owner, admin, office, sales, engineer, accountant
- Invite users by link, change roles, remove users
- Company settings: details for quotes and invoices, VAT rate, brand colour, job types, lead sources
- Default trade pipeline: Lead, Survey and Order stages
- Row level security: a user only ever sees companies they belong to

Next phases: sales board and customers, quotes and invoices, jobs and calendar,
LeadConnector/Stripe/Xero, then moving data across from Trade Portal.

## Running it

1. Create a free project at [supabase.com](https://supabase.com) (choose a London or EU region).
2. In Supabase, open the SQL editor and run `supabase/migrations/0001_foundations.sql`.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key
   (Project Settings -> API).
4. `npm install` then `npm run dev`, and open http://localhost:3000.

To deploy, import the repo into [Vercel](https://vercel.com) and add the same two
environment variables. In Supabase, set Authentication -> URL Configuration -> Site URL
to your Vercel address.

To make yourself a Buildster admin who can see every company, run in the SQL editor:

```sql
insert into platform_admins (user_id)
select id from auth.users where email = 'you@example.com';
```
