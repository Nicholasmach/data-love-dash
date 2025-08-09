-- Create nalk_ai_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nalk_ai_logs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  prompt TEXT,
  answer TEXT,
  sql_query TEXT,
  query_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nalk_ai_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for nalk_ai_logs
CREATE POLICY "Users can view their own logs" 
ON public.nalk_ai_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert logs" 
ON public.nalk_ai_logs 
FOR INSERT 
WITH CHECK (true);