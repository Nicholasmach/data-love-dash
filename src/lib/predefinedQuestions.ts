export interface PredefinedQuestion {
  id: string
  title: string
  description: string
  explanation: string
  category: 'revenue' | 'leads' | 'conversion' | 'performance' | 'pipeline'
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'composed'
  query: string
  icon: string
}

export const PREDEFINED_QUESTIONS: PredefinedQuestion[] = [
  // Revenue Questions
  {
    id: 'revenue-monthly-trend',
    title: 'Tendência de Receita Mensal',
    description: 'Evolução da receita nos últimos 12 meses',
    explanation: 'Gráfico mostra a soma da receita mensal de todos os deals ganhos nos últimos 12 meses, agrupados por mês de criação',
    category: 'revenue',
    chartType: 'line',
    query: `
      SELECT 
        DATE_TRUNC('month', deal_created_at) as month,
        SUM(deal_amount_total) as revenue
      FROM deals_normalized 
      WHERE deal_created_at >= NOW() - INTERVAL '12 months'
      AND win = true
      GROUP BY month
      ORDER BY month
    `,
    icon: '💰'
  },
  {
    id: 'revenue-by-source',
    title: 'Receita por Fonte de Lead',
    description: 'Distribuição da receita por origem dos leads',
    explanation: 'Gráfico de pizza mostra a receita total por fonte de leads apenas para deals ganhos, ordenado por maior receita',
    category: 'revenue',
    chartType: 'pie',
    query: `
      SELECT 
        deal_source_name as source,
        SUM(deal_amount_total) as revenue
      FROM deals_normalized 
      WHERE win = true
      AND deal_source_name IS NOT NULL
      GROUP BY deal_source_name
      ORDER BY revenue DESC
    `,
    icon: '🎯'
  },
  {
    id: 'revenue-by-campaign',
    title: 'Receita por Campanha',
    description: 'Performance de receita por campanha de marketing',
    explanation: 'Gráfico de barras mostra receita total e quantidade de deals ganhos por campanha de marketing, limitado às 10 campanhas com maior receita',
    category: 'revenue',
    chartType: 'bar',
    query: `
      SELECT 
        campaign_name,
        SUM(deal_amount_total) as revenue,
        COUNT(*) as deals_count
      FROM deals_normalized 
      WHERE win = true
      AND campaign_name IS NOT NULL
      GROUP BY campaign_name
      ORDER BY revenue DESC
      LIMIT 10
    `,
    icon: '📈'
  },

  // Lead Questions
  {
    id: 'leads-monthly-generation',
    title: 'Geração de Leads Mensal',
    description: 'Número de leads gerados por mês',
    explanation: 'Gráfico de barras mostra a contagem total de deals criados por mês nos últimos 12 meses, independente do status',
    category: 'leads',
    chartType: 'bar',
    query: `
      SELECT 
        DATE_TRUNC('month', deal_created_at) as month,
        COUNT(*) as leads_count
      FROM deals_normalized 
      WHERE deal_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `,
    icon: '🎪'
  },
  {
    id: 'leads-by-source',
    title: 'Leads por Fonte',
    description: 'Distribuição de leads por origem',
    explanation: 'Gráfico de pizza mostra a distribuição de todos os leads por fonte de origem, ordenado pela maior quantidade',
    category: 'leads',
    chartType: 'pie',
    query: `
      SELECT 
        deal_source_name as source,
        COUNT(*) as leads_count
      FROM deals_normalized 
      WHERE deal_source_name IS NOT NULL
      GROUP BY deal_source_name
      ORDER BY leads_count DESC
    `,
    icon: '🔍'
  },
  {
    id: 'leads-by-stage',
    title: 'Leads por Estágio',
    description: 'Distribuição atual de leads por estágio do funil',
    explanation: 'Gráfico de barras mostra a quantidade atual de deals em cada estágio do funil de vendas, ordenado pela maior quantidade',
    category: 'leads',
    chartType: 'bar',
    query: `
      SELECT 
        deal_stage_name as stage,
        COUNT(*) as leads_count
      FROM deals_normalized 
      WHERE deal_stage_name IS NOT NULL
      GROUP BY deal_stage_name
      ORDER BY leads_count DESC
    `,
    icon: '🏗️'
  },

  // Conversion Questions
  {
    id: 'conversion-rate-monthly',
    title: 'Taxa de Conversão Mensal',
    description: 'Evolução da taxa de conversão ao longo do tempo',
    explanation: 'Gráfico de linha mostra a evolução da taxa de conversão mensal (deals ganhos / total de deals) nos últimos 12 meses',
    category: 'conversion',
    chartType: 'line',
    query: `
      SELECT 
        DATE_TRUNC('month', deal_created_at) as month,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE win = true) as won_deals,
        ROUND((COUNT(*) FILTER (WHERE win = true)::float / COUNT(*)) * 100, 2) as conversion_rate
      FROM deals_normalized 
      WHERE deal_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `,
    icon: '🔄'
  },
  {
    id: 'conversion-by-source',
    title: 'Conversão por Fonte',
    description: 'Taxa de conversão por origem dos leads',
    explanation: 'Gráfico de barras mostra a taxa de conversão por fonte de leads (apenas fontes com 5+ leads), ordenado pela maior taxa',
    category: 'conversion',
    chartType: 'bar',
    query: `
      SELECT 
        deal_source_name as source,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE win = true) as won_deals,
        ROUND((COUNT(*) FILTER (WHERE win = true)::float / COUNT(*)) * 100, 2) as conversion_rate
      FROM deals_normalized 
      WHERE deal_source_name IS NOT NULL
      GROUP BY deal_source_name
      HAVING COUNT(*) >= 5
      ORDER BY conversion_rate DESC
    `,
    icon: '🎯'
  },
  {
    id: 'conversion-by-campaign',
    title: 'Conversão por Campanha',
    description: 'Taxa de conversão por campanha de marketing',
    explanation: 'Gráfico de barras mostra a taxa de conversão das 10 campanhas com melhor performance (mínimo 3 leads por campanha)',
    category: 'conversion',
    chartType: 'bar',
    query: `
      SELECT 
        campaign_name,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE win = true) as won_deals,
        ROUND((COUNT(*) FILTER (WHERE win = true)::float / COUNT(*)) * 100, 2) as conversion_rate
      FROM deals_normalized 
      WHERE campaign_name IS NOT NULL
      GROUP BY campaign_name
      HAVING COUNT(*) >= 3
      ORDER BY conversion_rate DESC
      LIMIT 10
    `,
    icon: '📊'
  },

  // Performance Questions
  {
    id: 'performance-by-rep',
    title: 'Performance por Vendedor',
    description: 'Receita e número de vendas por representante',
    explanation: 'Gráfico de barras mostra receita total e deals ganhos por vendedor nos últimos 6 meses, ordenado pela maior receita',
    category: 'performance',
    chartType: 'bar',
    query: `
      SELECT 
        user_name as sales_rep,
        SUM(deal_amount_total) as total_revenue,
        COUNT(*) FILTER (WHERE win = true) as deals_won
      FROM deals_normalized 
      WHERE user_name IS NOT NULL
      AND deal_created_at >= NOW() - INTERVAL '6 months'
      GROUP BY user_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `,
    icon: '👥'
  },
  {
    id: 'performance-avg-deal-size',
    title: 'Ticket Médio por Período',
    description: 'Evolução do ticket médio das vendas',
    explanation: 'Gráfico de linha mostra a evolução do valor médio dos deals ganhos por mês nos últimos 12 meses',
    category: 'performance',
    chartType: 'line',
    query: `
      SELECT 
        DATE_TRUNC('month', deal_created_at) as month,
        ROUND(AVG(deal_amount_total), 2) as avg_deal_size,
        COUNT(*) as deals_count
      FROM deals_normalized 
      WHERE win = true
      AND deal_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `,
    icon: '💎'
  },
  {
    id: 'performance-interactions',
    title: 'Interações vs Conversão',
    description: 'Relação entre número de interações e taxa de conversão',
    explanation: 'Gráfico de área mostra como a taxa de conversão varia conforme o número de interações realizadas com o lead',
    category: 'performance',
    chartType: 'area',
    query: `
      SELECT 
        CASE 
          WHEN interactions <= 2 THEN '1-2 interações'
          WHEN interactions <= 5 THEN '3-5 interações'
          WHEN interactions <= 10 THEN '6-10 interações'
          ELSE '10+ interações'
        END as interaction_range,
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE win = true) as won_deals,
        ROUND((COUNT(*) FILTER (WHERE win = true)::float / COUNT(*)) * 100, 2) as conversion_rate
      FROM deals_normalized 
      WHERE interactions > 0
      GROUP BY interaction_range
      ORDER BY MIN(interactions)
    `,
    icon: '💬'
  },

  // Pipeline Questions
  {
    id: 'pipeline-value-stage',
    title: 'Valor do Pipeline por Estágio',
    description: 'Distribuição de valor do pipeline atual por estágio',
    explanation: 'Gráfico de barras mostra o valor total e quantidade de deals ativos (não ganhos e não em hold) por estágio do pipeline',
    category: 'pipeline',
    chartType: 'bar',
    query: `
      SELECT 
        deal_stage_name as stage,
        SUM(deal_amount_total) as pipeline_value,
        COUNT(*) as deals_count
      FROM deals_normalized 
      WHERE win = false 
      AND hold = false
      AND deal_stage_name IS NOT NULL
      GROUP BY deal_stage_name
      ORDER BY pipeline_value DESC
    `,
    icon: '🔮'
  },
  {
    id: 'pipeline-forecast',
    title: 'Previsão de Fechamento',
    description: 'Deals com potencial de fechamento nos próximos 30 dias',
    explanation: 'Gráfico de barras mostra deals ativos com atividade recente (últimos 30 dias) que têm potencial de fechamento em breve',
    category: 'pipeline',
    chartType: 'bar',
    query: `
      SELECT 
        deal_stage_name as stage,
        COUNT(*) as deals_count,
        SUM(deal_amount_total) as potential_revenue
      FROM deals_normalized 
      WHERE win = false 
      AND hold = false
      AND last_activity_at >= NOW() - INTERVAL '30 days'
      AND deal_stage_name IS NOT NULL
      GROUP BY deal_stage_name
      ORDER BY potential_revenue DESC
    `,
    icon: '📅'
  }
]

export const getQuestionsByCategory = (category: PredefinedQuestion['category']) => {
  return PREDEFINED_QUESTIONS.filter(q => q.category === category)
}

export const getQuestionById = (id: string) => {
  return PREDEFINED_QUESTIONS.find(q => q.id === id)
}