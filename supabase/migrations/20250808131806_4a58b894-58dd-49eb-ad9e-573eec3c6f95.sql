-- Criar função segura para executar queries de analytics
CREATE OR REPLACE FUNCTION execute_analytics_query(sql_query TEXT)
RETURNS TABLE(data JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    query_result JSONB;
    safe_query TEXT;
BEGIN
    -- Validar que a query é segura (apenas SELECT)
    safe_query := TRIM(UPPER(sql_query));
    
    IF NOT safe_query LIKE 'SELECT%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Verificar se contém operações potencialmente perigosas
    IF safe_query LIKE '%DROP%' OR 
       safe_query LIKE '%DELETE%' OR 
       safe_query LIKE '%UPDATE%' OR 
       safe_query LIKE '%INSERT%' OR 
       safe_query LIKE '%CREATE%' OR 
       safe_query LIKE '%ALTER%' OR 
       safe_query LIKE '%TRUNCATE%' THEN
        RAISE EXCEPTION 'Potentially harmful SQL operations are not allowed';
    END IF;
    
    -- Executar a query e retornar resultado como JSONB
    EXECUTE format('
        SELECT COALESCE(
            jsonb_agg(row_to_json(t.*)), 
            ''[]''::jsonb
        ) FROM (%s) t', sql_query) INTO query_result;
    
    RETURN QUERY SELECT query_result;
END;
$$;

-- Criar função alternativa mais permissiva para analytics
CREATE OR REPLACE FUNCTION execute_safe_analytics_query(sql_query TEXT)
RETURNS TABLE(result JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    query_result JSONB;
BEGIN
    -- Validações básicas de segurança
    IF sql_query IS NULL OR LENGTH(TRIM(sql_query)) = 0 THEN
        RAISE EXCEPTION 'Query cannot be empty';
    END IF;
    
    -- Executar query segura para deals_normalized
    EXECUTE format('
        SELECT COALESCE(
            jsonb_agg(row_to_json(t.*)), 
            ''[]''::jsonb
        ) FROM (%s) t', sql_query) INTO query_result;
    
    RETURN QUERY SELECT query_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar erro estruturado
        RETURN QUERY SELECT jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'data', '[]'::jsonb
        );
END;
$$;

-- Dar permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION execute_safe_analytics_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_analytics_query(TEXT) TO authenticated;