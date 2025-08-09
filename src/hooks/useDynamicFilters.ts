import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export const useDynamicFilters = () => {
  const sellersQuery = useQuery({
    queryKey: ['dynamic-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('execute_analytics_query', {
        sql_query: `
          SELECT DISTINCT user_name as label, user_name as value
          FROM deals_normalized 
          WHERE user_name IS NOT NULL 
          AND user_name != ''
          ORDER BY user_name
        `
      })
      
      if (error) throw error
      
      const sellers = Array.isArray(data) ? data : []
      return [
        { value: "all", label: "Todos os Vendedores" },
        ...sellers
      ]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  })

  const stagesQuery = useQuery({
    queryKey: ['dynamic-stages'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('execute_analytics_query', {
        sql_query: `
          SELECT DISTINCT deal_stage_name as label, deal_stage_name as value
          FROM deals_normalized 
          WHERE deal_stage_name IS NOT NULL 
          AND deal_stage_name != ''
          ORDER BY deal_stage_name
        `
      })
      
      if (error) throw error
      
      const stages = Array.isArray(data) ? data : []
      return [
        { value: "all", label: "Todos os Estágios" },
        ...stages
      ]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  })

  return {
    sellers: sellersQuery.data || [{ value: "all", label: "Todos os Vendedores" }],
    stages: stagesQuery.data || [{ value: "all", label: "Todos os Estágios" }],
    isLoading: sellersQuery.isLoading || stagesQuery.isLoading,
    error: sellersQuery.error || stagesQuery.error
  }
}