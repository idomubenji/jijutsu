-- Drop the existing table if it exists
DROP TABLE IF EXISTS user_kanji;

-- Create the user_kanji junction table
CREATE TABLE user_kanji (
  user_id UUID REFERENCES auth.users(id),
  kanji_id UUID REFERENCES kanji_dex(id),
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kanji_id)
);

-- Set up Row Level Security for user_kanji table
ALTER TABLE user_kanji ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own kanji discoveries
CREATE POLICY "Users can read their own kanji discoveries"
  ON user_kanji FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own discoveries
CREATE POLICY "Users can insert their own kanji discoveries"
  ON user_kanji FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own discoveries
CREATE POLICY "Users can delete their own kanji discoveries"
  ON user_kanji FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups of user's discoveries
CREATE INDEX user_kanji_user_id_idx ON user_kanji (user_id);
CREATE INDEX user_kanji_kanji_id_idx ON user_kanji (kanji_id); 