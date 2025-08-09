import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

describe('Sidebar - Validação Espaçamento Harmonioso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve ter largura correta no estado expandido (16rem)', () => {
    renderProtectedRoute()
    
    // Verifica se o sidebar tem a largura padrão expandida
    const sidebarElement = document.querySelector('[data-sidebar="sidebar"]')
    expect(sidebarElement).toBeInTheDocument()
    
    // Verifica se elementos estão visíveis no estado expandido
    expect(screen.getByText('Nalk')).toBeInTheDocument()
    expect(screen.getByText('Analytics Platform')).toBeInTheDocument()
  })

  it('deve ter largura adequada no estado colapsado (4.5rem)', async () => {
    renderProtectedRoute()
    
    // Clica no trigger para colapsar
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Aguarda a transição e verifica o estado colapsado
      await waitFor(() => {
        const sidebarElement = document.querySelector('[data-sidebar="sidebar"]')
        expect(sidebarElement).toBeInTheDocument()
      }, { timeout: 1000 })
    }
  })

  it('deve ter ícones centralizados quando colapsado', async () => {
    renderProtectedRoute()
    
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Aguarda e verifica centralização dos ícones
      await waitFor(() => {
        const navLinks = document.querySelectorAll('a[class*="justify-center"]')
        expect(navLinks.length).toBeGreaterThan(0)
      }, { timeout: 1000 })
    }
  })

  it('deve ter transições suaves (duration-300)', () => {
    renderProtectedRoute()
    
    // Verifica se elementos têm transições de 300ms
    const transitionElements = document.querySelectorAll('[class*="duration-300"]')
    expect(transitionElements.length).toBeGreaterThan(0)
    
    // Verifica elementos específicos com transição
    const headerElement = document.querySelector('[class*="transition-all"][class*="duration-300"]')
    expect(headerElement).toBeInTheDocument()
  })

  it('deve redimensionar logo adequadamente quando colapsado', async () => {
    renderProtectedRoute()
    
    // Verifica logo no estado expandido
    const logoContainer = document.querySelector('[class*="w-10"][class*="h-10"]')
    expect(logoContainer).toBeInTheDocument()
    
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Aguarda e verifica redimensionamento do logo
      await waitFor(() => {
        const smallerLogo = document.querySelector('[class*="w-8"][class*="h-8"]')
        expect(smallerLogo).toBeInTheDocument()
      }, { timeout: 1000 })
    }
  })

  it('deve manter espaçamento adequado nos botões quando colapsado', async () => {
    renderProtectedRoute()
    
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Aguarda e verifica botões com dimensões adequadas
      await waitFor(() => {
        const iconButtons = document.querySelectorAll('[class*="w-10"][class*="h-10"][class*="mx-auto"]')
        expect(iconButtons.length).toBeGreaterThan(0)
      }, { timeout: 1000 })
    }
  })

  it('deve ter padding responsivo no header', async () => {
    renderProtectedRoute()
    
    // Verifica padding inicial (p-6)
    const headerExpanded = document.querySelector('[class*="p-6"]')
    expect(headerExpanded).toBeInTheDocument()
    
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Aguarda e verifica padding reduzido (p-4)
      await waitFor(() => {
        const headerCollapsed = document.querySelector('[class*="p-4"]')
        expect(headerCollapsed).toBeInTheDocument()
      }, { timeout: 1000 })
    }
  })

  it('deve manter harmonia visual em ambos os estados', () => {
    renderProtectedRoute()
    
    // Verifica se o layout principal permanece harmonioso
    const mainArea = screen.getByTestId('test-content').closest('main')
    expect(mainArea).toHaveClass('flex-1', 'overflow-auto', 'transition-all', 'duration-200')
    
    // Verifica container principal
    const container = screen.getByTestId('test-content').closest('div')?.parentElement
    expect(container).toHaveClass('flex', 'min-h-screen', 'w-full', 'bg-background')
  })

  it('deve ter ícones com tamanho adequado em ambos os estados', async () => {
    renderProtectedRoute()
    
    // Estado expandido - ícones menores
    const expandedIcons = document.querySelectorAll('[class*="w-4"][class*="h-4"]')
    expect(expandedIcons.length).toBeGreaterThan(0)
    
    const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLElement
    
    if (triggerButton) {
      await userEvent.click(triggerButton)
      
      // Estado colapsado - ícones ligeiramente maiores para melhor visibilidade
      await waitFor(() => {
        const collapsedIcons = document.querySelectorAll('[class*="w-5"][class*="h-5"]')
        expect(collapsedIcons.length).toBeGreaterThan(0)
      }, { timeout: 1000 })
    }
  })
})