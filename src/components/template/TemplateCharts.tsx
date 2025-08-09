import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line } from 'recharts'
import { useTemplate } from '@/contexts/TemplateContext'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Users, Target, Zap, Calendar, Share2, Award, Crown } from 'lucide-react'

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--secondary))', 
  '#8884d8', 
  '#82ca9d', 
  '#ffc658', 
  '#ff7300', 
  '#8dd1e1', 
  '#d084d0'
]

interface ChartCardProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  children: React.ReactNode
  loading?: boolean
  className?: string
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, icon, children, loading, className = '' }) => (
  <Card className={`h-full ${className}`}>
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="h-[280px]">
      {loading ? (
        <div className="space-y-3 h-full flex flex-col justify-center">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <div className="h-full">
          {children}
        </div>
      )}
    </CardContent>
  </Card>
)

export const TemplateCharts: React.FC = () => {
  const { chartData, loading } = useTemplate()

  // Função para formatar números grandes
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }

  // Usar os big numbers que agora vêm do context já calculados com filtros
  const totalRevenue = chartData.bigNumbers?.totalRevenue || 0
  const totalDeals = chartData.bigNumbers?.totalDeals || 0

  return (
    <div className="w-full space-y-6">
      {/* Big Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '---' : formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade Total Vendida</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '---' : totalDeals.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid 2x4 - 8 gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Row 1 - Col 1: Revenue Over Time */}
        <ChartCard 
          title="Receita ao Longo do Tempo" 
          subtitle="Evolução mensal da receita"
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
                labelFormatter={(label) => formatDate(label)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 1 - Col 2: Deals by Status */}
        <ChartCard 
          title="Negócios por Status" 
          subtitle="Distribuição atual dos negócios"
          icon={<Target className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.dealsByStatus || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(chartData.dealsByStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Quantidade']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 2 - Col 1: Deals by Stage */}
        <ChartCard 
          title="Negócios por Estágio" 
          subtitle="Quantidade por estágio do funil"
          icon={<Zap className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.dealsByStage || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                dataKey="stage" 
                type="category" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={100}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 2 - Col 2: Performance by Campaign */}
        <ChartCard 
          title="Performance por Campanha" 
          subtitle="Leads vs Conversões por campanha"
          icon={<Share2 className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.performanceByCampaign || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="campaign" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrency(Number(value)), 'Receita']
                  return [value, name === 'leads' ? 'Leads' : 'Conversões']
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="leads" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
              <Bar dataKey="conversions" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 3 - Col 1: Monthly Trends */}
        <ChartCard 
          title="Tendências Mensais" 
          subtitle="Evolução dos negócios ao longo do tempo"
          icon={<Calendar className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [formatCurrency(Number(value)), 'Receita']
                  return [value, name === 'total_deals' ? 'Total de Negócios' : 'Negócios Ganhos']
                }}
                labelFormatter={formatDate}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total_deals" 
                stroke={COLORS[0]} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="won_deals" 
                stroke={COLORS[1]} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 3 - Col 2: Source Distribution */}
        <ChartCard 
          title="Distribuição por Origem" 
          subtitle="Canais de aquisição de negócios"
          icon={<Users className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.sourceDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {(chartData.sourceDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Quantidade']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 4 - Col 1: Conversion Rates */}
        <ChartCard 
          title="Taxa de Conversão por Estágio" 
          subtitle="Performance de conversão no funil"
          icon={<Award className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.conversionRates || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="stage" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'conversion_rate') return [`${value}%`, 'Taxa de Conversão']
                  return [value, name === 'total' ? 'Total' : 'Convertidos']
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="conversion_rate" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 4 - Col 2: Top Performers */}
        <ChartCard 
          title="Melhores Vendedores" 
          subtitle="Ranking por receita gerada"
          icon={<Crown className="w-4 h-4 text-primary" />}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.topPerformers || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                dataKey="owner" 
                type="category" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={120}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'total_revenue') return [formatCurrency(Number(value)), 'Receita Total']
                  return [value, name === 'deals_count' ? 'Total de Negócios' : 'Negócios Ganhos']
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="total_revenue" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Loading overlay quando aplicando filtros */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card p-6 rounded-lg border shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="font-medium">Aplicando filtros...</span>
          </div>
        </div>
      )}
    </div>
  )
}