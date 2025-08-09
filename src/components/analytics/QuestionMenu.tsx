import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PREDEFINED_QUESTIONS, PredefinedQuestion, getQuestionsByCategory } from '@/lib/predefinedQuestions'
import { Search, Plus, Info, Code, Filter } from 'lucide-react'

interface QuestionMenuCardProps {
  question: PredefinedQuestion
  onClick: (question: PredefinedQuestion) => void
}

const QuestionMenuCard: React.FC<QuestionMenuCardProps> = ({ question, onClick }) => {
  const categoryColors = {
    revenue: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    leads: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    conversion: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    performance: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    pipeline: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
  }

  return (
    <TooltipProvider>
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md border ${categoryColors[question.category]} group`}
        onClick={() => onClick(question)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl">{question.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{question.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{question.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <Badge variant="secondary" className="text-xs">
                {question.chartType}
              </Badge>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
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
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                    >
                      <Code className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-md">
                    <pre className="text-xs whitespace-pre-wrap">{question.query.trim()}</pre>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick(question)
                }}
                className="h-6 w-6 p-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

interface QuestionMenuProps {
  onQuestionClick: (question: PredefinedQuestion) => void
}

export const QuestionMenu: React.FC<QuestionMenuProps> = ({ onQuestionClick }) => {
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
    <div className="space-y-4 p-6 border-b bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Biblioteca de Perguntas</h3>
          <p className="text-sm text-muted-foreground">Clique em uma pergunta para adicioná-la ao dashboard</p>
        </div>
        <Badge variant="secondary">{filteredQuestions.length} disponíveis</Badge>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
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

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredQuestions.map(question => (
          <QuestionMenuCard
            key={question.id}
            question={question}
            onClick={onQuestionClick}
          />
        ))}
        
        {filteredQuestions.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>Nenhuma pergunta encontrada</p>
            <p className="text-sm">Tente ajustar os filtros ou termo de busca</p>
          </div>
        )}
      </div>
    </div>
  )
}