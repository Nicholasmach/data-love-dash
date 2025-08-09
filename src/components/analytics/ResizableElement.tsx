import React, { useState, useRef, useEffect } from 'react'
import { useDashboardElements } from '@/contexts/DashboardElementContext'
import { Button } from '@/components/ui/button'
import { Move, RotateCcw, X, Maximize2, Minimize2 } from 'lucide-react'

interface ResizableElementProps {
  elementId: string
  children: React.ReactNode
  position: { x: number; y: number }
  size: { width: number; height: number }
  className?: string
}

export const ResizableElement: React.FC<ResizableElementProps> = ({
  elementId,
  children,
  position,
  size,
  className = ''
}) => {
  const { updateElement, removeElement } = useDashboardElements()
  const [isSelected, setIsSelected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
        setIsSelected(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSelected(true)
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, e.clientX - dragStart.x)
      const newY = Math.max(0, e.clientY - dragStart.y)
      
      updateElement(elementId, {
        position: { x: newX, y: newY }
      })
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      
      const newWidth = Math.max(200, resizeStart.width + deltaX)
      const newHeight = Math.max(150, resizeStart.height + deltaY)
      
      updateElement(elementId, {
        size: { width: newWidth, height: newHeight }
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  const handleReset = () => {
    updateElement(elementId, {
      position: { x: 50, y: 50 },
      size: { width: 600, height: 400 }
    })
  }

  const handleMaximize = () => {
    updateElement(elementId, {
      position: { x: 0, y: 0 },
      size: { width: 1200, height: 800 }
    })
  }

  return (
    <div
      ref={elementRef}
      className={`absolute border-2 transition-all ${
        isSelected 
          ? 'border-primary shadow-lg' 
          : 'border-transparent hover:border-primary/50'
      } ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onClick={() => setIsSelected(true)}
    >
      {/* Control Bar - Only show when selected */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs z-10">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            onMouseDown={handleMouseDown}
          >
            <Move className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleMaximize}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive/20"
            onClick={() => removeElement(elementId)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="w-full h-full overflow-hidden rounded-md">
        {children}
      </div>

      {/* Resize Handles - Only show when selected */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-primary-foreground rounded-sm cursor-nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          
          {/* Edge resize handles */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-primary border border-primary-foreground rounded-sm cursor-n-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-primary border border-primary-foreground rounded-sm cursor-s-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-6 bg-primary border border-primary-foreground rounded-sm cursor-w-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-6 bg-primary border border-primary-foreground rounded-sm cursor-e-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
        </>
      )}
    </div>
  )
}