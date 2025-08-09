import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PREDEFINED_QUESTIONS, PredefinedQuestion, getQuestionsByCategory } from '@/lib/predefinedQuestions'
import { Search, Plus, Info, Code, Filter } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

interface QuestionCardProps {
  question: PredefinedQuestion
  onAddToCanvas: (question: PredefinedQuestion) => void
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAddToCanvas }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: question.id,
    data: {
      type: 'question',
      question
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  const categoryColors = {
    revenue: 'bg-green-100 text-green-800 border-green-200',
    leads: 'bg-blue-100 text-blue-800 border-blue-200',
    conversion: 'bg-purple-100 text-purple-800 border-purple-200',
    performance: 'bg-orange-100 text-orange-800 border-orange-200',
    pipeline: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  return (
    <TooltipProvider>
      <Card 
        ref={setNodeRef} 
        style={style}
        className={`cursor-grab transition-all hover:shadow-lg ${isDragging ? 'opacity-50' : ''}`}
        {...listeners}
        {...attributes}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{question.icon}</span>
              <CardTitle className="text-sm font-medium flex-1">{question.title}</CardTitle>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{question.explanation}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                    >
                      <Code className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-md">
                    <pre className="text-xs whitespace-pre-wrap">{question.query.trim()}</pre>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onAddToCanvas(question)
              }}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">{question.description}</p>
        <div className="flex items-center justify-between">
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
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}

interface QuestionLibraryProps {
  onAddToCanvas: (question: PredefinedQuestion) => void
}

export const QuestionLibrary: React.FC<QuestionLibraryProps> = ({ onAddToCanvas }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredQuestions = PREDEFINED_QUESTIONS.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'all' || question.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: 'all', label: 'Todas', count: PREDEFINED_QUESTIONS.length },
    { id: 'revenue', label: 'Receita', count: getQuestionsByCategory('revenue').length },
    { id: 'leads', label: 'Leads', count: getQuestionsByCategory('leads').length },
    { id: 'conversion', label: 'Conversão', count: getQuestionsByCategory('conversion').length },
    { id: 'performance', label: 'Performance', count: getQuestionsByCategory('performance').length },
    { id: 'pipeline', label: 'Pipeline', count: getQuestionsByCategory('pipeline').length }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 space-y-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Biblioteca de Perguntas</h3>
          <Badge variant="secondary">{filteredQuestions.length} disponíveis</Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-hidden pt-4">
        <div className="h-full overflow-y-auto pr-2 space-y-3">
          {filteredQuestions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              onAddToCanvas={onAddToCanvas}
            />
          ))}
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma pergunta encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou termo de busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}