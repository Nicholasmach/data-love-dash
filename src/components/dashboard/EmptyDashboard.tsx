import React from 'react'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Plus, Zap } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'

interface EmptyDashboardProps {
  className?: string
}

export const EmptyDashboard: React.FC<EmptyDashboardProps> = ({ className = '' }) => {
  const { toggleEditing, isEditing } = useDashboard()

  return (
    <div className={`empty-dashboard ${className}`}>
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-6 max-w-md">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <LayoutDashboard className="w-10 h-10 text-muted-foreground" />
          </div>
          
          {/* Title and Description */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              Dashboard em Branco
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Este dashboard está vazio. Adicione perguntas para começar a visualizar seus dados.
            </p>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            {!isEditing ? (
              <Button 
                onClick={toggleEditing}
                className="neon-button"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Perguntas
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-primary font-medium">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Modo de Edição Ativo
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecione perguntas acima para adicionar ao dashboard
                </p>
              </div>
            )}
          </div>
          
          {/* Features List */}
          <div className="grid grid-cols-1 gap-3 text-left text-sm text-muted-foreground mt-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-xs">1</span>
              </div>
              <span>Arraste e redimensione gráficos livremente</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-xs">2</span>
              </div>
              <span>Aplique filtros globais automaticamente</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-xs">3</span>
              </div>
              <span>Atualizações automáticas em tempo real</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}