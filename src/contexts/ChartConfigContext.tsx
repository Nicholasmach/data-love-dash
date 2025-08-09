import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface ChartConfig {
  id: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'composed'
  title: string
  query: string
  filters?: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  questionId?: string
}

interface ChartConfigContextType {
  charts: ChartConfig[]
  addChart: (chart: Omit<ChartConfig, 'id'>) => void
  updateChart: (id: string, updates: Partial<ChartConfig>) => void
  removeChart: (id: string) => void
  clearCharts: () => void
  saveConfig: () => Promise<void>
  loadConfig: (configId: string) => Promise<void>
}

const ChartConfigContext = createContext<ChartConfigContextType | null>(null)

export const useChartConfig = () => {
  const context = useContext(ChartConfigContext)
  if (!context) {
    throw new Error('useChartConfig must be used within a ChartConfigProvider')
  }
  return context
}

interface ChartConfigProviderProps {
  children: ReactNode
}

export const ChartConfigProvider: React.FC<ChartConfigProviderProps> = ({ children }) => {
  const [charts, setCharts] = useState<ChartConfig[]>([])

  const addChart = (chart: Omit<ChartConfig, 'id'>) => {
    const newChart: ChartConfig = {
      ...chart,
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setCharts(prev => [...prev, newChart])
  }

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(chart => 
      chart.id === id ? { ...chart, ...updates } : chart
    ))
  }

  const removeChart = (id: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== id))
  }

  const clearCharts = () => {
    setCharts([])
  }

  const saveConfig = async () => {
    // TODO: Implementar salvamento no Supabase
    console.log('Saving chart config:', charts)
  }

  const loadConfig = async (configId: string) => {
    // TODO: Implementar carregamento do Supabase
    console.log('Loading chart config:', configId)
  }

  return (
    <ChartConfigContext.Provider
      value={{
        charts,
        addChart,
        updateChart,
        removeChart,
        clearCharts,
        saveConfig,
        loadConfig
      }}
    >
      {children}
    </ChartConfigContext.Provider>
  )
}