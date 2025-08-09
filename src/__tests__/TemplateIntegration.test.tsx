import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('Template Integration with AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render template page with proper layout structure', async () => {
    renderTemplate()
    
    // Should have AppLayout components
    expect(screen.getByText('Nalk')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    
    // Should have template content
    expect(screen.getByText('Dashboard Template')).toBeInTheDocument()
    expect(screen.getByText('8 Gráficos Prontos')).toBeInTheDocument()
  })

  it('should have proper spacing without overlapping content', async () => {
    renderTemplate()
    
    // Check sidebar exists and has proper width
    const sidebar = screen.getByText('Nalk').closest('.w-64')
    expect(sidebar).toBeInTheDocument()
    
    // Check main content is properly positioned
    const mainContent = screen.getByText('Dashboard Template').closest('main')
    expect(mainContent).toHaveClass('flex-1', 'p-6', 'pt-8')
  })

  it('should render filter section with proper layout', async () => {
    renderTemplate()
    
    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument()
    })
    
    // Check filters are properly positioned (not overlapping sidebar)
    const filtersSection = screen.getByText('Filtros')
    expect(filtersSection).toBeInTheDocument()
  })

  it('should render charts section even with mock data fallback', async () => {
    renderTemplate()
    
    await waitFor(() => {
      // Should fallback to mock data and show chart titles
      expect(screen.getByText('Receita ao Longo do Tempo')).toBeInTheDocument()
      expect(screen.getByText('Negócios por Status')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should have navigation active state for template route', () => {
    // Mock the location to be /template
    Object.defineProperty(window, 'location', {
      value: { pathname: '/template' },
      writable: true
    })
    
    renderTemplate()
    
    const templateNavItem = screen.getByText('Template').closest('a')
    expect(templateNavItem).toHaveClass('bg-primary/20', 'text-primary')
  })

  it('should render filter dropdowns with mock data', async () => {
    renderTemplate()
    
    await waitFor(() => {
      // Should show dropdown placeholders
      expect(screen.getByText('Todos os vendedores')).toBeInTheDocument()
      expect(screen.getByText('Todos os pipelines')).toBeInTheDocument()
      expect(screen.getByText('Todos os estágios')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle filter application without errors', async () => {
    renderTemplate()
    
    await waitFor(() => {
      const applyButton = screen.getByText('Aplicar Filtros')
      expect(applyButton).toBeInTheDocument()
      
      // Should be clickable without errors
      fireEvent.click(applyButton)
    }, { timeout: 3000 })
  })
})