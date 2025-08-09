import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const SimpleTest: React.FC = () => {
  const [results, setResults] = useState<any>({})

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 Iniciando testes de diagnóstico...')
      
      try {
        // Test 1: Basic connection
        console.log('Test 1: Conexão básica')
        const { data: authData, error: authError } = await supabase.auth.getUser()
        console.log('Auth:', { user: authData?.user?.id, error: authError })
        
        // Test 2: Direct table query
        console.log('Test 2: Query direta na tabela')
        const { data: tableData, error: tableError, count } = await supabase
          .from('deals_normalized')
          .select('*', { count: 'exact', head: true })
        console.log('Table query:', { count, error: tableError })
        
        // Test 3: Simple RPC test
        console.log('Test 3: Teste RPC simples')
        const { data: rpcData, error: rpcError } = await supabase.rpc('execute_analytics_query', {
          sql_query: 'SELECT COUNT(*) as total FROM deals_normalized'
        })
        console.log('RPC test:', { data: rpcData, error: rpcError })
        
        // Test 4: Check if table exists
        console.log('Test 4: Verificar se tabela existe')
        const { data: schemaData, error: schemaError } = await supabase.rpc('execute_analytics_query', {
          sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals_normalized'"
        })
        console.log('Schema check:', { data: schemaData, error: schemaError })
        
        setResults({
          auth: { user: authData?.user?.id, error: authError?.message },
          table: { count, error: tableError?.message },
          rpc: { data: rpcData, error: rpcError?.message },
          schema: { data: schemaData, error: schemaError?.message }
        })
        
      } catch (error) {
        console.error('❌ Erro nos testes:', error)
        setResults({ error: error.message })
      }
    }
    
    runTests()
  }, [])

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 9999,
      fontSize: '12px',
      color: 'black'
    }}>
      <h3>🧪 Diagnóstico Supabase</h3>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  )
}
