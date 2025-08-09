-- Create function to execute SQL queries safely for analytics
CREATE OR REPLACE FUNCTION public.execute_analytics_query(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Only allow SELECT statements for security
    IF sql_query !~* '^\s*SELECT' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Prevent harmful operations
    IF sql_query ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)' THEN
        RAISE EXCEPTION 'Potentially harmful SQL operations are not allowed';
    END IF;
    
    -- Execute the query and return as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;