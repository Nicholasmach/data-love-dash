import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Sample data - in a real app, this would come from your analytics API
const revenueData = [
  { month: 'Jan', revenue: 45000, leads: 120, deals: 23 },
  { month: 'Fev', revenue: 52000, leads: 145, deals: 28 },
  { month: 'Mar', revenue: 48000, leads: 132, deals: 25 },
  { month: 'Abr', revenue: 61000, leads: 158, deals: 31 },
  { month: 'Mai', revenue: 55000, leads: 142, deals: 29 },
  { month: 'Jun', revenue: 67000, leads: 178, deals: 35 },
  { month: 'Jul', revenue: 72000, leads: 189, deals: 38 },
  { month: 'Ago', revenue: 69000, leads: 165, deals: 33 },
  { month: 'Set', revenue: 75000, leads: 198, deals: 41 },
  { month: 'Out', revenue: 82000, leads: 215, deals: 45 },
  { month: 'Nov', revenue: 78000, leads: 187, deals: 39 },
  { month: 'Dez', revenue: 85000, leads: 223, deals: 47 }
]

const pipelineData = [
  { name: 'Qualificação', value: 156, color: 'hsl(75, 100%, 60%)' },
  { name: 'Proposta', value: 89, color: 'hsl(75, 84%, 64%)' },
  { name: 'Negociação', value: 45, color: 'hsl(67, 84%, 56%)' },
  { name: 'Fechado', value: 127, color: 'hsl(59, 84%, 56%)' }
]

const sourceData = [
  { source: 'Organic Search', leads: 145, percentage: 34 },
  { source: 'Paid Ads', leads: 98, percentage: 23 },
  { source: 'Social Media', leads: 76, percentage: 18 },
  { source: 'Email Marketing', leads: 54, percentage: 13 },
  { source: 'Direct', leads: 32, percentage: 8 },
  { source: 'Referral', leads: 18, percentage: 4 }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg" style={{
        background: 'hsl(0 0% 12%)',
        border: '1px solid hsl(0 0% 23%)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px hsl(0 0% 0% / 0.3)'
      }}>
        <p className="helper-text font-medium text-primary">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-primary metric-value text-sm">
            {entry.name}: {entry.value.toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const DashboardCharts = () => {
  return (
    <div className="compact-grid grid-cols-1 lg:grid-cols-2">
      {/* COMPACT Revenue Trend */}
      <Card className="lg:col-span-2 compact-card interactive-hover">
        <CardHeader className="pb-3">
          <CardTitle className="perfect-align">
            <span className="metric-title text-lg">Evolução da Receita</span>
            <span className="helper-text text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              Últimos 12 meses
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(75, 100%, 60%)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(75, 100%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 23%)" strokeOpacity={0.4} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210, 2%, 69%)', fontSize: 12, fontFamily: 'Gantari' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210, 2%, 69%)', fontSize: 12, fontFamily: 'Gantari' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(75, 100%, 60%)" 
                fillOpacity={1} 
                fill="url(#revenueGradient)"
                strokeWidth={3}
                dot={{ fill: 'hsl(75, 100%, 60%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(75, 100%, 60%)', strokeWidth: 2, filter: 'drop-shadow(0 0 6px hsl(75, 100%, 60%))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* COMPACT Pipeline Distribution */}
      <Card className="compact-card interactive-hover">
        <CardHeader className="pb-3">
          <CardTitle className="metric-title text-lg">Distribuição do Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={25}
                fill="#8884d8"
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* COMPACT Lead Sources */}
      <Card className="compact-card interactive-hover">
        <CardHeader className="pb-3">
          <CardTitle className="metric-title text-lg">Origem dos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sourceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 23%)" strokeOpacity={0.4} />
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210, 2%, 69%)', fontSize: 12, fontFamily: 'Gantari' }}
              />
              <YAxis 
                dataKey="source" 
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210, 2%, 69%)', fontSize: 11, fontFamily: 'Gantari' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="leads" 
                fill="hsl(75, 100%, 60%)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* COMPACT Performance Comparison */}
      <Card className="lg:col-span-2 compact-card interactive-hover">
        <CardHeader className="pb-3">
          <CardTitle className="metric-title text-lg">Performance de Leads vs Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 23%)" strokeOpacity={0.4} />
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210, 2%, 69%)', fontSize: 12, fontFamily: 'Gantari' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(210, 2%, 69%)', fontSize: 12, fontFamily: 'Gantari' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="hsl(75, 84%, 64%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(75, 84%, 64%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(75, 84%, 64%)', filter: 'drop-shadow(0 0 6px hsl(75, 84%, 64%))' }}
                name="Leads"
              />
              <Line 
                type="monotone" 
                dataKey="deals" 
                stroke="hsl(75, 100%, 60%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(75, 100%, 60%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(75, 100%, 60%)', filter: 'drop-shadow(0 0 6px hsl(75, 100%, 60%))' }}
                name="Deals"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}