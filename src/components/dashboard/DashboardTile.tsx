import React, { useState, useCallback } from 'react'
import { DashboardCard } from '@/types/dashboard'
import { useDashboard } from '@/contexts/DashboardContext'
import { ChartWidget } from '@/components/analytics/ChartWidget'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  Trash2, 
  Maximize2, 
  RefreshCcw,
  AlertCircle,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface DashboardTileProps {
  dashboardCard: DashboardCard & { card: any }
  isEditing: boolean
}

export const DashboardTile: React.FC<DashboardTileProps> = ({ 
  dashboardCard, 
  isEditing 
}) => {
  const { removeCard } = useDashboard()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showToolbar, setShowToolbar] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Implement refresh logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } catch (err) {
      setError('Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleEdit = useCallback(() => {
    console.log('Edit card:', dashboardCard.id)
  }, [dashboardCard.id])

  const handleDuplicate = useCallback(() => {
    console.log('Duplicate card:', dashboardCard.id)
  }, [dashboardCard.id])

  const handleDelete = useCallback(() => {
    removeCard(dashboardCard.id)
  }, [dashboardCard.id, removeCard])

  const handleMaximize = useCallback(() => {
    console.log('Maximize card:', dashboardCard.id)
  }, [dashboardCard.id])

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    // Convert DashboardCard to ChartWidget format
    const chartConfig = {
      id: dashboardCard.card_id,
      type: dashboardCard.card.display as any,
      title: dashboardCard.card.name,
      query: dashboardCard.card.dataset_query?.native?.query || '',
      position: { x: dashboardCard.col, y: dashboardCard.row },
      size: { width: dashboardCard.size_x * 100, height: dashboardCard.size_y * 60 },
      questionId: dashboardCard.card_id,
      filters: {}
    }

    return (
      <ChartWidget chart={chartConfig} />
    )
  }

  return (
    <div 
      className="dashboard-tile crypto-card relative h-full"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Tile Toolbar */}
      {(showToolbar || isEditing) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {isLoading && (
            <Badge variant="secondary" className="px-2 py-1">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Question
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh Data
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleMaximize}>
                <Maximize2 className="w-4 h-4 mr-2" />
                View Fullscreen
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              
              {isEditing && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove from Dashboard
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Tile Content */}
      <div className="h-full w-full">
        {renderContent()}
      </div>

      {/* Editing State Visual Feedback */}
      {isEditing && (
        <div className="absolute inset-0 border-2 border-primary/30 rounded-lg pointer-events-none">
          <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            {dashboardCard.size_x}×{dashboardCard.size_y}
          </div>
        </div>
      )}
    </div>
  )
}