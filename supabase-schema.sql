-- Create the waitlisted_users table for storing emails before launch
CREATE TABLE waitlisted_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create the users table to store registered users
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Set up Row Level Security for waitlisted_users table
ALTER TABLE waitlisted_users ENABLE ROW LEVEL SECURITY;

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Only service role can read waitlisted_users" ON waitlisted_users;

-- Allow anonymous users to check if an email exists
CREATE POLICY "Allow checking if email exists" 
  ON waitlisted_users FOR SELECT
  USING (true);

-- Anyone can insert to waitlisted_users (for adding to waitlist)
CREATE POLICY "Anyone can insert to waitlisted_users" 
  ON waitlisted_users FOR INSERT
  WITH CHECK (true);

-- Set up Row Level Security for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read their own data" 
  ON users FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE
  USING (auth.uid() = user_id);

-- Drop the current insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Allow more permissive insert during signup - we'll rely on application logic for safety
CREATE POLICY "Allow user registration" 
  ON users FOR INSERT
  WITH CHECK (true);

-- Function to notify users on waitlist when the countdown completes
-- This would be called by a scheduled function or manually when the app launches
CREATE OR REPLACE FUNCTION notify_waitlist_users()
RETURNS void AS $$
DECLARE
  email_address TEXT;
  email_sent BOOLEAN;
BEGIN
  FOR email_address IN SELECT email FROM waitlisted_users
  LOOP
    -- This is a placeholder for the actual email sending logic
    -- In practice, you'd use Supabase Edge Functions or an external service
    RAISE NOTICE 'Sending email to %', email_address;
    
    -- Here you would call your email sending service
    -- email_sent := send_email(
    --   email_address, 
    --   'Jijutsu has launched!', 
    --   'Jijutsu is now available. Sign up today to start creating kanji!'
    -- );
  END LOOP;
END;
$$ LANGUAGE plpgsql; 