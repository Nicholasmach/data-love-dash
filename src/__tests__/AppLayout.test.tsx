import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { AuthProvider } from '@/components/AuthProvider'

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
    user: mockUser
  })
}))

const renderAppLayout = (children: React.ReactNode = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <AppLayout>
        {children}
      </AppLayout>
    </BrowserRouter>
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sidebar with navigation items', () => {
    renderAppLayout()
    
    expect(screen.getByText('Nalk')).toBeInTheDocument()
    expect(screen.getByText('Analytics Platform')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText('Integrações')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should render user avatar with correct initials', () => {
    renderAppLayout()
    
    const avatar = screen.getByText('TE') // test@example.com -> TE
    expect(avatar).toBeInTheDocument()
  })

  it('should have proper layout structure with sidebar and main content', () => {
    renderAppLayout(<div data-testid="main-content">Main Content</div>)
    
    // Check sidebar exists
    expect(screen.getByText('Navegação')).toBeInTheDocument()
    
    // Check main content area
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    
    // Check content is properly spaced (not overlapping)
    const mainContent = screen.getByTestId('main-content')
    const sidebar = screen.getByText('Navegação').closest('div')
    
    expect(sidebar).toHaveClass('w-64') // Sidebar has fixed width
    expect(mainContent.closest('main')).toHaveClass('flex-1', 'p-6', 'pt-8') // Main content takes remaining space with padding
  })

  it('should open user dropdown menu', async () => {
    renderAppLayout()
    
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)
    
    await waitFor(() => {
      expect(screen.getByText('Perfil')).toBeInTheDocument()
      expect(screen.getByText('Configurações')).toBeInTheDocument()
      expect(screen.getByText('Sair')).toBeInTheDocument()
    })
  })

  it('should have correct spacing and no overlapping elements', () => {
    renderAppLayout()
    
    // Check sidebar has correct width
    const sidebar = screen.getByText('Nalk').closest('.w-64')
    expect(sidebar).toBeInTheDocument()
    
    // Check main content area has flex-1 (takes remaining space)
    const mainArea = screen.getByRole('main')
    expect(mainArea).toHaveClass('flex-1')
    expect(mainArea).toHaveClass('p-6') // Has proper padding
  })

  it('should render logout button in sidebar', () => {
    renderAppLayout()
    
    const logoutButtons = screen.getAllByText('Sair')
    // Should have logout in sidebar and dropdown
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1)
  })
})