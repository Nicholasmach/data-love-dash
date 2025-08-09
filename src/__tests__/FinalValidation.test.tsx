import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Template from '@/pages/Template'
import Analytics from '@/pages/Analytics'
import Integrations from '@/pages/Integrations'
import Admin from '@/pages/Admin'

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
    user: mockUser,
    loading: false
  })
}))

const renderPage = (Component: React.ComponentType) => {
  return render(
    <BrowserRouter>
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    </BrowserRouter>
  )
}

describe('Validação Final - Layout Corrigido', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Template Page', () => {
    it('deve renderizar sem sidebar duplicada', async () => {
      renderPage(Template)
      
      // Verifica se há apenas uma sidebar
      const sidebarElements = screen.queryAllByText('Nalk')
      expect(sidebarElements.length).toBeLessThanOrEqual(1)
      
      // Verifica conteúdo principal
      expect(screen.getByText('Dashboard Template')).toBeInTheDocument()
      expect(screen.getByText('8 Gráficos Prontos')).toBeInTheDocument()
    })

    it('deve ter layout harmônico e responsivo', async () => {
      renderPage(Template)
      
      // Verifica container principal
      const mainContainer = screen.getByText('Dashboard Template').closest('div')
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-background', 'p-6', 'space-y-6')
      
      // Verifica filtros estão presentes
      expect(screen.getByText('Filtros')).toBeInTheDocument()
    })
  })

  describe('Analytics Page', () => {
    it('deve renderizar corretamente', () => {
      renderPage(Analytics)
      
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Dados em tempo real')).toBeInTheDocument()
    })

    it('deve ter layout consistente', () => {
      renderPage(Analytics)
      
      const mainContainer = screen.getByText('Analytics Dashboard').closest('div')
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-background', 'p-6', 'space-y-6')
    })
  })

  describe('Integrations Page', () => {
    it('deve renderizar corretamente', () => {
      renderPage(Integrations)
      
      expect(screen.getByText('Integrações')).toBeInTheDocument()
      expect(screen.getByText('Conecte suas ferramentas e centralize todos os dados em um só lugar')).toBeInTheDocument()
    })

    it('deve ter layout consistente', () => {
      renderPage(Integrations)
      
      const mainContainer = screen.getByText('Integrações').closest('div')
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-background', 'p-6', 'space-y-6')
    })
  })

  describe('Admin Page', () => {
    it('deve renderizar corretamente', () => {
      renderPage(Admin)
      
      expect(screen.getByText('Administração')).toBeInTheDocument()
      expect(screen.getByText('Gerencie usuários, permissões e configurações da plataforma')).toBeInTheDocument()
    })

    it('deve ter layout consistente', () => {
      renderPage(Admin)
      
      const mainContainer = screen.getByText('Administração').closest('div')
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-background', 'p-6', 'space-y-6')
    })
  })

  describe('Layout Geral', () => {
    it('todas as páginas devem usar o mesmo padrão de layout', () => {
      const pages = [Template, Analytics, Integrations, Admin]
      
      pages.forEach((Page) => {
        const { unmount } = renderPage(Page)
        
        // Verifica se o ProtectedRoute renderiza apenas uma sidebar
        const sidebarTriggers = screen.queryAllByText('Nalk')
        expect(sidebarTriggers.length).toBeLessThanOrEqual(1)
        
        // Verifica estrutura básica
        const sidebar = screen.getByText('NAVEGAÇÃO')
        expect(sidebar).toBeInTheDocument()
        
        unmount()
      })
    })

    it('sidebar deve ser única e funcional em todas as páginas', () => {
      renderPage(Template)
      
      // Verifica elementos da sidebar
      expect(screen.getByText('NAVEGAÇÃO')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Template')).toBeInTheDocument()
      expect(screen.getByText('Integrações')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Sair')).toBeInTheDocument()
    })

    it('deve ter espaçamento correto sem sobreposição', () => {
      renderPage(Template)
      
      // Verifica container do ProtectedRoute
      const container = screen.getByText('Nalk').closest('div')
      expect(container).toHaveClass('flex', 'min-h-screen', 'w-full')
      
      // Verifica área principal
      const mainArea = screen.getByText('Dashboard Template').closest('main')
      expect(mainArea).toHaveClass('flex-1', 'overflow-auto')
    })
  })
})