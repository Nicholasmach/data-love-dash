import React, { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Edit3, 
  Save, 
  MoreVertical, 
  Settings, 
  Share, 
  Download,
  RefreshCw,
  Clock,
  Eye,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardHeaderProps {
  className?: string
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = '' }) => {
  const { 
    dashboard, 
    isEditing, 
    isDirty, 
    toggleEditing, 
    saveDashboard 
  } = useDashboard()
  
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(dashboard?.name || 'Novo Dashboard')

  const handleSaveName = () => {
    // TODO: Update dashboard name
    setIsEditingName(false)
  }

  const handleShare = () => {
    console.log('Share dashboard')
  }

  const handleExport = () => {
    console.log('Export dashboard')
  }

  const handleSettings = () => {
    console.log('Dashboard settings')
  }

  const handleAutoRefresh = () => {
    console.log('Configure auto-refresh')
  }

  return (
    <div className={`dashboard-header crypto-card ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Title and status */}
        <div className="flex items-center gap-4">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="crypto-input text-lg font-bold max-w-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') {
                    setTempName(dashboard?.name || 'Novo Dashboard')
                    setIsEditingName(false)
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName}>
                <Save className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setTempName(dashboard?.name || 'Novo Dashboard')
                  setIsEditingName(false)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 
                className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {dashboard?.name || 'Novo Dashboard'}
              </h1>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
                className="opacity-0 hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {isEditing && (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                <Edit3 className="w-3 h-3 mr-1" />
                Editando
              </Badge>
            )}
            
            {isDirty && (
              <Badge variant="secondary">
                Alterações não salvas
              </Badge>
            )}
            
            {dashboard?.auto_apply_filters && (
              <Badge variant="outline">
                <RefreshCw className="w-3 h-3 mr-1" />
                Auto-apply
              </Badge>
            )}
            
            {dashboard?.refresh_interval_sec && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {dashboard.refresh_interval_sec}s
              </Badge>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {isEditing ? (
            <>
              <Button 
                onClick={saveDashboard}
                disabled={!isDirty}
                className="neon-button"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              
              <Button 
                onClick={toggleEditing}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </>
          ) : (
            <Button 
              onClick={toggleEditing}
              className="neon-button"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleAutoRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto-refresh
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Dashboard Description */}
      {dashboard?.description && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {dashboard.description}
          </p>
        </div>
      )}
    </div>
  )
}