import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateProvider, useTemplate } from '@/contexts/TemplateContext'
import { chartDataService } from '@/services/chartDataService'

// Mock real do supabase para comparação de dados
const mockSupabaseQuery = vi.fn()
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mockSupabaseQuery
  }
}))

// Spy no chartDataService para interceptar queries
const mockExecuteQuery = vi.fn()
vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    executeQuery: mockExecuteQuery
  }
}))

// Componente de teste para validar dados
const DataValidationComponent = () => {
  const { chartData, filters, applyFilters, updateFilters } = useTemplate()
  
  return (
    <div>
      <div data-testid="revenue-data">{JSON.stringify(chartData.revenue || [])}</div>
      <div data-testid="deals-status-data">{JSON.stringify(chartData.dealsByStatus || [])}</div>
      <div data-testid="active-filters">{JSON.stringify(filters)}</div>
      <button 
        data-testid="apply-seller-filter" 
        onClick={() => {
          updateFilters({ seller: 'João Silva' })
          setTimeout(applyFilters, 100)
        }}
      >
        Apply Seller Filter
      </button>
      <button 
        data-testid="validate-data" 
        onClick={async () => {
          // Simula validação direta no banco
          const directQuery = await chartDataService.executeQuery(`
            SELECT COUNT(*) as total_deals 
            FROM deals_normalized 
            WHERE user_name = 'João Silva'
          `)
          const element = document.getElementById('validation-result')
          if (element) {
            element.textContent = JSON.stringify(directQuery)
          }
        }}
      >
        Validate Data
      </button>
      <div id="validation-result" data-testid="validation-result"></div>
    </div>
  )
}

describe('Template Data Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das respostas com dados consistentes
    mockExecuteQuery.mockImplementation((query) => {
      console.log('Validating query:', query)
      
      // Simular dados do banco de forma consistente
      if (query.includes('DATE_TRUNC') && query.includes('revenue')) {
        const hasSellerFilter = query.includes("user_name = 'João Silva'")
        
        if (hasSellerFilter) {
          // Dados específicos para João Silva
          return Promise.resolve([
            { period: '2024-01-01T00:00:00.000Z', revenue: 125000, deals_count: 12 },
            { period: '2024-02-01T00:00:00.000Z', revenue: 98000, deals_count: 9 }
          ])
        } else {
          // Dados totais
          return Promise.resolve([
            { period: '2024-01-01T00:00:00.000Z', revenue: 450000, deals_count: 45 },
            { period: '2024-02-01T00:00:00.000Z', revenue: 380000, deals_count: 38 }
          ])
        }
      }
      
      if (query.includes('CASE WHEN win = true')) {
        const hasSellerFilter = query.includes("user_name = 'João Silva'")
        
        if (hasSellerFilter) {
          return Promise.resolve([
            { status: 'Ganho', count: 8, total_value: 125000 },
            { status: 'Em Andamento', count: 13, total_value: 98000 }
          ])
        } else {
          return Promise.resolve([
            { status: 'Ganho', count: 80, total_value: 450000 },
            { status: 'Em Andamento', count: 120, total_value: 380000 }
          ])
        }
      }
      
      // Query de validação direta
      if (query.includes('COUNT(*) as total_deals') && query.includes("user_name = 'João Silva'")) {
        return Promise.resolve([{ total_deals: 21 }])
      }
      
      // Filtros options
      if (query.includes('DISTINCT user_name')) {
        return Promise.resolve([
          { user_name: 'João Silva' },
          { user_name: 'Maria Santos' },
          { user_name: 'Pedro Costa' }
        ])
      }
      
      if (query.includes('DISTINCT deal_stage_name')) {
        return Promise.resolve([
          { deal_stage_name: 'Prospecção' },
          { deal_stage_name: 'Qualificação' }
        ])
      }
      
      if (query.includes('DISTINCT deal_source_name')) {
        return Promise.resolve([
          { deal_source_name: 'Website' }
        ])
      }
      
      if (query.includes('DISTINCT campaign_name')) {
        return Promise.resolve([
          { campaign_name: 'Campanha A' }
        ])
      }
      
      if (query.includes('DISTINCT deal_stage_id')) {
        return Promise.resolve([
          { deal_stage_id: 'pipeline_1' }
        ])
      }
      
      return Promise.resolve([])
    })
  })

  it('should validate data consistency between charts and database', async () => {
    render(
      <TemplateProvider>
        <DataValidationComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('revenue-data')).toHaveTextContent('period')
    })

    // Aplicar filtro de vendedor
    fireEvent.click(screen.getByTestId('apply-seller-filter'))

    // Aguardar aplicação do filtro
    await waitFor(() => {
      const revenueData = JSON.parse(screen.getByTestId('revenue-data').textContent || '[]')
      expect(revenueData).toHaveLength(2)
      expect(revenueData[0]).toHaveProperty('revenue', 125000)
      expect(revenueData[0]).toHaveProperty('deals_count', 12)
    })

    // Validar dados diretamente no banco
    fireEvent.click(screen.getByTestId('validate-data'))

    await waitFor(() => {
      const validationResult = screen.getByTestId('validation-result').textContent
      expect(validationResult).toContain('total_deals')
      
      // Verificar consistência: soma dos deals_count deve bater com total_deals
      const revenueData = JSON.parse(screen.getByTestId('revenue-data').textContent || '[]')
      const totalDealsFromCharts = revenueData.reduce((sum: number, item: any) => sum + item.deals_count, 0)
      
      const validationData = JSON.parse(validationResult || '[{"total_deals": 0}]')
      expect(totalDealsFromCharts).toEqual(validationData[0].total_deals)
    })
  })

  it('should verify filter cascade effect on multiple charts', async () => {
    render(
      <TemplateProvider>
        <DataValidationComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('revenue-data')).toHaveTextContent('period')
    })

    // Capturar dados iniciais (sem filtro)
    const initialRevenueData = JSON.parse(screen.getByTestId('revenue-data').textContent || '[]')
    const initialStatusData = JSON.parse(screen.getByTestId('deals-status-data').textContent || '[]')

    // Aplicar filtro
    fireEvent.click(screen.getByTestId('apply-seller-filter'))

    // Aguardar e verificar mudança nos dados
    await waitFor(() => {
      const filteredRevenueData = JSON.parse(screen.getByTestId('revenue-data').textContent || '[]')
      const filteredStatusData = JSON.parse(screen.getByTestId('deals-status-data').textContent || '[]')

      // Verificar que os dados mudaram após aplicar filtro
      expect(filteredRevenueData[0].revenue).toBeLessThan(initialRevenueData[0].revenue)
      expect(filteredStatusData[0].count).toBeLessThan(initialStatusData[0].count)

      // Verificar consistência entre gráficos filtrados
      const totalRevenueFromChart = filteredRevenueData.reduce((sum: number, item: any) => sum + item.revenue, 0)
      const totalRevenueFromStatus = filteredStatusData.reduce((sum: number, item: any) => sum + item.total_value, 0)
      
      // Os valores devem ser próximos (considerando diferentes agregações)
      expect(Math.abs(totalRevenueFromChart - totalRevenueFromStatus)).toBeLessThan(50000)
    })
  })

  it('should ensure all filter queries include WHERE clause correctly', async () => {
    render(
      <TemplateProvider>
        <DataValidationComponent />
      </TemplateProvider>
    )

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('revenue-data')).toHaveTextContent('period')
    })

    // Aplicar filtro
    fireEvent.click(screen.getByTestId('apply-seller-filter'))

    await waitFor(() => {
      // Verificar se todas as queries para gráficos incluem o filtro
      const queriesWithFilter = mockExecuteQuery.mock.calls.filter(call => 
        call[0].includes("user_name = 'João Silva'") && call[0].includes('WHERE')
      )
      
      // Deve haver pelo menos 8 queries com filtro (uma para cada gráfico)
      expect(queriesWithFilter.length).toBeGreaterThanOrEqual(8)
      
      // Verificar se todas as queries têm a estrutura correta
      queriesWithFilter.forEach(call => {
        const query = call[0]
        expect(query).toMatch(/WHERE.*user_name = 'João Silva'/)
      })
    })
  })

  it('should validate data ranges and values are realistic', async () => {
    render(
      <TemplateProvider>
        <DataValidationComponent />
      </TemplateProvider>
    )

    await waitFor(() => {
      const revenueData = JSON.parse(screen.getByTestId('revenue-data').textContent || '[]')
      const statusData = JSON.parse(screen.getByTestId('deals-status-data').textContent || '[]')

      // Verificar se os dados têm estrutura esperada
      revenueData.forEach((item: any) => {
        expect(item).toHaveProperty('period')
        expect(item).toHaveProperty('revenue')
        expect(item).toHaveProperty('deals_count')
        expect(typeof item.revenue).toBe('number')
        expect(typeof item.deals_count).toBe('number')
        expect(item.revenue).toBeGreaterThanOrEqual(0)
        expect(item.deals_count).toBeGreaterThanOrEqual(0)
      })

      statusData.forEach((item: any) => {
        expect(item).toHaveProperty('status')
        expect(item).toHaveProperty('count')
        expect(item).toHaveProperty('total_value')
        expect(typeof item.count).toBe('number')
        expect(typeof item.total_value).toBe('number')
        expect(item.count).toBeGreaterThanOrEqual(0)
        expect(item.total_value).toBeGreaterThanOrEqual(0)
      })
    })
  })
})