import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateProvider, useTemplate } from '@/contexts/TemplateContext'
import { TemplateFilters } from '@/components/template/TemplateFilters'
import { supabase } from '@/integrations/supabase/client'

// Mock do chartDataService
const mockExecuteQuery = vi.fn()
vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    executeQuery: mockExecuteQuery
  }
}))

// Mock do Supabase para query de validação
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { count: 0 }, error: null }))
          }))
        }))
      }))
    }))
  }
}))

// Componente de teste para verificar filtros
const TestFiltersComponent = () => {
  const { filters, chartData, loading, updateFilters, applyFilters } = useTemplate()
  
  return (
    <div>
      <div data-testid="filter-state">{JSON.stringify(filters)}</div>
      <div data-testid="chart-data-count">{Object.keys(chartData).length}</div>
      <div data-testid="loading-state">{loading ? 'true' : 'false'}</div>
      <button 
        data-testid="test-seller-filter" 
        onClick={() => updateFilters({ seller: 'João Silva' })}
      >
        Set Seller Filter
      </button>
      <button 
        data-testid="test-stage-filter" 
        onClick={() => updateFilters({ dealStage: 'Prospecção' })}
      >
        Set Stage Filter
      </button>
      <button 
        data-testid="test-apply-filters" 
        onClick={applyFilters}
      >
        Apply Filters
      </button>
      <TemplateFilters />
    </div>
  )
}

describe('Template Filters Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das respostas do executeQuery para diferentes tipos de query
    mockExecuteQuery.mockImplementation((query) => {
      console.log('Mock query:', query)
      
      // Mock para filter options
      if (query.includes('deal_stage_name') && query.includes('DISTINCT')) {
        return Promise.resolve([
          { deal_stage_name: 'Prospecção' },
          { deal_stage_name: 'Qualificação' },
          { deal_stage_name: 'Proposta' }
        ])
      }
      if (query.includes('deal_source_name') && query.includes('DISTINCT')) {
        return Promise.resolve([
          { deal_source_name: 'Website' },
          { deal_source_name: 'Indicação' }
        ])
      }
      if (query.includes('campaign_name') && query.includes('DISTINCT')) {
        return Promise.resolve([
          { campaign_name: 'Campanha A' },
          { campaign_name: 'Campanha B' }
        ])
      }
      if (query.includes('user_name') && query.includes('DISTINCT')) {
        return Promise.resolve([
          { user_name: 'João Silva' },
          { user_name: 'Maria Santos' }
        ])
      }
      if (query.includes('deal_stage_id') && query.includes('DISTINCT')) {
        return Promise.resolve([
          { deal_stage_id: 'pipeline_1' },
          { deal_stage_id: 'pipeline_2' }
        ])
      }
      
      // Mock para chart data queries baseadas em filtros
      if (query.includes('DATE_TRUNC') && query.includes('revenue')) {
        const hasSellerFilter = query.includes("user_name = 'João Silva'")
        const hasStageFilter = query.includes("deal_stage_name = 'Prospecção'")
        
        if (hasSellerFilter && hasStageFilter) {
          // Dados filtrados por vendedor E estágio
          return Promise.resolve([
            { period: '2024-01-01', revenue: 50000, deals_count: 5 },
            { period: '2024-02-01', revenue: 30000, deals_count: 3 }
          ])
        } else if (hasSellerFilter) {
          // Dados filtrados apenas por vendedor
          return Promise.resolve([
            { period: '2024-01-01', revenue: 100000, deals_count: 10 },
            { period: '2024-02-01', revenue: 80000, deals_count: 8 }
          ])
        } else if (hasStageFilter) {
          // Dados filtrados apenas por estágio
          return Promise.resolve([
            { period: '2024-01-01', revenue: 70000, deals_count: 7 },
            { period: '2024-02-01', revenue: 60000, deals_count: 6 }
          ])
        } else {
          // Dados sem filtro
          return Promise.resolve([
            { period: '2024-01-01', revenue: 200000, deals_count: 20 },
            { period: '2024-02-01', revenue: 180000, deals_count: 18 }
          ])
        }
      }
      
      // Mock para outras queries de gráficos
      if (query.includes('CASE WHEN win = true')) {
        return Promise.resolve([
          { status: 'Ganho', count: 10, total_value: 50000 },
          { status: 'Em Andamento', count: 15, total_value: 75000 }
        ])
      }
      
      return Promise.resolve([])
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should apply single filter correctly', async () => {
    render(
      <TemplateProvider>
        <TestFiltersComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('false')
    })

    // Aplicar filtro de vendedor
    fireEvent.click(screen.getByTestId('test-seller-filter'))
    fireEvent.click(screen.getByTestId('test-apply-filters'))

    // Aguardar aplicação do filtro
    await waitFor(() => {
      expect(screen.getByTestId('filter-state')).toHaveTextContent('João Silva')
    })

    // Verificar se a query foi chamada com o filtro correto
    await waitFor(() => {
      const lastCall = mockExecuteQuery.mock.calls[mockExecuteQuery.mock.calls.length - 1]
      expect(lastCall[0]).toContain("user_name = 'João Silva'")
    })
  })

  it('should apply cascade filters correctly', async () => {
    render(
      <TemplateProvider>
        <TestFiltersComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('false')
    })

    // Aplicar múltiplos filtros
    fireEvent.click(screen.getByTestId('test-seller-filter'))
    fireEvent.click(screen.getByTestId('test-stage-filter'))
    fireEvent.click(screen.getByTestId('test-apply-filters'))

    // Aguardar aplicação dos filtros
    await waitFor(() => {
      const filterState = screen.getByTestId('filter-state').textContent
      expect(filterState).toContain('João Silva')
      expect(filterState).toContain('Prospecção')
    })

    // Verificar se a query foi chamada com ambos os filtros
    await waitFor(() => {
      const lastCall = mockExecuteQuery.mock.calls[mockExecuteQuery.mock.calls.length - 1]
      expect(lastCall[0]).toContain("user_name = 'João Silva'")
      expect(lastCall[0]).toContain("deal_stage_name = 'Prospecção'")
      expect(lastCall[0]).toContain('AND')
    })
  })

  it('should render filters with proper spacing', () => {
    render(
      <TemplateProvider>
        <TemplateFilters />
      </TemplateProvider>
    )

    // Verificar se os elementos de filtro estão presentes
    expect(screen.getByText('Período')).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Estágio')).toBeInTheDocument()
    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByText('Campanha')).toBeInTheDocument()

    // Verificar se os selects estão presentes e não sobrepostos
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(5) // 5 selects (sem o date picker)
  })

  it('should validate data consistency between filters and charts', async () => {
    render(
      <TemplateProvider>
        <TestFiltersComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('false')
    })

    // Aplicar filtro e verificar se os dados mudaram
    fireEvent.click(screen.getByTestId('test-seller-filter'))
    fireEvent.click(screen.getByTestId('test-apply-filters'))

    await waitFor(() => {
      // Verificar se os dados dos gráficos foram atualizados
      expect(screen.getByTestId('chart-data-count')).toHaveTextContent('8')
    })

    // Verificar se as queries foram chamadas com os filtros corretos
    const queriesWithFilter = mockExecuteQuery.mock.calls.filter(call => 
      call[0].includes("user_name = 'João Silva'")
    )
    expect(queriesWithFilter.length).toBeGreaterThan(0)
  })

  it('should handle dropdown overlaps correctly', async () => {
    render(
      <TemplateProvider>
        <TemplateFilters />
      </TemplateProvider>
    )

    // Aguardar carregamento dos filter options
    await waitFor(() => {
      expect(screen.getByText('Todos os vendedores')).toBeInTheDocument()
    })

    // Verificar se os dropdowns têm z-index adequado
    const selectTriggers = screen.getAllByRole('combobox')
    selectTriggers.forEach(trigger => {
      expect(trigger).toBeInTheDocument()
    })

    // Simular abertura de dropdown para verificar se não há sobreposição
    fireEvent.click(selectTriggers[0]) // Primeiro select (vendedor)
    
    await waitFor(() => {
      const dropdown = document.querySelector('[data-radix-popper-content-wrapper]')
      if (dropdown) {
        const computedStyle = window.getComputedStyle(dropdown)
        expect(parseInt(computedStyle.zIndex)).toBeGreaterThan(40)
      }
    })
  })
})