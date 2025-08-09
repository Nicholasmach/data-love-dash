import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Template from '@/pages/Template'

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn(),
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  }
}))

// Mock do chartDataService
vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    executeQuery: vi.fn().mockRejectedValue(new Error('relation "deals_normalized" does not exist'))
  }
}))

// Mock do useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

// Mock do useAuth
const mockUser = {
  email: 'test@example.com',
  user_metadata: { name: 'Test User' }
}

vi.mock('@/components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser
  })
}))

const renderTemplate = () => {
  return render(
    <BrowserRouter>
      <Template />
    </BrowserRouter>
  )
}

describe('Template - Correção da Sidebar Duplicada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar apenas UMA sidebar (não duplicada)', () => {
    renderTemplate()
    
    // Não deve ter elementos duplicados da sidebar
    const sidebarElements = screen.queryAllByText('Nalk')
    // Com a correção, deve ter apenas uma instância
    expect(sidebarElements.length).toBeLessThanOrEqual(1)
  })

  it('deve ter layout correto sem sobreposição', () => {
    renderTemplate()
    
    // Verifica se o conteúdo principal está presente
    expect(screen.getByText('Dashboard Template')).toBeInTheDocument()
    expect(screen.getByText('8 Gráficos Prontos')).toBeInTheDocument()
    
    // Verifica se os filtros estão presentes na estrutura correta
    expect(screen.getByText('Filtros')).toBeInTheDocument()
  })

  it('deve ter espaçamento adequado no container principal', () => {
    renderTemplate()
    
    // Verifica se o container principal tem as classes corretas de espaçamento
    const mainContainer = screen.getByText('Dashboard Template').closest('div')
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-background', 'p-6', 'space-y-6')
  })

  it('deve renderizar filtros e gráficos sem conflito de layout', async () => {
    renderTemplate()
    
    // Aguarda os componentes carregarem
    await screen.findByText('Filtros')
    
    // Verifica se todos os componentes estão presentes
    expect(screen.getByText('Período')).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Estágio')).toBeInTheDocument()
    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByText('Campanha')).toBeInTheDocument()
  })

  it('deve ter estrutura de grid responsiva para gráficos', async () => {
    renderTemplate()
    
    // Aguarda os gráficos carregarem
    await screen.findByText('Receita ao Longo do Tempo')
    
    // Verifica se todos os 8 gráficos estão presentes
    expect(screen.getByText('Receita ao Longo do Tempo')).toBeInTheDocument()
    expect(screen.getByText('Negócios por Status')).toBeInTheDocument()
    expect(screen.getByText('Negócios por Estágio')).toBeInTheDocument()
    expect(screen.getByText('Performance por Campanha')).toBeInTheDocument()
    expect(screen.getByText('Tendências Mensais')).toBeInTheDocument()
    expect(screen.getByText('Distribuição por Origem')).toBeInTheDocument()
    expect(screen.getByText('Taxa de Conversão por Estágio')).toBeInTheDocument()
    expect(screen.getByText('Top Performers')).toBeInTheDocument()
  })

  it('deve permitir aplicação de filtros sem erro', async () => {
    renderTemplate()
    
    // Aguarda o botão aparecer
    const applyButton = await screen.findByText('Aplicar Filtros')
    expect(applyButton).toBeInTheDocument()
    expect(applyButton).not.toBeDisabled()
  })
})