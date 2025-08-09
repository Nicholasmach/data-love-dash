-- Remover função existente para recriar
DROP FUNCTION IF EXISTS execute_analytics_query(text);

-- Criar função melhorada para executar queries de analytics
CREATE OR REPLACE FUNCTION execute_analytics_query(sql_query TEXT)
RETURNS JSONB 
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

-- Criar tabelas para o sistema de dashboard
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '[]'::jsonb,
    auto_apply_filters BOOLEAN DEFAULT true,
    cache_ttl INTEGER DEFAULT 300,
    refresh_interval_sec INTEGER,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    display TEXT NOT NULL CHECK (display IN ('table', 'scalar', 'line', 'bar', 'area', 'pie', 'composed')),
    dataset_query JSONB NOT NULL,
    visualization_settings JSONB DEFAULT '{}'::jsonb,
    collection_id UUID,
    archived BOOLEAN DEFAULT false,
    cache_ttl INTEGER DEFAULT 300,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    col INTEGER NOT NULL DEFAULT 0,
    row INTEGER NOT NULL DEFAULT 0,
    size_x INTEGER NOT NULL DEFAULT 4,
    size_y INTEGER NOT NULL DEFAULT 3,
    series INTEGER DEFAULT 0,
    parameter_mappings JSONB DEFAULT '{}'::jsonb,
    visualization_settings_override JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para dashboards
CREATE POLICY "Users can view their own dashboards" ON dashboards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboards" ON dashboards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards" ON dashboards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" ON dashboards
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para cards
CREATE POLICY "Users can view all cards" ON cards
    FOR SELECT USING (true);

CREATE POLICY "Users can insert cards" ON cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update cards" ON cards
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete cards" ON cards
    FOR DELETE USING (true);

-- Políticas RLS para dashboard_cards
CREATE POLICY "Users can view dashboard cards from their dashboards" ON dashboard_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dashboards 
            WHERE dashboards.id = dashboard_cards.dashboard_id 
            AND dashboards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert dashboard cards to their dashboards" ON dashboard_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM dashboards 
            WHERE dashboards.id = dashboard_cards.dashboard_id 
            AND dashboards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update dashboard cards from their dashboards" ON dashboard_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM dashboards 
            WHERE dashboards.id = dashboard_cards.dashboard_id 
            AND dashboards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete dashboard cards from their dashboards" ON dashboard_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM dashboards 
            WHERE dashboards.id = dashboard_cards.dashboard_id 
            AND dashboards.user_id = auth.uid()
        )
    );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_cards_updated_at
    BEFORE UPDATE ON dashboard_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Dar permissões
GRANT EXECUTE ON FUNCTION execute_analytics_query(TEXT) TO authenticated;