import React, { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { scrollToBottom } from '@/utils/scroll'
import { processNalkAIQuestion } from '@/services/nalkAIService'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
}

// Componente para renderizar markdown com formatação adequada
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Converte **texto** para <strong>texto</strong>
  const formatBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  // Converte quebras de linha e formatação
  const formatText = (text: string) => {
    let formatted = formatBold(text)
    
    // PRIMEIRO: Converte \\n\\n literais para quebras reais
    formatted = formatted.replace(/\\n\\n/g, '\n\n')
    formatted = formatted.replace(/\\n/g, '\n')
    
    // DEPOIS: Converte quebras de linha duplas em parágrafos
    formatted = formatted.replace(/\n\n/g, '</p><p>')
    
    // Converte quebras de linha simples em <br>
    formatted = formatted.replace(/\n/g, '<br>')
    
    // Envolve em parágrafo se não começar com <p>
    if (!formatted.startsWith('<p>')) {
      formatted = `<p>${formatted}</p>`
    }
    
    return formatted
  }

  return (
    <div 
      className="text-sm leading-relaxed space-y-3"
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
      style={{ lineHeight: '1.6' }}
    />
  )
}

const NalkAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  // Mensagem de boas-vindas dinâmica
  useEffect(() => {
    const loadWelcomeMessage = async () => {
      setLoading(true)
      
      try {
        // Buscar range de datas disponíveis
        const data = await processNalkAIQuestion('__GET_DATE_RANGE__')
        
        const welcomeMessage: Message = {
          id: 0,
          role: 'assistant',
          text: data.answer || `👋 **Olá! Eu sou a Nalk AI!**

Posso ajudar você com análises de vendas, motivos de perda e rankings.

Como posso ajudar você hoje? 🚀`
        }
        setMessages([welcomeMessage])
      } catch (error) {
        console.error('Error loading welcome message:', error)
        const fallbackMessage: Message = {
          id: 0,
          role: 'assistant',
          text: `👋 **Olá! Eu sou a Nalk AI!**

Posso ajudar você com análises de vendas, motivos de perda e rankings.

Como posso ajudar você hoje? 🚀`
        }
        setMessages([fallbackMessage])
      } finally {
        setLoading(false)
      }
    }
    
    loadWelcomeMessage()
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return
    
    const userMsg: Message = { id: Date.now(), role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Usar serviço local ou Edge Function
      const data = await processNalkAIQuestion(input)
      
      const aiMsg: Message = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: data.answer || 'Desculpe, não consegui processar sua pergunta.' 
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      console.error('Error processing question:', error)
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Ops! Ocorreu um erro ao processar sua pergunta. Tente novamente.'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }

    scrollToBottom(containerRef.current)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    scrollToBottom(containerRef.current)
  }, [messages])

  return (
    <div className="p-6 flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Nalk AI</h1>
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-4 p-4 bg-card rounded">
        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
              m.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary/50'
            }`}>
              {m.role === 'user' ? (
                <div className="text-sm">{m.text}</div>
              ) : (
                <MarkdownRenderer content={m.text} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <div className="inline-block p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">Analisando seus dados...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Textarea
          className="flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Faça sua pergunta sobre os dados... (Enter para enviar, Shift+Enter para nova linha)"
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  )
}

export default NalkAI
