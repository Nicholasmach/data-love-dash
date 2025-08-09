import React, { useState } from 'react'
import { PREDEFINED_QUESTIONS, getQuestionsByCategory } from '@/lib/predefinedQuestions'
import { useDashboard } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, TrendingUp, Users, Target, Zap, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/input'

const CATEGORY_ICONS = {
  revenue: TrendingUp,
  leads: Users, 
  conversion: Target,
  performance: Zap,
  pipeline: BarChart3
}

const CATEGORY_LABELS = {
  revenue: 'Receita',
  leads: 'Leads',
  conversion: 'Conversão', 
  performance: 'Performance',
  pipeline: 'Pipeline'
}

interface DashboardQuestionMenuProps {
  className?: string
}

export const DashboardQuestionMenu: React.FC<DashboardQuestionMenuProps> = ({ className = '' }) => {
  const { isEditing, addCard } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!isEditing) {
    return null
  }

  const filteredQuestions = PREDEFINED_QUESTIONS.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleQuestionSelect = (questionId: string) => {
    // Find a good position for the new card
    const position = {
      col: 0,
      row: 0,
      sizeX: 6, // Half width by default
      sizeY: 4  // Medium height
    }
    
    addCard(questionId, position)
  }

  return (
    <div className={`dashboard-question-menu crypto-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Adicionar Perguntas</h3>
          <Badge variant="secondary" className="text-xs">
            {filteredQuestions.length} disponíveis
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 crypto-input"
            />
          </div>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="all">
          <QuestionGrid questions={filteredQuestions} onSelect={handleQuestionSelect} />
        </TabsContent>

        {Object.keys(CATEGORY_LABELS).map(category => (
          <TabsContent key={category} value={category}>
            <QuestionGrid 
              questions={getQuestionsByCategory(category as any)} 
              onSelect={handleQuestionSelect}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface QuestionGridProps {
  questions: typeof PREDEFINED_QUESTIONS
  onSelect: (questionId: string) => void
}

const QuestionGrid: React.FC<QuestionGridProps> = ({ questions, onSelect }) => {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {questions.map(question => {
        const Icon = CATEGORY_ICONS[question.category]
        return (
          <Card 
            key={question.id}
            className="question-card interactive-hover cursor-pointer"
            onClick={() => onSelect(question.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {question.chartType}
                  </Badge>
                </div>
                <span className="text-lg">{question.icon}</span>
              </div>
              
              <CardTitle className="text-sm font-medium leading-tight">
                {question.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <CardDescription className="text-xs text-muted-foreground">
                {question.description}
              </CardDescription>
              
              <Button 
                size="sm" 
                className="w-full mt-3 neon-button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(question.id)
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}