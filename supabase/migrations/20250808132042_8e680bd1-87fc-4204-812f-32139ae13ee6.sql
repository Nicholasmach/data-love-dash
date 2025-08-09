-- Corrigir problemas de segurança detectados

-- Corrigir function search path para execute_analytics_query
CREATE OR REPLACE FUNCTION execute_analytics_query(sql_query TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    query_result JSONB;
    safe_query TEXT;
BEGIN
    -- Validar que a query é segura (apenas SELECT)
    safe_query := TRIM(UPPER(sql_query));
    
    IF NOT safe_query LIKE 'SELECT%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Verificar se contém operações potencialmente perigosas
    IF safe_query ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|;.*SELECT)' THEN
        RAISE EXCEPTION 'Potentially harmful SQL operations are not allowed';
    END IF;
    
    -- Executar a query e retornar resultado como JSONB
    EXECUTE format('
        SELECT COALESCE(
            jsonb_agg(row_to_json(t.*)), 
            ''[]''::jsonb
        ) FROM (%s) t', sql_query) INTO query_result;
    
    RETURN query_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar erro estruturado
        RETURN jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'data', '[]'::jsonb
        );
END;
$$;

-- Criar dashboard padrão para usuários logados
INSERT INTO public.dashboards (user_id, name, description, parameters, auto_apply_filters) 
VALUES (
    '3b75cf58-83db-46c4-9496-242860594235', -- User ID específico para teste
    'Dashboard Principal',
    'Dashboard principal com métricas de vendas e performance',
    '[{"id":"date_range","slug":"date_range","type":"date","label":"Período","default":null}]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Criar cards predefinidos baseados nas perguntas existentes
INSERT INTO public.cards (name, description, display, dataset_query) VALUES
(
    'Tendência de Receita Mensal',
    'Evolução da receita nos últimos 12 meses',
    'line',
    '{"type":"native","native":{"query":"SELECT DATE_TRUNC(''month'', deal_created_at) as month, SUM(deal_amount_total) as revenue FROM deals_normalized WHERE deal_created_at >= NOW() - INTERVAL ''12 months'' AND win = true GROUP BY month ORDER BY month"}}'::jsonb
),
(
    'Receita por Fonte de Lead',
    'Distribuição da receita por origem dos leads',
    'pie',
    '{"type":"native","native":{"query":"SELECT deal_source_name as source, SUM(deal_amount_total) as revenue FROM deals_normalized WHERE win = true AND deal_source_name IS NOT NULL GROUP BY deal_source_name ORDER BY revenue DESC"}}'::jsonb
),
(
    'Geração de Leads Mensal',
    'Número de leads gerados por mês',
    'bar',
    '{"type":"native","native":{"query":"SELECT DATE_TRUNC(''month'', deal_created_at) as month, COUNT(*) as leads_count FROM deals_normalized WHERE deal_created_at >= NOW() - INTERVAL ''12 months'' GROUP BY month ORDER BY month"}}'::jsonb
),
(
    'Taxa de Conversão Mensal',
    'Evolução da taxa de conversão ao longo do tempo',
    'line',
    '{"type":"native","native":{"query":"SELECT DATE_TRUNC(''month'', deal_created_at) as month, COUNT(*) as total_leads, COUNT(*) FILTER (WHERE win = true) as won_deals, ROUND((COUNT(*) FILTER (WHERE win = true)::float / COUNT(*)) * 100, 2) as conversion_rate FROM deals_normalized WHERE deal_created_at >= NOW() - INTERVAL ''12 months'' GROUP BY month ORDER BY month"}}'::jsonb
),
(
    'Ticket Médio por Período',
    'Evolução do ticket médio das vendas',
    'line',
    '{"type":"native","native":{"query":"SELECT DATE_TRUNC(''month'', deal_created_at) as month, ROUND(AVG(deal_amount_total), 2) as avg_deal_size, COUNT(*) as deals_count FROM deals_normalized WHERE win = true AND deal_created_at >= NOW() - INTERVAL ''12 months'' GROUP BY month ORDER BY month"}}'::jsonb
)
ON CONFLICT DO NOTHING;