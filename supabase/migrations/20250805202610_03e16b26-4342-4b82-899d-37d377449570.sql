-- Criar tabela normalizada para análises e data viz
CREATE TABLE public.deals_normalized (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rd_deal_id TEXT NOT NULL UNIQUE,
  deal_name TEXT,
  deal_amount_total DECIMAL DEFAULT 0,
  deal_amount_unique DECIMAL DEFAULT 0,
  deal_created_at TIMESTAMP WITH TIME ZONE,
  deal_updated_at TIMESTAMP WITH TIME ZONE,
  deal_closed_at TIMESTAMP WITH TIME ZONE,
  deal_stage_id TEXT,
  deal_stage_name TEXT,
  deal_source_name TEXT,
  deal_lost_reason_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  campaign_name TEXT,
  organization_name TEXT,
  user_id TEXT,
  user_name TEXT,
  interactions INTEGER DEFAULT 0,
  win BOOLEAN DEFAULT false,
  hold BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  last_activity_content TEXT,
  sync_job_id UUID REFERENCES rd_sync_jobs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.deals_normalized ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view normalized deals from their sync jobs" 
ON public.deals_normalized 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM rd_sync_jobs 
  WHERE rd_sync_jobs.id = deals_normalized.sync_job_id 
  AND (auth.uid() = rd_sync_jobs.user_id OR rd_sync_jobs.user_id IS NULL)
));

CREATE POLICY "Users can insert normalized deals" 
ON public.deals_normalized 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update normalized deals" 
ON public.deals_normalized 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM rd_sync_jobs 
  WHERE rd_sync_jobs.id = deals_normalized.sync_job_id 
  AND (auth.uid() = rd_sync_jobs.user_id OR rd_sync_jobs.user_id IS NULL)
));

-- Índices para performance
CREATE INDEX idx_deals_normalized_rd_deal_id ON public.deals_normalized(rd_deal_id);
CREATE INDEX idx_deals_normalized_sync_job_id ON public.deals_normalized(sync_job_id);
CREATE INDEX idx_deals_normalized_deal_created_at ON public.deals_normalized(deal_created_at);
CREATE INDEX idx_deals_normalized_deal_stage_name ON public.deals_normalized(deal_stage_name);
CREATE INDEX idx_deals_normalized_campaign_name ON public.deals_normalized(campaign_name);

-- Trigger para updated_at
CREATE TRIGGER update_deals_normalized_updated_at
BEFORE UPDATE ON public.deals_normalized
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna last_sync_date na tabela rd_sync_jobs para controle incremental
ALTER TABLE public.rd_sync_jobs 
ADD COLUMN last_sync_date TIMESTAMP WITH TIME ZONE;