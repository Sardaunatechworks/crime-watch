
-- Database Schema for Crime-Watch

-- 1. Roles Enum
CREATE TYPE user_role AS ENUM ('REPORTER', 'ADMIN');
CREATE TYPE incident_status AS ENUM ('PENDING', 'UNDER_INVESTIGATION', 'RESOLVED');

-- 2. Profiles Table (Extends Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'REPORTER' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Incidents Table
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status incident_status DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Incident Images Table
CREATE TABLE incident_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT file_path_unique UNIQUE(incident_id, file_path)
);

-- 5. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Note: Using custom authentication system (users table), not Supabase Auth
CREATE POLICY "Allow all operations on profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Incident Images Policies
-- Note: Using custom authentication system (users table), not Supabase Auth
CREATE POLICY "Allow all operations on incident images" ON incident_images
  FOR ALL USING (true) WITH CHECK (true);

-- Incident Policies
-- Note: Using custom authentication system (users table), not Supabase Auth
-- RLS is disabled for incidents table as authorization is handled at application level

-- Allow all operations (RLS disabled for this table)
CREATE POLICY "Allow all operations on incidents" ON incidents
  FOR ALL USING (true) WITH CHECK (true);
