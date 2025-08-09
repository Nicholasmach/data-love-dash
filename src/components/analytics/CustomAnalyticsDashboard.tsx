import React from 'react'
import { useState } from 'react'
import { DashboardElementProvider, useDashboardElements } from '@/contexts/DashboardElementContext'
import { QuestionMenu } from './QuestionMenu'
import { AddQuestionModal } from './AddQuestionModal'
import { DashboardCanvas } from './DashboardCanvas'
import { DashboardToolbar } from './DashboardToolbar'
import { PredefinedQuestion } from '@/lib/predefinedQuestions'

const CustomAnalyticsDashboardContent: React.FC = () => {
  const { addElement } = useDashboardElements()
  const [selectedQuestion, setSelectedQuestion] = useState<PredefinedQuestion | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleQuestionClick = (question: PredefinedQuestion) => {
    setSelectedQuestion(question)
    setIsModalOpen(true)
  }

  const handleModalConfirm = (question: PredefinedQuestion, position: string, size: string) => {
    const positions = {
      'top-left': { x: 50, y: 50 },
      'top-center': { x: 200, y: 50 },
      'top-right': { x: 350, y: 50 },
      'center': { x: 200, y: 200 },
      'bottom-left': { x: 50, y: 350 },
      'bottom-center': { x: 200, y: 350 },
      'bottom-right': { x: 350, y: 350 }
    }

    const sizes = {
      'small': { width: 400, height: 300 },
      'medium': { width: 600, height: 400 },
      'large': { width: 800, height: 500 }
    }

    const elementConfig = {
      type: 'chart' as const,
      title: question.title,
      chartType: question.chartType,
      query: question.query,
      questionId: question.id,
      position: positions[position as keyof typeof positions] || { x: 50, y: 50 },
      size: sizes[size as keyof typeof sizes] || { width: 600, height: 400 }
    }
    
    addElement(elementConfig)
  }

  const addTextElement = () => {
    addElement({
      type: 'text',
      title: 'Novo Texto',
      content: '',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 200 },
      textAlign: 'left'
    })
  }

  const addMarkdownElement = () => {
    addElement({
      type: 'markdown',
      markdown: '# Novo Markdown\n\nEdite este conteúdo...',
      position: { x: 0, y: 0 },
      size: { width: 500, height: 300 }
    })
  }

  const addSpacerElement = () => {
    addElement({
      type: 'spacer',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 }
    })
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Customizável</h2>
          <p className="text-muted-foreground">
            Crie seu dashboard personalizado estilo Metabase
          </p>
        </div>
      </div>

      {/* Question Menu */}
      <QuestionMenu onQuestionClick={handleQuestionClick} />

      {/* Toolbar */}
      <DashboardToolbar
        onAddTextElement={addTextElement}
        onAddMarkdownElement={addMarkdownElement}
        onAddSpacerElement={addSpacerElement}
      />

      {/* Dashboard Canvas */}
      <div className="flex-1 p-6">
        <DashboardCanvas className="h-full" />
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedQuestion(null)
        }}
        onConfirm={handleModalConfirm}
      />
    </div>
  )
}

export const CustomAnalyticsDashboard: React.FC = () => {
  return (
    <DashboardElementProvider>
      <CustomAnalyticsDashboardContent />
    </DashboardElementProvider>
  )
}