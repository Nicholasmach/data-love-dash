import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Template from '@/pages/Template'
import { TemplateProvider } from '@/contexts/TemplateContext'

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn()
  }
}))

// Mock do chartDataService
vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    executeQuery: vi.fn()
  }
}))

const renderTemplate = () => {
  return render(
    <BrowserRouter>
      <TemplateProvider>
        <Template />
      </TemplateProvider>
    </BrowserRouter>
  )
}

describe('Template Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the template page with header', () => {
    renderTemplate()
    
    expect(screen.getByText('Dashboard Template')).toBeInTheDocument()
    expect(screen.getByText('8 Gráficos Prontos')).toBeInTheDocument()
    expect(screen.getByText('Dashboard pré-configurado com 8 gráficos ultra modernos e filtros sincronizados em tempo real')).toBeInTheDocument()
  })

  it('should render filters section', () => {
    renderTemplate()
    
    expect(screen.getByText('Filtros')).toBeInTheDocument()
    expect(screen.getByText('Configure os parâmetros para análise')).toBeInTheDocument()
  })

  it('should render all filter fields', () => {
    renderTemplate()
    
    expect(screen.getByText('Período')).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Estágio')).toBeInTheDocument()
    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByText('Campanha')).toBeInTheDocument()
  })

  it('should have apply filters button', () => {
    renderTemplate()
    
    const applyButton = screen.getByText('Aplicar Filtros')
    expect(applyButton).toBeInTheDocument()
    expect(applyButton.tagName).toBe('BUTTON')
  })

  it('should render charts section', () => {
    renderTemplate()
    
    // Verificar se os títulos dos gráficos estão presentes
    expect(screen.getByText('Receita ao Longo do Tempo')).toBeInTheDocument()
    expect(screen.getByText('Negócios por Status')).toBeInTheDocument()
    expect(screen.getByText('Negócios por Estágio')).toBeInTheDocument()
    expect(screen.getByText('Performance por Campanha')).toBeInTheDocument()
  })

  it('should handle filter application', async () => {
    const user = userEvent.setup()
    renderTemplate()
    
    const applyButton = screen.getByText('Aplicar Filtros')
    await user.click(applyButton)
    
    // Verifica se o botão existe e pode ser clicado
    expect(applyButton).toBeInTheDocument()
  })

  it('should display filter dropdowns with placeholder text', () => {
    renderTemplate()
    
    expect(screen.getByText('Todos os vendedores')).toBeInTheDocument()
    expect(screen.getByText('Todos os pipelines')).toBeInTheDocument()
    expect(screen.getByText('Todos os estágios')).toBeInTheDocument()
    expect(screen.getByText('Todas as origens')).toBeInTheDocument()
    expect(screen.getByText('Todas as campanhas')).toBeInTheDocument()
  })
})