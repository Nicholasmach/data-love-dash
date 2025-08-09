import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit3, X, Check, FileText, Eye } from 'lucide-react'
import { DashboardElement, useDashboardElements } from '@/contexts/DashboardElementContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MarkdownElementProps {
  element: DashboardElement
}

export const MarkdownElement: React.FC<MarkdownElementProps> = ({ element }) => {
  const { updateElement, removeElement } = useDashboardElements()
  const [isEditing, setIsEditing] = useState(false)
  const [editMarkdown, setEditMarkdown] = useState(element.markdown || '')

  const handleSave = () => {
    updateElement(element.id, {
      markdown: editMarkdown
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditMarkdown(element.markdown || '')
    setIsEditing(false)
  }

  // Simple markdown to HTML converter for preview
  const renderMarkdown = (text: string) => {
    if (!text) return ''
    
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
      .replace(/\n/gim, '<br>')
  }

  if (isEditing) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 h-full">
          <div className="space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Editando Markdown</span>
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

            <Tabs defaultValue="edit" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="flex-1">
                <Textarea
                  value={editMarkdown}
                  onChange={(e) => setEditMarkdown(e.target.value)}
                  placeholder="Digite seu markdown aqui...&#10;# Título&#10;## Subtítulo&#10;**Negrito** e *itálico*&#10;* Lista item 1&#10;* Lista item 2"
                  className="resize-none h-full font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1">
                <div 
                  className="h-full p-4 border rounded-md bg-muted/20 overflow-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(editMarkdown) }}
                />
              </TabsContent>
            </Tabs>
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


        <div className="h-full overflow-auto">
          {element.markdown ? (
            <div 
              className="prose prose-sm max-w-none h-full"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(element.markdown) }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Clique para editar markdown</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}