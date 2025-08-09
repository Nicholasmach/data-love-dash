import React from 'react'
import { useDashboardElements } from '@/contexts/DashboardElementContext'
import { ChartWidget } from './ChartWidget'
import { TextElement } from './elements/TextElement'
import { MarkdownElement } from './elements/MarkdownElement'
import { ResizableElement } from './ResizableElement'
import { Plus, LayoutDashboard } from 'lucide-react'

interface DashboardCanvasProps {
  className?: string
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({ className = '' }) => {
  const { elements } = useDashboardElements()

  return (
    <div 
      className={`relative w-full h-full bg-white rounded-lg min-h-[600px] overflow-auto ${className}`}
      style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    >
      {elements.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-muted-foreground">Canvas em Branco</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Clique em uma pergunta acima para adicionar gráficos ao seu dashboard
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span>Seu dashboard customizado aparecerá aqui</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          {elements.map(element => {
            const ElementWrapper = ({ children }: { children: React.ReactNode }) => (
              <ResizableElement
                key={element.id}
                elementId={element.id}
                position={element.position}
                size={element.size}
              >
                {children}
              </ResizableElement>
            )

            switch (element.type) {
              case 'chart':
                return (
                  <ElementWrapper key={element.id}>
                    <ChartWidget
                      chart={{
                        id: element.id,
                        type: element.chartType!,
                        title: element.title!,
                        query: element.query!,
                        position: element.position,
                        size: element.size,
                        questionId: element.questionId,
                        filters: element.filters
                      }}
                    />
                  </ElementWrapper>
                )
              case 'text':
                return (
                  <ElementWrapper key={element.id}>
                    <TextElement element={element} />
                  </ElementWrapper>
                )
              case 'markdown':
                return (
                  <ElementWrapper key={element.id}>
                    <MarkdownElement element={element} />
                  </ElementWrapper>
                )
              default:
                return null
            }
          })}
        </div>
      )}
    </div>
  )
}