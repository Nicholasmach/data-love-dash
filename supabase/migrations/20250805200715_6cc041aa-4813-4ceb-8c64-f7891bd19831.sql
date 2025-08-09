-- Criação das tabelas necessárias para sincronização RD Station
CREATE TABLE IF NOT EXISTS public.rd_sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'running',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  total_deals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rd_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_job_id UUID REFERENCES public.rd_sync_jobs(id),
  rd_deal_id TEXT,
  raw_data JSONB,
  processed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rd_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies para rd_sync_jobs
CREATE POLICY "Users can view their own sync jobs" 
ON public.rd_sync_jobs 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create sync jobs" 
ON public.rd_sync_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own sync jobs" 
ON public.rd_sync_jobs 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies para rd_deals
CREATE POLICY "Users can view deals from their sync jobs" 
ON public.rd_deals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.rd_sync_jobs 
  WHERE rd_sync_jobs.id = rd_deals.sync_job_id 
  AND (auth.uid() = rd_sync_jobs.user_id OR rd_sync_jobs.user_id IS NULL)
));

CREATE POLICY "Users can insert deals" 
ON public.rd_deals 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_rd_sync_jobs_updated_at
  BEFORE UPDATE ON public.rd_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rd_deals_updated_at
  BEFORE UPDATE ON public.rd_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_rd_deals_sync_job_id ON public.rd_deals(sync_job_id);
CREATE INDEX idx_rd_deals_rd_deal_id ON public.rd_deals(rd_deal_id);
CREATE INDEX idx_rd_sync_jobs_status ON public.rd_sync_jobs(status);
CREATE INDEX idx_rd_sync_jobs_created_at ON public.rd_sync_jobs(created_at);