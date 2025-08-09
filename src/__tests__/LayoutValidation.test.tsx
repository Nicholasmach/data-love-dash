import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Mock do chartDataService para forçar uso de dados mock
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

describe('Layout Validation - Template Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Layout Structure', () => {
    it('should have proper layout without overlapping elements', async () => {
      const { container } = renderTemplate()
      
      // Verificar se o AppLayout está sendo usado
      expect(screen.getByText('Nalk')).toBeInTheDocument()
      expect(screen.getByText('Analytics Platform')).toBeInTheDocument()
      
      // Verificar estrutura do layout
      const layoutContainer = container.querySelector('.min-h-screen.bg-background.flex')
      expect(layoutContainer).toBeInTheDocument()
      
      // Verificar sidebar
      const sidebar = container.querySelector('.w-64.bg-card.border-r')
      expect(sidebar).toBeInTheDocument()
      
      // Verificar área principal
      const mainArea = container.querySelector('.flex-1.flex.flex-col')
      expect(mainArea).toBeInTheDocument()
      
      // Verificar conteúdo principal com padding correto
      const mainContent = container.querySelector('main.flex-1.p-6.pt-8')
      expect(mainContent).toBeInTheDocument()
    })

    it('should display template navigation item as active', () => {
      // Mock window.location.pathname
      Object.defineProperty(window, 'location', {
        value: { pathname: '/template' },
        writable: true
      })

      renderTemplate()
      
      const templateNavItem = screen.getByText('Template').closest('a')
      expect(templateNavItem).toHaveClass('bg-primary/20', 'text-primary')
    })

    it('should have correct spacing and positioning', () => {
      const { container } = renderTemplate()
      
      // Verificar que o sidebar tem largura fixa
      const sidebar = container.querySelector('.w-64')
      expect(sidebar).toBeInTheDocument()
      
      // Verificar que o conteúdo principal usa flex-1 (ocupa espaço restante)
      const mainContent = container.querySelector('main')
      expect(mainContent).toHaveClass('flex-1')
      expect(mainContent).toHaveClass('p-6') // Padding adequado
      expect(mainContent).toHaveClass('pt-8') // Padding superior
    })
  })

  describe('Template Content', () => {
    it('should render template header correctly', async () => {
      renderTemplate()
      
      expect(screen.getByText('Dashboard Template')).toBeInTheDocument()
      expect(screen.getByText('8 Gráficos Prontos')).toBeInTheDocument()
      expect(screen.getByText('Dashboard pré-configurado com 8 gráficos ultra modernos e filtros sincronizados em tempo real')).toBeInTheDocument()
    })

    it('should render filters section', async () => {
      renderTemplate()
      
      await waitFor(() => {
        expect(screen.getByText('Filtros')).toBeInTheDocument()
        expect(screen.getByText('Configure os parâmetros para análise')).toBeInTheDocument()
      })
    })

    it('should render filter dropdowns with mock data', async () => {
      renderTemplate()
      
      await waitFor(() => {
        // Verificar placeholders dos filtros
        expect(screen.getByText('Todos os vendedores')).toBeInTheDocument()
        expect(screen.getByText('Todos os pipelines')).toBeInTheDocument()
        expect(screen.getByText('Todos os estágios')).toBeInTheDocument()
        expect(screen.getByText('Todas as origens')).toBeInTheDocument()
        expect(screen.getByText('Todas as campanhas')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should render all chart sections', async () => {
      renderTemplate()
      
      await waitFor(() => {
        // Verificar se os gráficos estão sendo renderizados
        expect(screen.getByText('Receita ao Longo do Tempo')).toBeInTheDocument()
        expect(screen.getByText('Negócios por Status')).toBeInTheDocument()
        expect(screen.getByText('Negócios por Estágio')).toBeInTheDocument()
        expect(screen.getByText('Performance por Campanha')).toBeInTheDocument()
        expect(screen.getByText('Tendências Mensais')).toBeInTheDocument()
        expect(screen.getByText('Distribuição por Origem')).toBeInTheDocument()
        expect(screen.getByText('Taxa de Conversão por Estágio')).toBeInTheDocument()
        expect(screen.getByText('Top Performers')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should have apply filters button', async () => {
      renderTemplate()
      
      await waitFor(() => {
        const applyButton = screen.getByText('Aplicar Filtros')
        expect(applyButton).toBeInTheDocument()
        expect(applyButton.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should maintain layout integrity', () => {
      const { container } = renderTemplate()
      
      // Verificar que o container principal usa classes responsivas
      const mainContainer = container.querySelector('.min-h-screen')
      expect(mainContainer).toHaveClass('flex') // Layout flex horizontal
      
      // Verificar sidebar fixa
      const sidebar = container.querySelector('.w-64')
      expect(sidebar).toBeInTheDocument()
      
      // Verificar área de conteúdo flexível
      const contentArea = container.querySelector('.flex-1')
      expect(contentArea).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should gracefully handle database connection errors', async () => {
      renderTemplate()
      
      // Deve carregar dados mock quando o banco falha
      await waitFor(() => {
        expect(screen.getByText('Todos os vendedores')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Não deve mostrar erros visíveis ao usuário
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
      expect(screen.queryByText('relation "deals_normalized" does not exist')).not.toBeInTheDocument()
    })
  })
})