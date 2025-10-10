/*
  # Create chat_history table

  1. New Tables
    - `chat_history`
      - `id` (uuid, primary key) - Unique identifier for each chat message
      - `session_id` (text) - Session identifier to group related messages
      - `message` (text) - The actual message content
      - `is_user` (boolean, default: true) - True for user messages, False for AI responses
      - `timestamp` (timestamptz, default: now()) - When the message was created
      - `created_at` (timestamptz, default: now()) - Record creation timestamp
  
  2. Security
    - Enable RLS on `chat_history` table
    - Add policy for public access (no auth required for this app)
    - Add index on session_id for faster queries
  
  3. Notes
    - Using UUID for better scalability and security
    - Timestamps use timestamptz for timezone awareness
    - Session-based access without user authentication
*/

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  message text NOT NULL,
  is_user boolean NOT NULL DEFAULT true,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster session-based queries
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (app uses session-based access)
-- For public demo app without user authentication
CREATE POLICY "Allow public read access"
  ON chat_history
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON chat_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON chat_history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON chat_history
  FOR DELETE
  USING (true);