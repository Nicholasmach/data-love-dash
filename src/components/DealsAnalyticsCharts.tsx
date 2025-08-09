import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts'
import { TrendingUp, Users, Target, Calendar, DollarSign, Briefcase, Star, Activity, Zap, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AnalyticsChartProps {
  filters?: any
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-foreground font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Cores sequenciais para contar história
const storyColors = [
  "hsl(var(--primary))",
  "hsl(220, 70%, 60%)",
  "hsl(270, 60%, 65%)",
  "hsl(160, 60%, 55%)",
  "hsl(30, 80%, 60%)",
  "hsl(350, 70%, 60%)",
  "hsl(180, 55%, 55%)",
  "hsl(60, 70%, 55%)",
  "hsl(300, 60%, 65%)",
  "hsl(120, 50%, 55%)"
]

export const DealsAnalyticsCharts = ({ filters }: AnalyticsChartProps) => {
  // Helper function to build filters for all queries
  const buildFilters = (baseQuery: any) => {
    let query = baseQuery

    if (filters?.dateRange?.from && filters?.dateRange?.to) {
      query = query
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
        query = query.eq('user_name', sellerName)
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
        query = query.eq('deal_stage_name', stageName)
      }
    }

    return query
  }

  // 1. Evolução temporal - Como o negócio cresceu
  const { data: monthlyTrends } = useQuery({
    queryKey: ['monthly-trends', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_created_at, deal_amount_total, win')
          .not('deal_created_at', 'is', null)
      )
      
      const { data } = await query

      const monthlyData = data?.reduce((acc: any, deal) => {
        const month = format(new Date(deal.deal_created_at), 'MMM/yy', { locale: ptBR })
        if (!acc[month]) {
          acc[month] = { month, deals: 0, value: 0, won_deals: 0, won_value: 0 }
        }
        acc[month].deals += 1
        acc[month].value += Number(deal.deal_amount_total) || 0
        if (deal.win) {
          acc[month].won_deals += 1
          acc[month].won_value += Number(deal.deal_amount_total) || 0
        }
        return acc
      }, {})

      return Object.values(monthlyData || {}).slice(-12)
    }
  })

  // 2. Funil de vendas - Jornada do cliente
  const { data: salesFunnel } = useQuery({
    queryKey: ['sales-funnel', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_stage_name, deal_amount_total')
          .not('deal_stage_name', 'is', null)
      )
      
      const { data } = await query

      const stageOrder = [
        'Nova Negociação', 'Contato Estabelecido', 'Qualificação', 
        'Visita Agendada', 'Visita Realizada', 'Em negociação', 
        'Negociação concluída', 'Cliente em Potencial'
      ]

      const funnelData = data?.reduce((acc: any, deal) => {
        const stage = deal.deal_stage_name
        if (!acc[stage]) {
          acc[stage] = { stage, count: 0, value: 0 }
        }
        acc[stage].count += 1
        acc[stage].value += Number(deal.deal_amount_total) || 0
        return acc
      }, {})

      return stageOrder.map(stage => funnelData?.[stage] || { stage, count: 0, value: 0 })
        .filter(item => item.count > 0)
    }
  })

  // 3. Performance por campanha - ROI das estratégias
  const { data: campaignPerformance } = useQuery({
    queryKey: ['campaign-performance', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('campaign_name, deal_amount_total, win')
          .not('campaign_name', 'is', null)
          .neq('campaign_name', '')
      )
      
      const { data } = await query

      const campaignData = data?.reduce((acc: any, deal) => {
        const campaign = deal.campaign_name
        if (!acc[campaign]) {
          acc[campaign] = { campaign, deals: 0, value: 0, won: 0, conversion_rate: 0 }
        }
        acc[campaign].deals += 1
        acc[campaign].value += Number(deal.deal_amount_total) || 0
        if (deal.win) acc[campaign].won += 1
        return acc
      }, {})

      return Object.values(campaignData || {})
        .map((item: any) => ({
          ...item,
          conversion_rate: item.deals > 0 ? (item.won / item.deals) * 100 : 0
        }))
        .sort((a: any, b: any) => b.deals - a.deals)
        .slice(0, 10)
    }
  })

  // 4. Performance por vendedor - Quem está gerando resultados
  const { data: salesRepPerformance } = useQuery({
    queryKey: ['sales-rep-performance', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('user_name, deal_amount_total, win')
          .not('user_name', 'is', null)
      )
      
      const { data } = await query

      const repData = data?.reduce((acc: any, deal) => {
        const rep = deal.user_name
        if (!acc[rep]) {
          acc[rep] = { rep, deals: 0, value: 0, won: 0 }
        }
        acc[rep].deals += 1
        acc[rep].value += Number(deal.deal_amount_total) || 0
        if (deal.win) acc[rep].won += 1
        return acc
      }, {})

      return Object.values(repData || {})
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 8)
    }
  })

  // 5. Distribuição de valor por estágio
  const { data: stageValueDistribution } = useQuery({
    queryKey: ['stage-value-distribution', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_stage_name, deal_amount_total')
          .not('deal_stage_name', 'is', null)
          .gt('deal_amount_total', 0)
      )
      
      const { data } = await query

      const stageData = data?.reduce((acc: any, deal) => {
        const stage = deal.deal_stage_name
        if (!acc[stage]) {
          acc[stage] = { name: stage, value: 0, count: 0 }
        }
        acc[stage].value += Number(deal.deal_amount_total)
        acc[stage].count += 1
        return acc
      }, {})

      return Object.values(stageData || {})
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 8)
    }
  })

  // 6. Análise de fontes de lead - De onde vem o dinheiro
  const { data: leadSources } = useQuery({
    queryKey: ['lead-sources', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_source_name, deal_amount_total, win')
          .not('deal_source_name', 'is', null)
      )
      
      const { data } = await query

      const sourceData = data?.reduce((acc: any, deal) => {
        const source = deal.deal_source_name
        if (!acc[source]) {
          acc[source] = { source, deals: 0, value: 0, won: 0 }
        }
        acc[source].deals += 1
        acc[source].value += Number(deal.deal_amount_total) || 0
        if (deal.win) acc[source].won += 1
        return acc
      }, {})

      return Object.values(sourceData || {})
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 8)
    }
  })

  // 7. Taxa de conversão mensal - Eficiência ao longo do tempo
  const { data: monthlyConversion } = useQuery({
    queryKey: ['monthly-conversion', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_created_at, win')
          .not('deal_created_at', 'is', null)
      )
      
      const { data } = await query

      const monthlyData = data?.reduce((acc: any, deal) => {
        const month = format(new Date(deal.deal_created_at), 'MMM/yy', { locale: ptBR })
        if (!acc[month]) {
          acc[month] = { month, total: 0, won: 0, rate: 0 }
        }
        acc[month].total += 1
        if (deal.win) acc[month].won += 1
        return acc
      }, {})

      return Object.values(monthlyData || {})
        .map((item: any) => ({
          ...item,
          rate: item.total > 0 ? (item.won / item.total) * 100 : 0
        }))
        .slice(-12)
    }
  })

  // 8. Análise de ciclo de vendas - Quanto tempo para fechar
  const { data: salesCycle } = useQuery({
    queryKey: ['sales-cycle', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_created_at, deal_closed_at, deal_amount_total, campaign_name')
          .not('deal_created_at', 'is', null)
          .not('deal_closed_at', 'is', null)
      )
      
      const { data } = await query

      const cycleData = data?.map(deal => {
        const created = new Date(deal.deal_created_at)
        const closed = new Date(deal.deal_closed_at)
        const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return {
          campaign: deal.campaign_name || 'Outros',
          cycle_days: days,
          value: Number(deal.deal_amount_total) || 0
        }
      }).filter(item => item.cycle_days >= 0 && item.cycle_days <= 365)

      const campaignCycles = cycleData?.reduce((acc: any, deal) => {
        const campaign = deal.campaign
        if (!acc[campaign]) {
          acc[campaign] = { campaign, avg_days: 0, total_days: 0, count: 0, avg_value: 0, total_value: 0 }
        }
        acc[campaign].total_days += deal.cycle_days
        acc[campaign].count += 1
        acc[campaign].total_value += deal.value
        return acc
      }, {})

      return Object.values(campaignCycles || {})
        .map((item: any) => ({
          ...item,
          avg_days: item.count > 0 ? Math.round(item.total_days / item.count) : 0,
          avg_value: item.count > 0 ? Math.round(item.total_value / item.count) : 0
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 8)
    }
  })

  // 9. Análise de interações - Engajamento que converte
  const { data: interactionAnalysis } = useQuery({
    queryKey: ['interaction-analysis', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('interactions, win, deal_amount_total')
          .not('interactions', 'is', null)
      )
      
      const { data } = await query

      const interactionRanges = [
        { range: '0 interações', min: 0, max: 0 },
        { range: '1-2 interações', min: 1, max: 2 },
        { range: '3-5 interações', min: 3, max: 5 },
        { range: '6-10 interações', min: 6, max: 10 },
        { range: '11+ interações', min: 11, max: Infinity }
      ]

      return interactionRanges.map(range => {
        const rangeDeals = data?.filter(deal => 
          deal.interactions >= range.min && deal.interactions <= range.max
        )
        const totalDeals = rangeDeals?.length || 0
        const wonDeals = rangeDeals?.filter(deal => deal.win).length || 0
        const totalValue = rangeDeals?.reduce((sum, deal) => sum + (Number(deal.deal_amount_total) || 0), 0) || 0

        return {
          range: range.range,
          total_deals: totalDeals,
          won_deals: wonDeals,
          conversion_rate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
          avg_value: totalDeals > 0 ? totalValue / totalDeals : 0
        }
      }).filter(item => item.total_deals > 0)
    }
  })

  // 10. Previsão de pipeline - O que vem por aí
  const { data: pipelineForecast } = useQuery({
    queryKey: ['pipeline-forecast', filters],
    queryFn: async () => {
      const query = buildFilters(
        supabase
          .from('deals_normalized')
          .select('deal_stage_name, deal_amount_total, deal_created_at, win')
          .not('deal_stage_name', 'is', null)
          .not('deal_created_at', 'is', null)
          .eq('win', false) // Only open deals for forecast
      )
      
      const { data } = await query

      // Estágios em ordem de proximidade ao fechamento
      const stageOrder = [
        'Negociação concluída',
        'Em negociação',
        'Visita Realizada',
        'Visita Agendada', 
        'Cliente em Potencial',
        'Qualificação',
        'Contato Estabelecido',
        'Nova Negociação'
      ]

      const stageData = data?.reduce((acc: any, deal) => {
        const stage = deal.deal_stage_name
        if (!acc[stage]) {
          acc[stage] = { stage, count: 0, value: 0, probability: 0 }
        }
        acc[stage].count += 1
        acc[stage].value += Number(deal.deal_amount_total) || 0
        return acc
      }, {})

      // Probabilidades estimadas baseadas no estágio
      const stageProbabilities: { [key: string]: number } = {
        'Negociação concluída': 90,
        'Em negociação': 70,
        'Visita Realizada': 50,
        'Visita Agendada': 40,
        'Cliente em Potencial': 30,
        'Qualificação': 20,
        'Contato Estabelecido': 10,
        'Nova Negociação': 5
      }

      return stageOrder.map(stage => {
        const data = stageData?.[stage] || { stage, count: 0, value: 0 }
        return {
          ...data,
          probability: stageProbabilities[stage] || 0,
          weighted_value: (data.value * (stageProbabilities[stage] || 0)) / 100
        }
      }).filter(item => item.count > 0)
    }
  })

  if (!monthlyTrends) return <div>Carregando analytics...</div>

  return (
    <div className="space-y-6">
      {/* 1. Evolução Temporal - A História do Crescimento */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>1. Evolução do Negócio</CardTitle>
            </div>
            <Badge variant="outline">Últimos 12 meses</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                fill={storyColors[0]}
                fillOpacity={0.3}
                stroke={storyColors[0]}
                name="Valor Total (R$)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="deals" 
                stroke={storyColors[1]}
                strokeWidth={3}
                name="Quantidade Deals"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Funil de Vendas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle>2. Funil de Vendas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={120} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={storyColors[2]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Performance por Campanha */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <CardTitle>3. ROI por Campanha</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="campaign" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="conversion_rate" fill={storyColors[3]} name="Taxa Conversão %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Performance por Vendedor */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>4. Top Performers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesRepPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="rep" angle={-45} textAnchor="end" height={60} fontSize={11} />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={storyColors[4]} name="Valor Portfolio (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. Distribuição de Valor - Pizza Melhorada */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle>5. Valor por Estágio</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageValueDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {stageValueDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={storyColors[index % storyColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. Fontes de Lead */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle>6. Origem dos Resultados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadSources} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <YAxis dataKey="source" type="category" width={100} fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={storyColors[5]} name="Valor Total (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. Taxa de Conversão Mensal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <CardTitle>7. Eficiência Mensal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyConversion}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke={storyColors[6]}
                  strokeWidth={3}
                  dot={{ fill: storyColors[6], strokeWidth: 2, r: 4 }}
                  name="Taxa Conversão %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 8. Ciclo de Vendas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>8. Ciclo por Campanha</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesCycle}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="campaign" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_days" fill={storyColors[7]} name="Dias Médios" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 9. Análise de Interações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle>9. Engajamento vs Conversão</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={interactionAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="conversion_rate" fill={storyColors[8]} name="Taxa Conversão %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 10. Previsão de Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle>10. Previsão de Fechamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="weighted_value" fill={storyColors[9]} name="Valor Ponderado (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}