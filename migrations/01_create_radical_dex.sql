-- Create the radical_dex table for storing kanji radicals information
CREATE TABLE radical_dex (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dex_number INTEGER NOT NULL UNIQUE,
  radical_number INTEGER NOT NULL,
  radical_shape VARCHAR(255) NOT NULL,
  english_name VARCHAR(255) NOT NULL,
  stroke_count INTEGER NOT NULL,
  reading VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Set up Row Level Security for radical_dex table
ALTER TABLE radical_dex ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read radical data
CREATE POLICY "Authenticated users can read radical data" 
  ON radical_dex FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow service role to insert, update, delete
CREATE POLICY "Only service role can modify radical data" 
  ON radical_dex FOR ALL
  USING (auth.role() = 'service_role');

-- Create index on radical_number for faster lookups
CREATE INDEX radical_number_idx ON radical_dex (radical_number);

-- Create index on stroke_count for filtering
CREATE INDEX stroke_count_idx ON radical_dex (stroke_count);

-- Create index on dex_number for faster lookups
CREATE INDEX dex_number_idx ON radical_dex (dex_number); 