-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para executar a sincronização diariamente às 02:00
SELECT cron.schedule(
  'rd-station-daily-sync',
  '0 2 * * *', -- Todo dia às 02:00
  $$
  SELECT
    net.http_post(
        url:='https://eilgptvbqczpfgmojnvm.supabase.co/functions/v1/rd-station-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGdwdHZicWN6cGZnbW9qbnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjAwNDMsImV4cCI6MjA2OTk5NjA0M30.0Eyzg_OH3QnMOrUVB07Z0Ai6K9234O-kMot_N77eo4o"}'::jsonb,
        body:='{"auto_sync": true}'::jsonb
    ) as request_id;
  $$
);