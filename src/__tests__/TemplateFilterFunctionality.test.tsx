import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateProvider, useTemplate } from '@/contexts/TemplateContext'

// Mock do chartDataService
const mockExecuteQuery = vi.fn()
vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    executeQuery: mockExecuteQuery
  }
}))

// Componente de teste para validar funcionalidade dos filtros
const FilterTestComponent = () => {
  const { filters, chartData, loading, updateFilters, applyFilters } = useTemplate()
  
  return (
    <div>
      <div data-testid="current-filters">{JSON.stringify(filters)}</div>
      <div data-testid="chart-data-revenue">
        {JSON.stringify(chartData.revenue || [])}
      </div>
      <div data-testid="loading-state">{loading ? 'loading' : 'ready'}</div>
      
      {/* Botões de teste para aplicar filtros */}
      <button 
        data-testid="set-seller-filter" 
        onClick={() => updateFilters({ seller: 'João Silva' })}
      >
        Set Seller: João Silva
      </button>
      
      <button 
        data-testid="set-stage-filter" 
        onClick={() => updateFilters({ dealStage: 'Prospecção' })}
      >
        Set Stage: Prospecção
      </button>
      
      <button 
        data-testid="apply-filters-btn" 
        onClick={applyFilters}
      >
        Apply Filters
      </button>
      
      <button 
        data-testid="validate-query" 
        onClick={async () => {
          // Simula query direta para validação
          const directData = await mockExecuteQuery(`
            SELECT COUNT(*) as total_count, SUM(deal_amount_total) as total_revenue 
            FROM deals_normalized 
            WHERE user_name = 'João Silva' AND deal_stage_name = 'Prospecção'
          `)
          const element = document.getElementById('validation-data')
          if (element) {
            element.textContent = JSON.stringify(directData)
          }
        }}
      >
        Validate Query
      </button>
      
      <div id="validation-data" data-testid="validation-data"></div>
    </div>
  )
}

describe('Template Filter Functionality Deep Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock completo com logs para debugging
    mockExecuteQuery.mockImplementation((query) => {
      console.log('🔍 Executing query:', query)
      
      // Mock para options de filtros
      if (query.includes('DISTINCT user_name')) {
        console.log('📋 Loading seller options')
        return Promise.resolve([
          { user_name: 'João Silva' },
          { user_name: 'Maria Santos' },
          { user_name: 'Pedro Costa' }
        ])
      }
      
      if (query.includes('DISTINCT deal_stage_name')) {
        console.log('📋 Loading stage options')
        return Promise.resolve([
          { deal_stage_name: 'Prospecção' },
          { deal_stage_name: 'Qualificação' },
          { deal_stage_name: 'Proposta' }
        ])
      }
      
      if (query.includes('DISTINCT deal_source_name')) {
        return Promise.resolve([{ deal_source_name: 'Website' }])
      }
      
      if (query.includes('DISTINCT campaign_name')) {
        return Promise.resolve([{ campaign_name: 'Campanha A' }])
      }
      
      if (query.includes('DISTINCT deal_stage_id')) {
        return Promise.resolve([{ deal_stage_id: 'pipeline_1' }])
      }
      
      // Mock para queries de chart data com filtros
      if (query.includes('DATE_TRUNC') && query.includes('revenue')) {
        console.log('📊 Loading revenue chart data')
        
        // Detectar filtros na query
        const hasSellerFilter = query.includes("user_name = 'João Silva'")
        const hasStageFilter = query.includes("deal_stage_name = 'Prospecção'")
        
        console.log('🔸 Seller filter detected:', hasSellerFilter)
        console.log('🔸 Stage filter detected:', hasStageFilter)
        
        if (hasSellerFilter && hasStageFilter) {
          // Dados com ambos os filtros
          return Promise.resolve([
            { period: '2024-01-01T00:00:00.000Z', revenue: 25000, deals_count: 3 },
            { period: '2024-02-01T00:00:00.000Z', revenue: 18000, deals_count: 2 }
          ])
        } else if (hasSellerFilter) {
          // Dados apenas com filtro de vendedor
          return Promise.resolve([
            { period: '2024-01-01T00:00:00.000Z', revenue: 80000, deals_count: 8 },
            { period: '2024-02-01T00:00:00.000Z', revenue: 65000, deals_count: 7 }
          ])
        } else if (hasStageFilter) {
          // Dados apenas com filtro de estágio
          return Promise.resolve([
            { period: '2024-01-01T00:00:00.000Z', revenue: 60000, deals_count: 6 },
            { period: '2024-02-01T00:00:00.000Z', revenue: 45000, deals_count: 5 }
          ])
        } else {
          // Dados sem filtro
          return Promise.resolve([
            { period: '2024-01-01T00:00:00.000Z', revenue: 250000, deals_count: 25 },
            { period: '2024-02-01T00:00:00.000Z', revenue: 200000, deals_count: 20 }
          ])
        }
      }
      
      // Query de validação direta
      if (query.includes('total_count') && query.includes('total_revenue')) {
        return Promise.resolve([{ total_count: 5, total_revenue: 43000 }])
      }
      
      // Mock para outras queries (status, stage, etc.)
      if (query.includes('CASE WHEN win = true')) {
        const hasFilters = query.includes('WHERE')
        return Promise.resolve([
          { status: 'Ganho', count: hasFilters ? 3 : 15, total_value: hasFilters ? 25000 : 150000 },
          { status: 'Em Andamento', count: hasFilters ? 2 : 10, total_value: hasFilters ? 18000 : 100000 }
        ])
      }
      
      return Promise.resolve([])
    })
  })

  it('should properly apply single filter and reflect in chart data', async () => {
    render(
      <TemplateProvider>
        <FilterTestComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('ready')
    })

    // Capturar dados iniciais (sem filtro)
    const initialData = JSON.parse(screen.getByTestId('chart-data-revenue').textContent || '[]')
    console.log('📊 Initial revenue data:', initialData)
    expect(initialData).toHaveLength(2)
    expect(initialData[0].revenue).toBe(250000) // Dados sem filtro

    // Aplicar filtro de vendedor
    fireEvent.click(screen.getByTestId('set-seller-filter'))
    fireEvent.click(screen.getByTestId('apply-filters-btn'))

    // Aguardar aplicação do filtro
    await waitFor(() => {
      const filteredData = JSON.parse(screen.getByTestId('chart-data-revenue').textContent || '[]')
      console.log('📊 Filtered revenue data:', filteredData)
      
      // Os dados devem ter mudado após aplicar o filtro
      expect(filteredData).toHaveLength(2)
      expect(filteredData[0].revenue).toBe(80000) // Dados filtrados por João Silva
      expect(filteredData[0].revenue).toBeLessThan(initialData[0].revenue)
    })

    // Verificar se a query foi chamada com o filtro correto
    const filteredQueries = mockExecuteQuery.mock.calls.filter(call => 
      call[0].includes("user_name = 'João Silva'") && call[0].includes('DATE_TRUNC')
    )
    expect(filteredQueries.length).toBeGreaterThan(0)
  })

  it('should apply cascade filters correctly', async () => {
    render(
      <TemplateProvider>
        <FilterTestComponent />
      </TemplateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('ready')
    })

    // Aplicar múltiplos filtros
    fireEvent.click(screen.getByTestId('set-seller-filter'))
    fireEvent.click(screen.getByTestId('set-stage-filter'))
    fireEvent.click(screen.getByTestId('apply-filters-btn'))

    // Aguardar aplicação dos filtros
    await waitFor(() => {
      const cascadeData = JSON.parse(screen.getByTestId('chart-data-revenue').textContent || '[]')
      console.log('📊 Cascade filtered data:', cascadeData)
      
      // Dados com ambos os filtros devem ser ainda menores
      expect(cascadeData).toHaveLength(2)
      expect(cascadeData[0].revenue).toBe(25000) // Dados filtrados por vendedor E estágio
    })

    // Verificar se a query contém ambos os filtros
    const cascadeQueries = mockExecuteQuery.mock.calls.filter(call => 
      call[0].includes("user_name = 'João Silva'") && 
      call[0].includes("deal_stage_name = 'Prospecção'") &&
      call[0].includes('AND')
    )
    expect(cascadeQueries.length).toBeGreaterThan(0)
  })

  it('should validate data consistency with direct database query', async () => {
    render(
      <TemplateProvider>
        <FilterTestComponent />
      </TemplateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('ready')
    })

    // Aplicar filtros
    fireEvent.click(screen.getByTestId('set-seller-filter'))
    fireEvent.click(screen.getByTestId('set-stage-filter'))
    fireEvent.click(screen.getByTestId('apply-filters-btn'))

    // Executar validação direta
    fireEvent.click(screen.getByTestId('validate-query'))

    await waitFor(() => {
      const validationResult = screen.getByTestId('validation-data').textContent
      expect(validationResult).toContain('total_count')
      
      // Verificar consistência entre dados do gráfico e validação direta
      const chartData = JSON.parse(screen.getByTestId('chart-data-revenue').textContent || '[]')
      const validationData = JSON.parse(validationResult || '[{"total_count": 0}]')
      
      const chartTotalDeals = chartData.reduce((sum: number, item: any) => sum + item.deals_count, 0)
      expect(chartTotalDeals).toEqual(validationData[0].total_count)
    })
  })

  it('should ensure all chart queries include proper WHERE clauses when filtered', async () => {
    render(
      <TemplateProvider>
        <FilterTestComponent />
      </TemplateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('ready')
    })

    // Limpar calls anteriores
    mockExecuteQuery.mockClear()

    // Aplicar filtro
    fireEvent.click(screen.getByTestId('set-seller-filter'))
    fireEvent.click(screen.getByTestId('apply-filters-btn'))

    await waitFor(() => {
      // Verificar se todas as queries de gráficos incluem o filtro
      const chartQueries = mockExecuteQuery.mock.calls.filter(call => 
        call[0].includes('FROM deals_normalized') && 
        !call[0].includes('DISTINCT') // Excluir queries de options
      )
      
      console.log('📊 Chart queries after filter:', chartQueries.length)
      
      // Todas as queries de gráficos devem incluir o filtro
      const queriesWithFilter = chartQueries.filter(call => 
        call[0].includes("user_name = 'João Silva'")
      )
      
      console.log('📊 Queries with filter:', queriesWithFilter.length)
      expect(queriesWithFilter.length).toBeGreaterThanOrEqual(8) // 8 gráficos
    })
  })
})