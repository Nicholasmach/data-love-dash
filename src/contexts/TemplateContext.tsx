import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { chartDataService, TemplateFilters } from '@/services/chartDataService'
import { DateRange } from 'react-day-picker'

interface BigNumbers {
  totalRevenue: number
  totalDeals: number
}
interface RevenuePoint {
  period: string
  revenue: number
  deals_count: number
}
interface DealsByStatus {
  status: string
  count: number
  total_value: number
}
interface DealsByStage {
  stage: string
  count: number
  total_value: number
}
interface PerformanceByCampaign {
  campaign: string
  leads: number
  conversions: number
  revenue: number
}
interface MonthlyTrend {
  month: string
  total_deals: number
  won_deals: number
  revenue: number
}
interface SourceDistribution {
  source: string
  count: number
  total_value: number
}
interface ConversionRate {
  stage: string
  total: number
  converted: number
  conversion_rate: number
}
interface TopPerformer {
  owner: string
  deals_count: number
  won_deals: number
  total_revenue: number
}

interface TemplateChartData {
  bigNumbers: BigNumbers
  revenue: RevenuePoint[]
  dealsByStatus: DealsByStatus[]
  dealsByStage: DealsByStage[]
  performanceByCampaign: PerformanceByCampaign[]
  monthlyTrends: MonthlyTrend[]
  sourceDistribution: SourceDistribution[]
  conversionRates: ConversionRate[]
  topPerformers: TopPerformer[]
}

interface TemplateContextType {
  filters: TemplateFilters
  chartData: TemplateChartData
  filterOptions: {
    dealStages: string[]
    dealSources: string[]
    campaigns: string[]
    sellers: string[]
    pipelines: string[]
  }
  loading: boolean
  updateFilters: (f: Partial<TemplateFilters>) => void
  resetFilters: () => void
  applyFilters: () => void
}

const TemplateContext = createContext<TemplateContextType | null>(null)

export const useTemplate = () => {
  const ctx = useContext(TemplateContext)
  if (!ctx) throw new Error('useTemplate must be used within TemplateProvider')
  return ctx
}

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<TemplateFilters>({})
  const [filterOptions, setFilterOptions] = useState({
    dealStages: [] as string[],
    dealSources: [] as string[],
    campaigns: [] as string[],
    sellers: [] as string[],
    pipelines: [] as string[],
  })
  const [chartData, setChartData] = useState<TemplateChartData>({
    bigNumbers: { totalRevenue: 0, totalDeals: 0 },
    revenue: [],
    dealsByStatus: [],
    dealsByStage: [],
    performanceByCampaign: [],
    monthlyTrends: [],
    sourceDistribution: [],
    conversionRates: [],
    topPerformers: [],
  })
  const [loading, setLoading] = useState(false)

  // Load filter options on mount
  useEffect(() => {
    ;(async () => {
      try {
        const [stages, sources, camps, sellers, pipes] = await Promise.all([
          chartDataService.executeQuery(
            'SELECT DISTINCT deal_stage_name FROM deals_normalized WHERE deal_stage_name IS NOT NULL AND deal_stage_name != \'\' ORDER BY deal_stage_name'
          ),
          chartDataService.executeQuery(
            'SELECT DISTINCT deal_source_name FROM deals_normalized WHERE deal_source_name IS NOT NULL AND deal_source_name != \'\' ORDER BY deal_source_name'
          ),
          chartDataService.executeQuery(
            'SELECT DISTINCT campaign_name FROM deals_normalized WHERE campaign_name IS NOT NULL AND campaign_name != \'\' ORDER BY campaign_name'
          ),
          chartDataService.executeQuery(
            'SELECT DISTINCT user_name FROM deals_normalized WHERE user_name IS NOT NULL AND user_name != \'\' ORDER BY user_name'
          ),
          chartDataService.executeQuery(
            'SELECT DISTINCT organization_name FROM deals_normalized WHERE organization_name IS NOT NULL AND organization_name != \'\' ORDER BY organization_name'
          ),
        ])
        setFilterOptions({
          dealStages: stages.map(r => r.deal_stage_name).filter(Boolean),
          dealSources: sources.map(r => r.deal_source_name).filter(Boolean),
          campaigns: camps.map(r => r.campaign_name).filter(Boolean),
          sellers: sellers.map(r => r.user_name).filter(Boolean),
          pipelines: pipes.map(r => r.organization_name).filter(Boolean),
        })
      } catch (e) {
        console.error('Erro ao carregar opções de filtro', e)
      }
    })()
  }, [])

  const loadChartData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all raw rows using filters
      const rows = await chartDataService.getFilteredDeals(filters)

      // Big numbers
      const totalDeals = rows.length
      const totalRevenue = rows.reduce((sum, r) => sum + (r.deal_amount_total || 0), 0)

      // Revenue over time (month)
      const revenueMap: Record<string, RevenuePoint> = {}
      rows.forEach(r => {
        const key = new Date(r.deal_created_at).toISOString().slice(0, 7)
        if (!revenueMap[key]) revenueMap[key] = { period: key, revenue: 0, deals_count: 0 }
        revenueMap[key].revenue += r.deal_amount_total || 0
        revenueMap[key].deals_count += 1
      })
      const revenue = Object.values(revenueMap).sort((a, b) => a.period.localeCompare(b.period))

      // Deals by status
      const statusMap: Record<string, DealsByStatus> = {}
      rows.forEach(r => {
        const status = r.win ? 'Ganho' : r.hold ? 'Em Espera' : 'Em Andamento'
        if (!statusMap[status]) statusMap[status] = { status, count: 0, total_value: 0 }
        statusMap[status].count++
        statusMap[status].total_value += r.deal_amount_total || 0
      })
      const dealsByStatus = Object.values(statusMap)

      // Deals by stage
      const stageMap: Record<string, DealsByStage> = {}
      rows.forEach(r => {
        const stage = r.deal_stage_name || 'Sem Estágio'
        if (!stageMap[stage]) stageMap[stage] = { stage, count: 0, total_value: 0 }
        stageMap[stage].count++
        stageMap[stage].total_value += r.deal_amount_total || 0
      })
      const dealsByStage = Object.values(stageMap)

      // Performance by campaign
      const campMap: Record<string, PerformanceByCampaign> = {}
      rows.forEach(r => {
        const camp = r.campaign_name || 'Sem Campanha'
        if (!campMap[camp]) campMap[camp] = { campaign: camp, leads: 0, conversions: 0, revenue: 0 }
        campMap[camp].leads++
        if (r.win) campMap[camp].conversions++
        campMap[camp].revenue += r.deal_amount_total || 0
      })
      const performanceByCampaign = Object.values(campMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

      // Monthly trends
      const monthMap: Record<string, MonthlyTrend> = {}
      rows.forEach(r => {
        const key = new Date(r.deal_created_at).toISOString().slice(0, 7)
        if (!monthMap[key]) monthMap[key] = { month: key, total_deals: 0, won_deals: 0, revenue: 0 }
        monthMap[key].total_deals++
        if (r.win) monthMap[key].won_deals++
        monthMap[key].revenue += r.deal_amount_total || 0
      })
      const monthlyTrends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(0, 12)

      // Source distribution
      const sourceMap: Record<string, SourceDistribution> = {}
      rows.forEach(r => {
        const src = r.deal_source_name || 'Origem Desconhecida'
        if (!sourceMap[src]) sourceMap[src] = { source: src, count: 0, total_value: 0 }
        sourceMap[src].count++
        sourceMap[src].total_value += r.deal_amount_total || 0
      })
      const sourceDistribution = Object.values(sourceMap)

      // Conversion rates
      const convMap: Record<string, ConversionRate> = {}
      rows.forEach(r => {
        const st = r.deal_stage_name || 'Sem Estágio'
        if (!convMap[st]) convMap[st] = { stage: st, total: 0, converted: 0, conversion_rate: 0 }
        convMap[st].total++
        if (r.win) convMap[st].converted++
      })
      const conversionRates = Object.values(convMap).map(cr => ({
        ...cr,
        conversion_rate: +(cr.converted / cr.total * 100).toFixed(2),
      })).sort((a, b) => b.conversion_rate - a.conversion_rate)

      // Top performers
      const perfMap: Record<string, TopPerformer> = {}
      rows.forEach(r => {
        const owner = r.user_name || 'Sem Responsável'
        if (!perfMap[owner]) perfMap[owner] = { owner, deals_count: 0, won_deals: 0, total_revenue: 0 }
        perfMap[owner].deals_count++
        if (r.win) perfMap[owner].won_deals++
        perfMap[owner].total_revenue += r.deal_amount_total || 0
      })
      const topPerformers = Object.values(perfMap).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10)

      setChartData({
        bigNumbers: { totalRevenue, totalDeals },
        revenue,
        dealsByStatus,
        dealsByStage,
        performanceByCampaign,
        monthlyTrends,
        sourceDistribution,
        conversionRates,
        topPerformers,
      })
    } catch (e) {
      console.error('Erro agrupando dados:', e)
      // reset to zero
      setChartData({
        bigNumbers: { totalRevenue: 0, totalDeals: 0 },
        revenue: [],
        dealsByStatus: [],
        dealsByStage: [],
        performanceByCampaign: [],
        monthlyTrends: [],
        sourceDistribution: [],
        conversionRates: [],
        topPerformers: [],
      })
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadChartData()
  }, [loadChartData])

  const updateFilters = (newF: Partial<TemplateFilters>) =>
    setFilters(prev => ({ ...prev, ...newF }))
  const resetFilters = () => setFilters({})
  const applyFilters = () => loadChartData()

  return (
    <TemplateContext.Provider
      value={{
        filters,
        chartData,
        filterOptions,
        loading,
        updateFilters,
        resetFilters,
        applyFilters,
      }}
    >
      {children}
    </TemplateContext.Provider>
  )
}
