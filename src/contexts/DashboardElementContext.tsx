import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface DashboardElement {
  id: string
  type: 'chart' | 'text' | 'markdown' | 'spacer'
  title?: string
  content?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  
  // Propriedades específicas para gráficos
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'composed'
  query?: string
  questionId?: string
  filters?: any
  
  // Propriedades específicas para texto/markdown
  markdown?: string
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
}

interface DashboardElementContextType {
  elements: DashboardElement[]
  addElement: (element: Omit<DashboardElement, 'id'>) => void
  updateElement: (id: string, updates: Partial<DashboardElement>) => void
  removeElement: (id: string) => void
  clearElements: () => void
  saveConfig: () => Promise<void>
  loadConfig: (configId: string) => Promise<void>
}

const DashboardElementContext = createContext<DashboardElementContextType | null>(null)

export const useDashboardElements = () => {
  const context = useContext(DashboardElementContext)
  if (!context) {
    throw new Error('useDashboardElements must be used within a DashboardElementProvider')
  }
  return context
}

interface DashboardElementProviderProps {
  children: ReactNode
}

export const DashboardElementProvider: React.FC<DashboardElementProviderProps> = ({ children }) => {
  const [elements, setElements] = useState<DashboardElement[]>([])

  const addElement = (element: Omit<DashboardElement, 'id'>) => {
    const newElement: DashboardElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setElements(prev => [...prev, newElement])
  }

  const updateElement = (id: string, updates: Partial<DashboardElement>) => {
    setElements(prev => prev.map(element => 
      element.id === id ? { ...element, ...updates } : element
    ))
  }

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(element => element.id !== id))
  }

  const clearElements = () => {
    setElements([])
  }

  const saveConfig = async () => {
    // TODO: Implementar salvamento no Supabase
    console.log('Saving dashboard config:', elements)
  }

  const loadConfig = async (configId: string) => {
    // TODO: Implementar carregamento do Supabase
    console.log('Loading dashboard config:', configId)
  }

  return (
    <DashboardElementContext.Provider
      value={{
        elements,
        addElement,
        updateElement,
        removeElement,
        clearElements,
        saveConfig,
        loadConfig
      }}
    >
      {children}
    </DashboardElementContext.Provider>
  )
}