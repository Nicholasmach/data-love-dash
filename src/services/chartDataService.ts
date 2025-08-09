import { supabase } from '@/integrations/supabase/client'
import { DateRange } from 'react-day-picker'

export interface TemplateFilters {
  dateRange?: DateRange
  dealStage?: string
  dealSource?: string
  campaign?: string
  seller?: string
  pipeline?: string
}

export interface ChartDataService {
  executeQuery: (query: string, parameters?: Record<string, any>) => Promise<any[]>
  getFilteredDeals: (filters: TemplateFilters) => Promise<any[]>
}

export const chartDataService: ChartDataService = {
  // Execute raw SQL via Supabase RPC
  executeQuery: async (query: string, parameters = {}) => {
    let processedQuery = query
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processedQuery = processedQuery.replace(new RegExp(placeholder, 'g'), String(value))
    })
    processedQuery = processedQuery.replace(/\s+/g, ' ').trim()
    const { data, error } = await supabase.rpc('execute_analytics_query', { sql_query: processedQuery })
    if (error) throw error
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch {
        return []
      }
    }
    return Array.isArray(data) ? data : []
  },

  // Query builder for raw rows with filters
  getFilteredDeals: async (filters: TemplateFilters) => {
    let query = supabase
      .from('deals_normalized')
      .select(`
        deal_amount_total,
        deal_created_at,
        win,
        hold,
        deal_stage_name,
        campaign_name,
        user_name,
        organization_name,
        deal_source_name
      `)
    if (filters.dateRange?.from) query = query.gte('deal_created_at', filters.dateRange.from.toISOString())
    if (filters.dateRange?.to) query = query.lte('deal_created_at', filters.dateRange.to.toISOString())
    if (filters.dealStage) query = query.eq('deal_stage_name', filters.dealStage)
    if (filters.dealSource) query = query.eq('deal_source_name', filters.dealSource)
    if (filters.campaign) query = query.eq('campaign_name', filters.campaign)
    if (filters.seller) query = query.eq('user_name', filters.seller)
    if (filters.pipeline) query = query.eq('organization_name', filters.pipeline)
    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}

export default chartDataService
