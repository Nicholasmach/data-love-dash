import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PredefinedQuestion } from '@/lib/predefinedQuestions'
import { Badge } from '@/components/ui/badge'

interface AddQuestionModalProps {
  question: PredefinedQuestion | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (question: PredefinedQuestion, position: string, size: string) => void
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [selectedPosition, setSelectedPosition] = useState('top-left')
  const [selectedSize, setSelectedSize] = useState('medium')

  const handleConfirm = () => {
    if (question) {
      onConfirm(question, selectedPosition, selectedSize)
      onClose()
      // Reset selections for next time
      setSelectedPosition('top-left')
      setSelectedSize('medium')
    }
  }

  const positions = [
    { id: 'top-left', label: 'Superior Esquerdo', coords: { x: 50, y: 50 } },
    { id: 'top-center', label: 'Superior Centro', coords: { x: 200, y: 50 } },
    { id: 'top-right', label: 'Superior Direito', coords: { x: 350, y: 50 } },
    { id: 'center', label: 'Centro', coords: { x: 200, y: 200 } },
    { id: 'bottom-left', label: 'Inferior Esquerdo', coords: { x: 50, y: 350 } },
    { id: 'bottom-center', label: 'Inferior Centro', coords: { x: 200, y: 350 } },
    { id: 'bottom-right', label: 'Inferior Direito', coords: { x: 350, y: 350 } }
  ]

  const sizes = [
    { id: 'small', label: 'Pequeno', dimensions: { width: 400, height: 300 } },
    { id: 'medium', label: 'Médio', dimensions: { width: 600, height: 400 } },
    { id: 'large', label: 'Grande', dimensions: { width: 800, height: 500 } }
  ]

  const categoryColors = {
    revenue: 'bg-green-100 text-green-800 border-green-200',
    leads: 'bg-blue-100 text-blue-800 border-blue-200',
    conversion: 'bg-purple-100 text-purple-800 border-purple-200',
    performance: 'bg-orange-100 text-orange-800 border-orange-200',
    pipeline: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  if (!question) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Pergunta ao Dashboard</DialogTitle>
          <DialogDescription>
            Configure as opções iniciais para o gráfico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{question.icon}</span>
              <h4 className="font-medium">{question.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{question.description}</p>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${categoryColors[question.category]}`}
              >
                {question.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.chartType}
              </Badge>
            </div>
          </div>

          {/* Position Selection */}
          <div className="space-y-2">
            <Label htmlFor="position">Posição Inicial</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a posição" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(position => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <Label htmlFor="size">Tamanho Inicial</Label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tamanho" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map(size => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.label} ({size.dimensions.width}x{size.dimensions.height}px)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Adicionar ao Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}