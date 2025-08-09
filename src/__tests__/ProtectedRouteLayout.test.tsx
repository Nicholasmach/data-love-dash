import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
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

const renderProtectedRoute = (children: React.ReactNode = <div data-testid="test-content">Test Content</div>) => {
  return render(
    <BrowserRouter>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </BrowserRouter>
  )
}

describe('ProtectedRoute - Layout Único', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar sidebar sem duplicação', () => {
    renderProtectedRoute()
    
    // Verifica se há apenas uma instância da sidebar
    expect(screen.getByText('Nalk')).toBeInTheDocument()
    expect(screen.getByText('Analytics Platform')).toBeInTheDocument()
    
    // Verifica navegação
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText('Integrações')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('deve ter estrutura de layout correta', () => {
    renderProtectedRoute()
    
    // Verifica estrutura flex
    const container = screen.getByText('Nalk').closest('div')
    expect(container).toHaveClass('flex', 'min-h-screen', 'w-full')
    
    // Verifica área principal
    const mainArea = screen.getByTestId('test-content').closest('main')
    expect(mainArea).toHaveClass('flex-1', 'overflow-auto')
  })

  it('deve ter sidebar responsiva e funcional', () => {
    renderProtectedRoute()
    
    // Verifica se a sidebar tem os elementos corretos
    expect(screen.getByText('NAVEGAÇÃO')).toBeInTheDocument()
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('deve renderizar conteúdo da página sem sobreposição', () => {
    renderProtectedRoute(<div data-testid="page-content">Conteúdo da Página</div>)
    
    // Verifica se o conteúdo está presente e visível
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da Página')).toBeInTheDocument()
  })

  it('deve ter scroll automático na área principal', () => {
    renderProtectedRoute()
    
    const mainArea = screen.getByTestId('test-content').closest('main')
    expect(mainArea).toHaveClass('overflow-auto')
  })
})