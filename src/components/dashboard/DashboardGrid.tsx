import React, { useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { useDashboard } from '@/contexts/DashboardContext'
import { GridItem } from '@/types/dashboard'
import { DashboardTile } from './DashboardTile'
import { EmptyDashboard } from './EmptyDashboard'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Grid configuration - 12 columns like Metabase
const GRID_CONFIG = {
  cols: { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 },
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  rowHeight: 60,
  margin: [16, 16] as [number, number],
  containerPadding: [16, 16] as [number, number],
  compactType: 'vertical' as const,
  preventCollision: false, // Allow pushing tiles
  useCSSTransforms: true,
  autoSize: true
}

const TILE_MIN_SIZE = { w: 2, h: 2 }
const TILE_MAX_SIZE = { w: 12, h: 20 }

interface DashboardGridProps {
  className?: string
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ className = '' }) => {
  const { 
    dashboard, 
    layout, 
    isEditing, 
    updateLayout,
    updateCardPosition
  } = useDashboard()

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (!isEditing) return
    
    const updatedLayout: GridItem[] = newLayout.map(item => ({
      i: item.i,
      col: item.x,
      row: item.y,
      sizeX: item.w,
      sizeY: item.h,
      isDraggable: isEditing,
      isResizable: isEditing,
      minW: TILE_MIN_SIZE.w,
      minH: TILE_MIN_SIZE.h,
      maxW: TILE_MAX_SIZE.w,
      maxH: TILE_MAX_SIZE.h
    }))
    
    updateLayout(updatedLayout)
    
    // Update individual card positions
    newLayout.forEach(item => {
      updateCardPosition(item.i, {
        col: item.x,
        row: item.y,
        sizeX: item.w,
        sizeY: item.h
      })
    })
  }, [isEditing, updateLayout, updateCardPosition])

  const handleDragStart = useCallback(() => {
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleDragStop = useCallback(() => {
    document.body.style.cursor = ''
  }, [])

  if (!dashboard || !dashboard.cards.length) {
    return <EmptyDashboard className={className} />
  }

  // Convert layout to react-grid-layout format
  const reactGridLayout: Layout[] = layout.map(item => ({
    i: item.i,
    x: item.col,
    y: item.row,
    w: item.sizeX,
    h: item.sizeY,
    static: !isEditing,
    isDraggable: isEditing,
    isResizable: isEditing,
    minW: TILE_MIN_SIZE.w,
    minH: TILE_MIN_SIZE.h,
    maxW: TILE_MAX_SIZE.w,
    maxH: TILE_MAX_SIZE.h
  }))

  return (
    <div className={`dashboard-grid ${className}`}>
      <ResponsiveGridLayout
        {...GRID_CONFIG}
        layouts={{ lg: reactGridLayout }}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        isDraggable={isEditing}
        isResizable={isEditing}
        className="grid-container"
      >
        {dashboard.cards.map(dashboardCard => (
          <div key={dashboardCard.id} className="grid-item">
            <DashboardTile
              dashboardCard={dashboardCard}
              isEditing={isEditing}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
      
      <style>{`
        .dashboard-grid {
          min-height: 600px;
          position: relative;
        }
        
        .grid-container {
          background: transparent;
        }
        
        .grid-item {
          background: transparent;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .grid-item:hover {
          transform: ${isEditing ? 'none' : 'translateY(-2px)'};
          box-shadow: ${isEditing ? 'none' : 'var(--shadow-card)'};
        }
        
        /* Grid visual feedback during editing */
        .react-grid-layout {
          position: relative;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.1);
          border: 2px dashed hsl(var(--primary) / 0.5);
          border-radius: 8px;
          opacity: 0.8;
          transition: all 150ms ease;
          z-index: 2;
        }
        
        .react-grid-item.resizing {
          opacity: 0.8;
          transform: scale(1.02);
        }
        
        .react-grid-item.dragging {
          opacity: 0.8;
          transform: rotate(2deg);
          z-index: 100;
        }
        
        /* Resize handles styling */
        .react-resizable-handle {
          background: hsl(var(--primary));
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .react-grid-item:hover .react-resizable-handle {
          opacity: ${isEditing ? '1' : '0'};
        }
        
        .react-resizable-handle-se {
          bottom: 4px;
          right: 4px;
          width: 10px;
          height: 10px;
          border-radius: 2px;
        }
        
        /* Visual grid during editing */
        ${isEditing ? `
          .grid-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(to right, hsl(var(--border) / 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border) / 0.2) 1px, transparent 1px);
            background-size: ${100/12}% ${GRID_CONFIG.rowHeight + GRID_CONFIG.margin[1]}px;
            pointer-events: none;
            z-index: 0;
          }
        ` : ''}
      `}</style>
    </div>
  )
}