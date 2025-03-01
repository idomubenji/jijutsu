-- Drop the existing table if it exists
DROP TABLE IF EXISTS kanji_dex;

-- Create the kanji_dex table for storing kanji information
CREATE TABLE kanji_dex (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dex_number INTEGER NOT NULL UNIQUE,
  kanji VARCHAR(8) NOT NULL,
  meanings TEXT[] NOT NULL,
  on_reading TEXT[],
  kun_reading TEXT[]
);

-- Set up Row Level Security for kanji_dex table
ALTER TABLE kanji_dex ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read kanji data
CREATE POLICY "Authenticated users can read kanji data" 
  ON kanji_dex FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow service role to insert, update, delete
CREATE POLICY "Only service role can modify kanji data" 
  ON kanji_dex FOR ALL
  USING (auth.role() = 'service_role');

-- Create index on dex_number for faster lookups
CREATE INDEX kanji_dex_number_idx ON kanji_dex (dex_number);

-- Create index on kanji for faster lookups
CREATE INDEX kanji_lookup_idx ON kanji_dex (kanji);

-- Example insert to demonstrate usage:
INSERT INTO kanji_dex (dex_number, kanji, meanings, on_reading, kun_reading)
VALUES (
  1,
  '亜',
  ARRAY['Asia', 'rank next', 'come after', '-ous'],
  ARRAY['ア'],
  ARRAY['つ.ぐ']
); 