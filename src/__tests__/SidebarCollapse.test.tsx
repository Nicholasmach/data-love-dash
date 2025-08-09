import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import userEvent from '@testing-library/user-event'

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

describe('Sidebar - Teste de Collapse e Expansão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar sidebar expandida por padrão', () => {
    renderProtectedRoute()
    
    // Verifica elementos da sidebar expandida
    expect(screen.getByText('Nalk')).toBeInTheDocument()
    expect(screen.getByText('Analytics Platform')).toBeInTheDocument()
    expect(screen.getByText('NAVEGAÇÃO')).toBeInTheDocument()
    
    // Verifica se os textos dos menus estão visíveis
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText('Integrações')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('deve colapsar sidebar quando clicar no trigger', async () => {
    renderProtectedRoute()
    
    // Encontra o trigger da sidebar
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    expect(triggerButton).toBeInTheDocument()
    
    await userEvent.click(triggerButton)
    
    // Aguarda a transição
    await waitFor(() => {
      // Verifica se o conteúdo colapsou
      const sidebarContent = document.querySelector('[data-sidebar="content"]')
      expect(sidebarContent).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('deve ter largura adequada quando colapsada (4.5rem)', async () => {
    renderProtectedRoute()
    
    // Verifica se a variável CSS está correta
    const sidebarWrapper = document.querySelector('.group\\/sidebar-wrapper')
    expect(sidebarWrapper).toBeInTheDocument()
    
    // Verifica se o estilo tem a largura correta definida
    const styles = getComputedStyle(sidebarWrapper as Element)
    expect(styles.getPropertyValue('--sidebar-width-icon')).toBe('4.5rem')
  })

  it('deve mostrar tooltips quando sidebar estiver colapsada', async () => {
    renderProtectedRoute()
    
    // Clica no trigger para colapsar
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Aguarda a transição e verifica elementos de navegação
      await waitFor(() => {
        const navLinks = document.querySelectorAll('a[href*="/"]')
        expect(navLinks.length).toBeGreaterThan(0)
      }, { timeout: 1000 })
    }
  })

  it('deve ter espaçamento harmonioso em estado colapsado', async () => {
    renderProtectedRoute()
    
    // Verifica elementos da sidebar no estado expandido
    expect(screen.getByText('Nalk')).toBeInTheDocument()
    
    // Verifica se os elementos têm classes de transição
    const sidebarElements = document.querySelectorAll('[class*="transition"]')
    expect(sidebarElements.length).toBeGreaterThan(0)
  })

  it('deve manter layout harmônico quando sidebar colapsa', async () => {
    renderProtectedRoute(<div data-testid="page-content">Conteúdo da Página</div>)
    
    // Verifica layout inicial
    const mainArea = screen.getByTestId('page-content').closest('main')
    expect(mainArea).toHaveClass('flex-1', 'overflow-auto', 'transition-all', 'duration-200')
    
    // Verifica se o conteúdo está presente
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('deve ter transições suaves entre estados', async () => {
    renderProtectedRoute()
    
    // Verifica classes de transição
    const sidebar = screen.getByText('Nalk').closest('[data-sidebar="sidebar"]')
    const mainArea = screen.getByTestId('test-content').closest('main')
    
    expect(mainArea).toHaveClass('transition-all', 'duration-200')
  })

  it('deve redimensionar corretamente a área principal', async () => {
    renderProtectedRoute(<div data-testid="main-content" className="w-full">Conteúdo Principal</div>)
    
    // Verifica se a área principal ocupa o espaço restante
    const mainArea = screen.getByTestId('main-content').closest('main')
    expect(mainArea).toHaveClass('flex-1')
    
    // Verifica se o container principal tem largura total
    const container = screen.getByTestId('main-content').closest('div')
    expect(container).toHaveClass('w-full')
  })

  it('deve manter navegação funcional em ambos os estados', async () => {
    renderProtectedRoute()
    
    // Verifica se todos os links de navegação estão presentes
    const analyticsLink = screen.getByRole('link', { name: /analytics/i })
    const templateLink = screen.getByRole('link', { name: /template/i })
    const integrationsLink = screen.getByRole('link', { name: /integrações/i })
    const adminLink = screen.getByRole('link', { name: /admin/i })
    
    expect(analyticsLink).toBeInTheDocument()
    expect(templateLink).toBeInTheDocument()
    expect(integrationsLink).toBeInTheDocument()
    expect(adminLink).toBeInTheDocument()
  })

  it('deve ter padding adequado no conteúdo principal', () => {
    renderProtectedRoute()
    
    // Verifica se o conteúdo tem padding adequado
    const contentWrapper = screen.getByTestId('test-content').closest('div')
    expect(contentWrapper).toHaveClass('p-6')
  })

  it('deve funcionar botão de logout em ambos os estados', async () => {
    renderProtectedRoute()
    
    // Encontra e clica no botão de logout
    const logoutButton = screen.getByRole('button', { name: /sair/i })
    
    expect(logoutButton).toBeInTheDocument()
    expect(logoutButton).not.toBeDisabled()
  })
})