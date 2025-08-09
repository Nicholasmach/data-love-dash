-- Fix the execute_analytics_query function to properly access public schema
CREATE OR REPLACE FUNCTION public.execute_analytics_query(sql_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$