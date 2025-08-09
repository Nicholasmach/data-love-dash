import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Type, 
  FileText, 
  BarChart3, 
  Space,
  Save, 
  Download, 
  Upload, 
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react'
import { useDashboardElements } from '@/contexts/DashboardElementContext'

interface DashboardToolbarProps {
  onAddTextElement: () => void
  onAddMarkdownElement: () => void
  onAddSpacerElement: () => void
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  onAddTextElement,
  onAddMarkdownElement,
  onAddSpacerElement
}) => {
  const { clearElements, saveConfig } = useDashboardElements()

  return (
    <div className="flex items-center gap-4 p-4 bg-background border-b">
      {/* Add Elements */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Adicionar:</span>
        <Button variant="outline" size="sm" onClick={onAddTextElement}>
          <Type className="h-4 w-4 mr-2" />
          Texto
        </Button>
        <Button variant="outline" size="sm" onClick={onAddMarkdownElement}>
          <FileText className="h-4 w-4 mr-2" />
          Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={onAddSpacerElement}>
          <Space className="h-4 w-4 mr-2" />
          Espaçador
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* File Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button variant="outline" size="sm" onClick={clearElements}>
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <Button onClick={saveConfig}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  )
}