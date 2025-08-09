import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'
import { Dashboard, DashboardState, DashboardFilters, GridItem, GridPosition, DashboardCard, Card } from '@/types/dashboard'
import { supabase } from '@/integrations/supabase/client'
import { getQuestionById } from '@/lib/predefinedQuestions'
import { useToast } from '@/hooks/use-toast'

interface DashboardContextType extends DashboardState {
  // Parameter management
  updateParameters: (parameters: DashboardFilters) => void
  resetParameters: () => void
  
  // Layout management
  updateLayout: (layout: GridItem[]) => void
  addCard: (cardId: string, position?: Partial<GridPosition>) => void
  removeCard: (dashcardId: string) => void
  updateCardPosition: (dashcardId: string, position: GridPosition) => void
  
  // Dashboard management
  setDashboard: (dashboard: Dashboard) => void
  toggleEditing: () => void
  saveDashboard: () => Promise<void>
  loadDashboard: (dashboardId: string) => Promise<void>
  
  // Auto-refresh
  enableAutoRefresh: (intervalSeconds: number) => void
  disableAutoRefresh: () => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

interface DashboardProviderProps {
  children: ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const { toast } = useToast()
  const [state, setState] = useState<DashboardState>({
    dashboard: null,
    parameters: {},
    layout: [],
    isEditing: false,
    isDirty: false
  })

  // Load dashboard on component mount
  useEffect(() => {
    loadUserDashboard()
  }, [])

  const loadUserDashboard = async () => {
    try {
      const { data: dashboards, error } = await supabase
        .from('dashboards')
        .select(`
          *,
          dashboard_cards (
            *,
            cards (*)
          )
        `)
        .limit(1)
        .single()

      if (error) {
        console.log('No dashboard found, creating default dashboard')
        await createDefaultDashboard()
        return
      }

      const dashboard: Dashboard = {
        ...dashboards,
        parameters: typeof dashboards.parameters === 'string' 
          ? JSON.parse(dashboards.parameters || '[]')
          : dashboards.parameters || [],
        cards: dashboards.dashboard_cards.map((dc: any) => ({
          ...dc,
          parameter_mappings: typeof dc.parameter_mappings === 'string' 
            ? JSON.parse(dc.parameter_mappings || '{}')
            : dc.parameter_mappings || {},
          card: {
            ...dc.cards,
            display: dc.cards.display as Card['display'],
            dataset_query: typeof dc.cards.dataset_query === 'string'
              ? JSON.parse(dc.cards.dataset_query)
              : dc.cards.dataset_query
          }
        }))
      }

      setDashboard(dashboard)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o dashboard",
        variant: "destructive"
      })
    }
  }

  const createDefaultDashboard = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: dashboard, error: dashboardError } = await supabase
        .from('dashboards')
        .insert({
          user_id: user.user.id,
          name: 'Dashboard Principal',
          description: 'Dashboard principal com métricas de vendas e performance',
          parameters: JSON.stringify([
            {
              id: 'date_range',
              slug: 'date_range',
              type: 'date',
              label: 'Período',
              default: null
            }
          ]),
          auto_apply_filters: true
        })
        .select()
        .single()

      if (dashboardError) throw dashboardError

      const emptyDashboard: Dashboard = {
        ...dashboard,
        parameters: typeof dashboard.parameters === 'string' 
          ? JSON.parse(dashboard.parameters || '[]')
          : dashboard.parameters || [],
        cards: []
      }

      setDashboard(emptyDashboard)
    } catch (error) {
      console.error('Error creating default dashboard:', error)
    }
  }

  const updateParameters = useCallback((parameters: DashboardFilters) => {
    setState(prev => ({
      ...prev,
      parameters: { ...prev.parameters, ...parameters },
      isDirty: true
    }))
  }, [])

  const resetParameters = useCallback(() => {
    if (!state.dashboard) return
    
    const defaultParameters: DashboardFilters = {}
    state.dashboard.parameters.forEach(param => {
      if (param.default !== undefined) {
        defaultParameters[param.slug] = param.default
      }
    })
    
    setState(prev => ({
      ...prev,
      parameters: defaultParameters,
      isDirty: true
    }))
  }, [state.dashboard])

  const updateLayout = useCallback((layout: GridItem[]) => {
    setState(prev => ({
      ...prev,
      layout,
      isDirty: true
    }))
  }, [])

  const addCard = useCallback(async (questionId: string, position?: Partial<GridPosition>) => {
    if (!state.dashboard) return

    try {
      const question = getQuestionById(questionId)
      if (!question) return

      // Create card in database
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          name: question.title,
          description: question.description,
          display: question.chartType,
          dataset_query: JSON.stringify({
            type: 'native',
            native: {
              query: question.query
            }
          }),
          visualization_settings: {}
        })
        .select()
        .single()

      if (cardError) throw cardError

      // Add card to dashboard
      const { data: dashboardCard, error: dashCardError } = await supabase
        .from('dashboard_cards')
        .insert({
          dashboard_id: state.dashboard.id,
          card_id: card.id,
          col: position?.col || 0,
          row: position?.row || 0,
          size_x: position?.sizeX || 6,
          size_y: position?.sizeY || 4
        })
        .select()
        .single()

      if (dashCardError) throw dashCardError

      // Update local state
      const newDashboardCard: DashboardCard & { card: Card } = {
        ...dashboardCard,
        parameter_mappings: typeof dashboardCard.parameter_mappings === 'string' 
          ? JSON.parse(dashboardCard.parameter_mappings || '{}')
          : dashboardCard.parameter_mappings || {},
        card: {
          ...card,
          display: card.display as Card['display'],
          dataset_query: typeof card.dataset_query === 'string'
            ? JSON.parse(card.dataset_query)
            : card.dataset_query
        }
      }

      setState(prev => ({
        ...prev,
        dashboard: prev.dashboard ? {
          ...prev.dashboard,
          cards: [...prev.dashboard.cards, newDashboardCard]
        } : null,
        isDirty: false
      }))

      toast({
        title: "Sucesso",
        description: `${question.title} foi adicionado ao dashboard`
      })

    } catch (error) {
      console.error('Error adding card:', error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o gráfico",
        variant: "destructive"
      })
    }
  }, [state.dashboard, toast])

  const removeCard = useCallback(async (dashcardId: string) => {
    if (!state.dashboard) return
    
    try {
      const { error } = await supabase
        .from('dashboard_cards')
        .delete()
        .eq('id', dashcardId)

      if (error) throw error

      const updatedCards = state.dashboard.cards.filter(card => card.id !== dashcardId)
      const updatedLayout = state.layout.filter(item => item.i !== dashcardId)
      
      setState(prev => ({
        ...prev,
        dashboard: prev.dashboard ? {
          ...prev.dashboard,
          cards: updatedCards
        } : null,
        layout: updatedLayout,
        isDirty: false
      }))

      toast({
        title: "Sucesso",
        description: "Gráfico removido do dashboard"
      })

    } catch (error) {
      console.error('Error removing card:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o gráfico",
        variant: "destructive"
      })
    }
  }, [state.dashboard, state.layout, toast])

  const updateCardPosition = useCallback(async (dashcardId: string, position: GridPosition) => {
    if (!state.dashboard) return
    
    try {
      const { error } = await supabase
        .from('dashboard_cards')
        .update({
          col: position.col,
          row: position.row,
          size_x: position.sizeX,
          size_y: position.sizeY
        })
        .eq('id', dashcardId)

      if (error) throw error

      const updatedCards = state.dashboard.cards.map(card => 
        card.id === dashcardId 
          ? { ...card, ...position }
          : card
      )
      
      const updatedLayout = state.layout.map(item =>
        item.i === dashcardId
          ? { ...item, ...position }
          : item
      )
      
      setState(prev => ({
        ...prev,
        dashboard: prev.dashboard ? {
          ...prev.dashboard,
          cards: updatedCards
        } : null,
        layout: updatedLayout,
        isDirty: false
      }))

    } catch (error) {
      console.error('Error updating card position:', error)
    }
  }, [state.dashboard, state.layout])

  const setDashboard = useCallback((dashboard: Dashboard) => {
    const layout: GridItem[] = dashboard.cards.map(card => ({
      i: card.id,
      col: card.col,
      row: card.row,
      sizeX: card.size_x,
      sizeY: card.size_y
    }))
    
    const parameters: DashboardFilters = {}
    dashboard.parameters.forEach(param => {
      if (param.default !== undefined) {
        parameters[param.slug] = param.default
      }
    })
    
    setState({
      dashboard,
      parameters,
      layout,
      isEditing: false,
      isDirty: false
    })
  }, [])

  const toggleEditing = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: !prev.isEditing }))
  }, [])

  const saveDashboard = useCallback(async () => {
    if (!state.dashboard || !state.isDirty) return
    
    try {
      const { error } = await supabase
        .from('dashboards')
        .update({
          name: state.dashboard.name,
          description: state.dashboard.description,
          parameters: JSON.stringify(state.dashboard.parameters),
          auto_apply_filters: state.dashboard.auto_apply_filters,
          refresh_interval_sec: state.dashboard.refresh_interval_sec
        })
        .eq('id', state.dashboard.id)

      if (error) throw error

      setState(prev => ({ ...prev, isDirty: false }))
      
      toast({
        title: "Sucesso",
        description: "Dashboard salvo com sucesso"
      })

    } catch (error) {
      console.error('Error saving dashboard:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o dashboard",
        variant: "destructive"
      })
    }
  }, [state.dashboard, state.isDirty, toast])

  const loadDashboard = useCallback(async (dashboardId: string) => {
    try {
      const { data: dashboard, error } = await supabase
        .from('dashboards')
        .select(`
          *,
          dashboard_cards (
            *,
            cards (*)
          )
        `)
        .eq('id', dashboardId)
        .single()

      if (error) throw error

      const fullDashboard: Dashboard = {
        ...dashboard,
        parameters: typeof dashboard.parameters === 'string' 
          ? JSON.parse(dashboard.parameters || '[]')
          : dashboard.parameters || [],
        cards: dashboard.dashboard_cards.map((dc: any) => ({
          ...dc,
          parameter_mappings: typeof dc.parameter_mappings === 'string' 
            ? JSON.parse(dc.parameter_mappings || '{}')
            : dc.parameter_mappings || {},
          card: {
            ...dc.cards,
            display: dc.cards.display as Card['display'],
            dataset_query: typeof dc.cards.dataset_query === 'string'
              ? JSON.parse(dc.cards.dataset_query)
              : dc.cards.dataset_query
          }
        }))
      }

      setDashboard(fullDashboard)
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o dashboard",
        variant: "destructive"
      })
    }
  }, [toast])

  const enableAutoRefresh = useCallback((intervalSeconds: number) => {
    // TODO: Implement auto-refresh logic
    console.log('Enabling auto-refresh:', intervalSeconds)
  }, [])

  const disableAutoRefresh = useCallback(() => {
    // TODO: Implement disable auto-refresh logic
    console.log('Disabling auto-refresh')
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        updateParameters,
        resetParameters,
        updateLayout,
        addCard,
        removeCard,
        updateCardPosition,
        setDashboard,
        toggleEditing,
        saveDashboard,
        loadDashboard,
        enableAutoRefresh,
        disableAutoRefresh
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}