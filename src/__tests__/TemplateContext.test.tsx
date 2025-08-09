import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { TemplateProvider, useTemplate } from '@/contexts/TemplateContext'

// Mock do chartDataService
const mockExecuteQuery = vi.fn()
vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    executeQuery: mockExecuteQuery
  }
}))

// Componente de teste para verificar o contexto
const TestComponent = () => {
  const { filters, filterOptions, loading, chartData } = useTemplate()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="sellers-count">{filterOptions.sellers.length}</div>
      <div data-testid="pipelines-count">{filterOptions.pipelines.length}</div>
      <div data-testid="chart-data-keys">{Object.keys(chartData).join(',')}</div>
    </div>
  )
}

describe('TemplateContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock das respostas do executeQuery
    mockExecuteQuery.mockImplementation((query) => {
      if (query.includes('deal_stage_name')) {
        return Promise.resolve([
          { deal_stage_name: 'Prospecção' },
          { deal_stage_name: 'Qualificação' },
          { deal_stage_name: 'Proposta' }
        ])
      }
      if (query.includes('deal_source_name')) {
        return Promise.resolve([
          { deal_source_name: 'Website' },
          { deal_source_name: 'Indicação' }
        ])
      }
      if (query.includes('campaign_name')) {
        return Promise.resolve([
          { campaign_name: 'Campanha A' },
          { campaign_name: 'Campanha B' }
        ])
      }
      if (query.includes('user_name')) {
        return Promise.resolve([
          { user_name: 'João Silva' },
          { user_name: 'Maria Santos' }
        ])
      }
      if (query.includes('deal_stage_id')) {
        return Promise.resolve([
          { deal_stage_id: 'pipeline_1' },
          { deal_stage_id: 'pipeline_2' }
        ])
      }
      return Promise.resolve([])
    })
  })

  it('should provide filter options after loading', async () => {
    render(
      <TemplateProvider>
        <TestComponent />
      </TemplateProvider>
    )

    // Aguardar o carregamento dos dados
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByTestId('sellers-count')).toHaveTextContent('2')
    expect(screen.getByTestId('pipelines-count')).toHaveTextContent('2')
  })

  it('should initialize with empty filters', () => {
    render(
      <TemplateProvider>
        <TestComponent />
      </TemplateProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('should handle query errors gracefully', async () => {
    mockExecuteQuery.mockRejectedValue(new Error('Database error'))

    render(
      <TemplateProvider>
        <TestComponent />
      </TemplateProvider>
    )

    // Aguardar o carregamento dos dados
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Deve manter arrays vazios em caso de erro
    expect(screen.getByTestId('sellers-count')).toHaveTextContent('0')
  })
})