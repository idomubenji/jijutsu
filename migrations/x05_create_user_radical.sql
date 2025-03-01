-- Drop the existing table if it exists
DROP TABLE IF EXISTS user_radical;

-- Create the user_radical junction table
CREATE TABLE user_radical (
  user_id UUID REFERENCES auth.users(id),
  radical_id UUID REFERENCES radical_dex(id),
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, radical_id)
);

-- Set up Row Level Security for user_radical table
ALTER TABLE user_radical ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own radical discoveries
CREATE POLICY "Users can read their own radical discoveries"
  ON user_radical FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own discoveries
CREATE POLICY "Users can insert their own radical discoveries"
  ON user_radical FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups of user's discoveries
CREATE INDEX user_radical_user_id_idx ON user_radical (user_id);
CREATE INDEX user_radical_radical_id_idx ON user_radical (radical_id); 