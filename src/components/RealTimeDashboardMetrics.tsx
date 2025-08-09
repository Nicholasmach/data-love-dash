import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, Activity } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  isLoading?: boolean
}

interface RealTimeDashboardMetricsProps {
  filters?: any
}

const MetricCard = ({ title, value, change, changeLabel, icon, trend = 'neutral', isLoading }: MetricCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />
      case 'down': return <TrendingDown className="w-4 h-4" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded mb-1"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change.toFixed(2)}% {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const RealTimeDashboardMetrics = ({ filters }: RealTimeDashboardMetricsProps) => {
  // Debug logs
  console.log('RealTimeDashboardMetrics - filters received:', filters)
  
  // Real-time metrics from Supabase with filters
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: async () => {
      console.log('Query function called with filters:', filters)
      
      // Check if any filters are applied - treat null/undefined and empty objects as no filters
      const hasFilters = filters && Object.keys(filters).length > 0 && (
        (filters?.dateRange?.from && filters?.dateRange?.to) ||
        (filters?.seller && filters.seller !== 'all' && filters.seller !== '') ||
        (filters?.stage && filters.stage !== 'all' && filters.stage !== '')
      )
      
      console.log('Has filters:', hasFilters)
      console.log('Filters details:', {
        dateRange: filters?.dateRange,
        seller: filters?.seller,
        stage: filters?.stage
      })

      // Current period query
      let currentQuery = supabase
        .from('deals_normalized')
        .select('deal_amount_total, win, deal_created_at, interactions')

      // Apply filters only if they are set
      if (filters?.dateRange?.from && filters?.dateRange?.to) {
        currentQuery = currentQuery
          .gte('deal_created_at', filters.dateRange.from.toISOString())
          .lte('deal_created_at', filters.dateRange.to.toISOString())
      }

      if (filters?.seller && filters.seller !== 'all') {
        const sellerNameMap: { [key: string]: string } = {
          'vitoria': 'Vitória',
          'luan': 'Luan Paiva',
          'alexandre': 'Alexandre Figueredo',
          'anna': 'Anna',
          'vanessa': 'Vanessa Virginia Brito',
          'juliana': 'Juliana',
          'dalton': 'Dalton Filho',
          'roberta': 'Roberta Leite'
        }
        const sellerName = sellerNameMap[filters.seller]
        if (sellerName) {
          currentQuery = currentQuery.eq('user_name', sellerName)
        }
      }

      if (filters?.stage && filters.stage !== 'all') {
        const stageNameMap: { [key: string]: string } = {
          'nova': 'Nova Negociação',
          'contato': 'Contato Estabelecido',
          'qualificacao': 'Qualificação',
          'visita_agendada': 'Visita Agendada',
          'visita_realizada': 'Visita Realizada',
          'negociacao': 'Em negociação',
          'concluida': 'Negociação concluída'
        }
        const stageName = stageNameMap[filters.stage]
        if (stageName) {
          currentQuery = currentQuery.eq('deal_stage_name', stageName)
        }
      }

      const { data: currentDeals } = await currentQuery

      // Calculate current metrics
      const totalValue = currentDeals?.reduce((sum, deal) => sum + (Number(deal.deal_amount_total) || 0), 0) || 0
      const totalLeads = currentDeals?.length || 0
      const totalWon = currentDeals?.filter(deal => deal.win).length || 0
      const conversionRate = totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0

      // For comparison period - always compare with previous period
      let previousQuery = supabase
        .from('deals_normalized')
        .select('deal_amount_total, win, deal_created_at')

      if (filters?.dateRange?.from && filters?.dateRange?.to) {
        // If date filter is applied, compare with previous period of same length
        const daysDiff = Math.floor((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        const previousFrom = new Date(filters.dateRange.from.getTime() - (daysDiff * 24 * 60 * 60 * 1000))
        const previousTo = filters.dateRange.from
        
        previousQuery = previousQuery
          .gte('deal_created_at', previousFrom.toISOString())
          .lt('deal_created_at', previousTo.toISOString())
      } else {
        // If no date filter, compare this month vs last month
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = thisMonthStart
        
        previousQuery = previousQuery
          .gte('deal_created_at', lastMonthStart.toISOString())
          .lt('deal_created_at', lastMonthEnd.toISOString())

        // If no filters applied at all, we need to get the current month data for comparison
        if (!hasFilters) {
          console.log('No filters applied - getting all data for display')
          
          // Get current month data for comparison
          currentQuery = supabase
            .from('deals_normalized')
            .select('deal_amount_total, win, deal_created_at, interactions')
            .gte('deal_created_at', thisMonthStart.toISOString())

          const { data: thisMonthDeals } = await currentQuery
          console.log('This month deals:', thisMonthDeals?.length)
          
          const thisMonthValue = thisMonthDeals?.reduce((sum, deal) => sum + (Number(deal.deal_amount_total) || 0), 0) || 0
          const thisMonthLeads = thisMonthDeals?.length || 0
          const thisMonthWon = thisMonthDeals?.filter(deal => deal.win).length || 0
          const thisMonthConversion = thisMonthLeads > 0 ? (thisMonthWon / thisMonthLeads) * 100 : 0

          // Get all data for display but use this month for comparison
          const { data: allDeals } = await supabase
            .from('deals_normalized')
            .select('deal_amount_total, win, deal_created_at, interactions')

          console.log('All deals:', allDeals?.length)
          const allValue = allDeals?.reduce((sum, deal) => sum + (Number(deal.deal_amount_total) || 0), 0) || 0
          const allLeads = allDeals?.length || 0
          const allWon = allDeals?.filter(deal => deal.win).length || 0
          const allConversion = allLeads > 0 ? (allWon / allLeads) * 100 : 0
          
          console.log('All data - Value:', allValue, 'Leads:', allLeads, 'Won:', allWon)

          // For previous month comparison
          const { data: lastMonthDeals } = await previousQuery
          const lastMonthValue = lastMonthDeals?.reduce((sum, deal) => sum + (Number(deal.deal_amount_total) || 0), 0) || 0
          const lastMonthLeads = lastMonthDeals?.length || 0
          const lastMonthWon = lastMonthDeals?.filter(deal => deal.win).length || 0
          const lastMonthConversion = lastMonthLeads > 0 ? (lastMonthWon / lastMonthLeads) * 100 : 0

          // Calculate changes based on this month vs last month
          const valueChange = lastMonthValue > 0 ? ((thisMonthValue - lastMonthValue) / lastMonthValue) * 100 : 0
          const leadsChange = lastMonthLeads > 0 ? ((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100 : 0
          const conversionChange = lastMonthConversion > 0 ? ((thisMonthConversion - lastMonthConversion) / lastMonthConversion) * 100 : 0
          const wonChange = lastMonthWon > 0 ? ((thisMonthWon - lastMonthWon) / lastMonthWon) * 100 : 0

          return {
            totalValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(allValue),
            totalLeads: allLeads.toLocaleString('pt-BR'),
            conversionRate: `${allConversion.toFixed(1)}%`,
            totalWon: allWon.toLocaleString('pt-BR'),
            valueChange,
            leadsChange,
            conversionChange,
            wonChange
          }
        }
      }

      // Apply same filters to previous query
      if (filters?.seller && filters.seller !== 'all') {
        const sellerNameMap: { [key: string]: string } = {
          'vitoria': 'Vitória',
          'luan': 'Luan Paiva',
          'alexandre': 'Alexandre Figueredo',
          'anna': 'Anna',
          'vanessa': 'Vanessa Virginia Brito',
          'juliana': 'Juliana',
          'dalton': 'Dalton Filho',
          'roberta': 'Roberta Leite'
        }
        const sellerName = sellerNameMap[filters.seller]
        if (sellerName) {
          previousQuery = previousQuery.eq('user_name', sellerName)
        }
      }

      if (filters?.stage && filters.stage !== 'all') {
        const stageNameMap: { [key: string]: string } = {
          'nova': 'Nova Negociação',
          'contato': 'Contato Estabelecido',
          'qualificacao': 'Qualificação',
          'visita_agendada': 'Visita Agendada',
          'visita_realizada': 'Visita Realizada',
          'negociacao': 'Em negociação',
          'concluida': 'Negociação concluída'
        }
        const stageName = stageNameMap[filters.stage]
        if (stageName) {
          previousQuery = previousQuery.eq('deal_stage_name', stageName)
        }
      }

      const { data: previousDeals } = await previousQuery

      // Calculate previous metrics
      const previousValue = previousDeals?.reduce((sum, deal) => sum + (Number(deal.deal_amount_total) || 0), 0) || 0
      const previousLeads = previousDeals?.length || 0
      const previousWon = previousDeals?.filter(deal => deal.win).length || 0
      const previousConversion = previousLeads > 0 ? (previousWon / previousLeads) * 100 : 0

      // Calculate changes
      const valueChange = previousValue > 0 ? ((totalValue - previousValue) / previousValue) * 100 : 0
      const leadsChange = previousLeads > 0 ? ((totalLeads - previousLeads) / previousLeads) * 100 : 0
      const conversionChange = previousConversion > 0 ? ((conversionRate - previousConversion) / previousConversion) * 100 : 0
      const wonChange = previousWon > 0 ? ((totalWon - previousWon) / previousWon) * 100 : 0

      return {
        totalValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue),
        totalLeads: totalLeads.toLocaleString('pt-BR'),
        conversionRate: `${conversionRate.toFixed(1)}%`,
        totalWon: totalWon.toLocaleString('pt-BR'),
        valueChange,
        leadsChange,
        conversionChange,
        wonChange
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const metricsData = [
    {
      title: "Valor Total Pipeline",
      value: metrics?.totalValue || "R$ 0",
      change: metrics?.valueChange,
      changeLabel: "vs período anterior",
      icon: <DollarSign className="w-4 h-4 text-primary" />,
      trend: (metrics?.valueChange || 0) >= 0 ? 'up' as const : 'down' as const
    },
    {
      title: "Total de Leads",
      value: metrics?.totalLeads || "0",
      change: metrics?.leadsChange,
      changeLabel: "vs período anterior",
      icon: <Users className="w-4 h-4 text-primary" />,
      trend: (metrics?.leadsChange || 0) >= 0 ? 'up' as const : 'down' as const
    },
    {
      title: "Taxa de Conversão",
      value: metrics?.conversionRate || "0%",
      change: metrics?.conversionChange,
      changeLabel: "vs período anterior",
      icon: <Target className="w-4 h-4 text-primary" />,
      trend: (metrics?.conversionChange || 0) >= 0 ? 'up' as const : 'down' as const
    },
    {
      title: "Deals Fechados",
      value: metrics?.totalWon || "0",
      change: metrics?.wonChange,
      changeLabel: "vs período anterior",
      icon: <Calendar className="w-4 h-4 text-primary" />,
      trend: (metrics?.wonChange || 0) >= 0 ? 'up' as const : 'down' as const
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Indicadores Principais</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/5">
            <Activity className="w-3 h-3 mr-1" />
            Dados em tempo real
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => (
          <MetricCard key={index} {...metric} isLoading={isLoading} />
        ))}
      </div>
    </div>
  )
}