import React from 'react'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { DashboardHeader } from './DashboardHeader'
import { DashboardFilters } from './DashboardFilters'
import { DashboardQuestionMenu } from './DashboardQuestionMenu'
import { DashboardGrid } from './DashboardGrid'

interface DashboardBuilderProps {
  className?: string
}

const DashboardBuilderContent: React.FC<DashboardBuilderProps> = ({ className = '' }) => {
  return (
    <div className={`dashboard-builder ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader />
        
        {/* Global Filters */}
        <DashboardFilters />
        
        {/* Question Menu (only visible when editing) */}
        <DashboardQuestionMenu />
        
        {/* Main Grid */}
        <DashboardGrid className="flex-1" />
      </div>
    </div>
  )
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = (props) => {
  return (
    <DashboardProvider>
      <DashboardBuilderContent {...props} />
    </DashboardProvider>
  )
}