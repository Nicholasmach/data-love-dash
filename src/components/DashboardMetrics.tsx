import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

const MetricCard = ({ title, value, change, changeLabel, icon, trend = 'neutral' }: MetricCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-primary'
      case 'down': return 'text-destructive'
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

  return (
    <Card className="compact-card interactive-hover border-border/50">
      <CardHeader className="perfect-align space-y-0 pb-2">
        <CardTitle className="helper-text text-xs font-medium">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="metric-value text-2xl mb-1">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1 helper-text">
              {change > 0 ? '+' : ''}{change}% {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const DashboardMetrics = () => {
  const metrics = [
    {
      title: "Receita Total",
      value: "R$ 2.847.532",
      change: 12.5,
      changeLabel: "vs mês anterior",
      icon: <DollarSign className="w-4 h-4 text-primary" />,
      trend: 'up' as const
    },
    {
      title: "Leads Gerados",
      value: "4.563",
      change: 8.2,
      changeLabel: "vs mês anterior",
      icon: <Users className="w-4 h-4 text-primary" />,
      trend: 'up' as const
    },
    {
      title: "Taxa de Conversão",
      value: "23.4%",
      change: -2.1,
      changeLabel: "vs mês anterior",
      icon: <Target className="w-4 h-4 text-primary" />,
      trend: 'down' as const
    },
    {
      title: "Deals Fechados",
      value: "127",
      change: 15.8,
      changeLabel: "vs mês anterior",
      icon: <Calendar className="w-4 h-4 text-primary" />,
      trend: 'up' as const
    }
  ]

  return (
    <div className="compact-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}