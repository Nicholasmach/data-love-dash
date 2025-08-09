import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit3, X, Check, Type } from 'lucide-react'
import { DashboardElement, useDashboardElements } from '@/contexts/DashboardElementContext'

interface TextElementProps {
  element: DashboardElement
}

export const TextElement: React.FC<TextElementProps> = ({ element }) => {
  const { updateElement, removeElement } = useDashboardElements()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(element.title || '')
  const [editContent, setEditContent] = useState(element.content || '')
  const [editTextAlign, setEditTextAlign] = useState(element.textAlign || 'left')

  const handleSave = () => {
    updateElement(element.id, {
      title: editTitle,
      content: editContent,
      textAlign: editTextAlign as 'left' | 'center' | 'right'
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(element.title || '')
    setEditContent(element.content || '')
    setEditTextAlign(element.textAlign || 'left')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full">
          <div className="space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">Editando Texto</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Título</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Digite o título..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Alinhamento</label>
                <Select value={editTextAlign} onValueChange={(value) => setEditTextAlign(value as 'left' | 'center' | 'right')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Conteúdo</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Digite o conteúdo..."
                  className="resize-none h-32"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full group hover:shadow-md transition-shadow">
      <CardContent className="p-6 h-full relative">
        {/* Edit Button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={() => setIsEditing(true)}
        >
          <Edit3 className="h-4 w-4" />
        </Button>


        <div className="h-full flex flex-col">
          {element.title && (
            <h3 
              className={`text-lg font-semibold mb-4 text-${element.textAlign || 'left'}`}
            >
              {element.title}
            </h3>
          )}
          
          {element.content && (
            <div 
              className={`flex-1 text-${element.textAlign || 'left'} whitespace-pre-wrap`}
            >
              {element.content}
            </div>
          )}

          {!element.title && !element.content && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Clique para editar</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}