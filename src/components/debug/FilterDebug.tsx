import React, { useEffect, useState } from 'react'
import { useTemplate } from '@/contexts/TemplateContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'

export const FilterDebug: React.FC = () => {
  const { filters, chartData, loading, filterOptions } = useTemplate()
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [rpcTest, setRpcTest] = useState<any>(null)

  useEffect(() => {
    // Test basic Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('deals_normalized').select('count', { count: 'exact', head: true })
        setConnectionTest({ success: true, count: data, error: null })
      } catch (err) {
        setConnectionTest({ success: false, error: err })
      }
    }

    // Test RPC function
    const testRPC = async () => {
      try {
        const { data, error } = await supabase.rpc('execute_analytics_query', {
          sql_query: 'SELECT COUNT(*) as total FROM deals_normalized'
        })
        setRpcTest({ success: true, data, error })
      } catch (err) {
        setRpcTest({ success: false, error: err })
      }
    }

    testConnection()
    testRPC()
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug - Estado dos Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Filtros Ativos:</h4>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold">Opções de Filtro Carregadas:</h4>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify({
                dealStages: filterOptions.dealStages.length,
                dealSources: filterOptions.dealSources.length,
                campaigns: filterOptions.campaigns.length,
                sellers: filterOptions.sellers.length,
                pipelines: filterOptions.pipelines.length
              }, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold">Dados dos Gráficos:</h4>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify({
                bigNumbers: chartData.bigNumbers,
                revenue: chartData.revenue?.length || 0,
                dealsByStatus: chartData.dealsByStatus?.length || 0,
                dealsByStage: chartData.dealsByStage?.length || 0,
                loading
              }, null, 2)}
            </pre>
            <h4 className="font-semibold mt-2">Resultado Bruto (revenue):</h4>
            <pre className="bg-muted p-2 rounded text-xs">
              {JSON.stringify(chartData.revenue, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold">Teste de Conexão Supabase:</h4>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify(connectionTest, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold">Teste RPC Function:</h4>
            <pre className="bg-muted p-2 rounded text-sm">
              {JSON.stringify(rpcTest, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
