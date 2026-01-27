# Supabase Integration Guide - Crime Watch

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project:
   - Project name: `crime-watch`
   - Database password: Create a strong password
   - Region: Choose closest to you
   - Wait for the project to initialize

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon/public key** (VITE_SUPABASE_ANON_KEY)

## Step 3: Configure Environment Variables

Update `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Create Database Tables

Run these SQL queries in the Supabase SQL Editor (go to **SQL Editor** and create a new query):

### Create Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'REPORTER',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### Create Incidents Table

```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_email TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  status_history JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_reporter_id ON incidents(reporter_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
```

## Step 5: Enable Realtime (Optional but Recommended)

1. Go to **Replication** in the Supabase dashboard
2. Under **Publication: supabase_realtime**, enable:
   - ✅ `incidents` table
   - ✅ `users` table

## Step 6: Set Row Level Security (Optional but Recommended)

In the SQL Editor, run:

```sql
-- Enable RLS on incidents
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own incidents
CREATE POLICY "Users can view their own incidents"  
  ON incidents FOR SELECT
  USING (reporter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Policy: Anyone can insert incidents
CREATE POLICY "Anyone can insert incidents"
  ON incidents FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update any incident
CREATE POLICY "Admins can update incidents"
  ON incidents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Policy: Admins can delete incidents
CREATE POLICY "Admins can delete incidents"
  ON incidents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));
```

## Step 7: Start the App

```bash
npm run dev
```

## Features Enabled

✅ **Real-time Updates** - Incidents update instantly when any admin makes changes
✅ **Persistent Storage** - Data persists in Supabase PostgreSQL database
✅ **User Management** - Each user has a persistent profile
✅ **Status History** - Complete audit trail of all incident status changes
✅ **Multi-user Support** - Multiple users can file incidents simultaneously

## Testing

1. Login with: `admin@mail.com` / `Admin123`
2. Create incidents from different browsers/tabs to see real-time updates
3. Watch incidents update instantly as you change status as admin

## Troubleshooting

### "Cannot find module 'react/jsx-runtime'"

Run: `npm install`

### Real-time updates not working

Check that Replication is enabled for the tables in Supabase dashboard

### "401 Unauthorized" errors

Verify your `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL` are correct in `.env.local`

### Data not persisting

Ensure the tables are created correctly and environment variables are set before restarting the app

## Next Steps

- Add email notifications when incidents are created
- Implement Supabase Auth for passwordless login
- Add file uploads for incident photos
- Create an admin dashboard with analytics
- Set up automated backups
