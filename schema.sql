
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

-- 4. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Incident Policies
CREATE POLICY "Reporters can view their own incidents" ON incidents
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Reporters can insert their own incidents" ON incidents
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all incidents" ON incidents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins can update incidents" ON incidents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins can delete incidents" ON incidents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
