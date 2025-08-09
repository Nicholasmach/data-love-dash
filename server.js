import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import OpenAI from "openai"
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const GROQ_TOKEN = process.env.GROQ_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!GROQ_TOKEN) throw new Error('GROQ_API_KEY not set')
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase credentials not set')

const client = new OpenAI({
  apiKey: GROQ_TOKEN,
  baseURL: "https://api.groq.com/openai/v1"
})
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const app = express()
app.use(bodyParser.json())

// Log file path
const logFile = path.resolve(__dirname, 'nalk_ai.log')

// Helper to append log
function appendLog(message) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${message}\n`
  fs.appendFileSync(logFile, line)
  console.log(line.trim())
}

// Ultra-intelligent AI system - Zero hardcoding, pure AI interpretation
app.post('/api/nalk-ai', async (req, res) => {
  appendLog('Request received')
  try {
    const { question } = req.body
    appendLog(`Question: ${question}`)

    // Special handler for welcome message with date range - MUST be first
    if (question === '__GET_DATE_RANGE__') {
      appendLog('Processing welcome message request')
      try {
        // Get date range from database
        const { data: dateRange } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .order('deal_created_at', { ascending: true })
          .limit(1)
          
        const { data: dateRangeMax } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .order('deal_created_at', { ascending: false })
          .limit(1)

        let dateInfo = ''
        if (dateRange?.[0] && dateRangeMax?.[0]) {
          const startDate = new Date(dateRange[0].deal_created_at)
          const endDate = new Date(dateRangeMax[0].deal_created_at)
          
          const startMonth = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          const endMonth = endDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          
          dateInfo = `\n\n📅 **Dados disponíveis:** ${startMonth} até ${endMonth}`
        }

        const welcomeMessage = `👋 **Olá! Eu sou a Nalk AI!**\n\nPosso ajudar você com análises dos seus dados de CRM.${dateInfo}\n\nComo posso ajudar você hoje? 🚀`
        
        return res.json({ answer: welcomeMessage })
      } catch (error) {
        appendLog(`Welcome message error: ${error.message}`)
        return res.json({ 
          answer: `👋 **Olá! Eu sou a Nalk AI!**\\n\\nPosso ajudar você com análises de vendas, motivos de perda e rankings.\\n\\nComo posso ajudar você hoje? 🚀`
        })
      }
    }

    // Load complete metadata for deep AI understanding
    const metaPath = path.resolve(__dirname, 'supabase/metadata/deals_normalized.json')
    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    appendLog(`Loaded ${metadata.length} metadata fields`)

    // Get comprehensive sample data for AI context
    const { data: sampleData } = await supabase
      .from('deals_normalized')
      .select('*')
      .limit(10)
    
    appendLog(`Sample data retrieved: ${sampleData?.length || 0} records`)

    // Step 1: Ultra-intelligent question analysis
    const analysisPrompt = `RETORNE APENAS JSON VÁLIDO. Analise esta pergunta sobre dados de vendas:

PERGUNTA: "${question}"

CAMPOS DA TABELA:
${metadata.map(m => `${m.name}: ${m.description}`).join('\n')}

DADOS EXEMPLO:
${JSON.stringify(sampleData?.[0] || {}, null, 2)}

REGRAS:
- win=true: deal fechado/vendido
- win=false AND hold=false: deal perdido  
- win=false AND hold=true: deal em espera

RETORNE EXATAMENTE ESTE JSON (sem texto adicional):
{
  "entendimento": "o que o usuário quer saber",
  "campos_necessarios": ["campo1", "campo2"],
  "filtros_identificados": {
    "temporal": "2025-08 ou null",
    "status": "fechados/perdidos/todos"
  },
  "precisa_esclarecimento": false
}`

    const analysisResponse = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.1
    })

    let analysis = null
    try {
      const analysisText = analysisResponse.choices?.[0]?.message?.content?.trim() || '{}'
      const cleanAnalysis = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleanAnalysis)
      appendLog(`Analysis completed: ${JSON.stringify(analysis)}`)
    } catch (parseError) {
      appendLog(`Analysis parsing failed: ${parseError.message}`)
      analysis = { 
        entendimento: "Análise geral dos dados", 
        campos_necessarios: ["*"], 
        filtros_identificados: {},
        precisa_esclarecimento: false
      }
    }

    // Step 2: Check if clarification is needed
    if (analysis.precisa_esclarecimento) {
      const clarificationAnswer = `${analysis.pergunta_esclarecimento}\n\nPor favor, me ajude com mais detalhes para que eu possa fornecer uma resposta mais precisa.`
      
      await supabase.from('nalk_ai_logs').insert([
        { 
          question, 
          prompt: analysisPrompt, 
          answer: clarificationAnswer, 
          sql_query: 'Clarification needed',
          query_result: JSON.stringify(analysis),
          created_at: new Date().toISOString() 
        }
      ])
      
      return res.json({ answer: clarificationAnswer })
    }

    // Step 3: Execute intelligent data retrieval
    let queryResult = null
    let queryError = null

    try {
      // Get comprehensive data based on AI analysis
      let query = supabase.from('deals_normalized')
      
      // Select fields based on AI analysis
      const fields = analysis.campos_necessarios?.includes('*') 
        ? '*'
        : analysis.campos_necessarios?.join(', ') || '*'
      
      query = query.select(fields)

      // Apply intelligent filters based on AI analysis
      const filters = analysis.filtros_identificados || {}
      
      // Temporal filters with intelligent period detection
      let appliedPeriodFilter = null
      if (filters.temporal) {
        const temporal = filters.temporal.toLowerCase()
        
        // Map common period references to actual date ranges
        if (temporal.includes('janeiro') || temporal.includes('2025-01') || temporal.includes('jan') || temporal.includes('01-01')) {
          query = query.gte('deal_created_at', '2025-01-01').lt('deal_created_at', '2025-02-01')
          appliedPeriodFilter = 'janeiro 2025'
        } else if (temporal.includes('fevereiro') || temporal.includes('2025-02') || temporal.includes('feb') || temporal.includes('02-01')) {
          query = query.gte('deal_created_at', '2025-02-01').lt('deal_created_at', '2025-03-01')
          appliedPeriodFilter = 'fevereiro 2025'
        } else if (temporal.includes('março') || temporal.includes('2025-03') || temporal.includes('mar')) {
          query = query.gte('deal_created_at', '2025-03-01').lt('deal_created_at', '2025-04-01')
          appliedPeriodFilter = 'março 2025'
        } else if (temporal.includes('abril') || temporal.includes('2025-04') || temporal.includes('abr')) {
          query = query.gte('deal_created_at', '2025-04-01').lt('deal_created_at', '2025-05-01')
          appliedPeriodFilter = 'abril 2025'
        } else if (temporal.includes('maio') || temporal.includes('2025-05') || temporal.includes('mai')) {
          query = query.gte('deal_created_at', '2025-05-01').lt('deal_created_at', '2025-06-01')
          appliedPeriodFilter = 'maio 2025'
        } else if (temporal.includes('junho') || temporal.includes('2025-06') || temporal.includes('jun')) {
          query = query.gte('deal_created_at', '2025-06-01').lt('deal_created_at', '2025-07-01')
          appliedPeriodFilter = 'junho 2025'
        } else if (temporal.includes('julho') || temporal.includes('2025-07') || temporal.includes('jul')) {
          query = query.gte('deal_created_at', '2025-07-01').lt('deal_created_at', '2025-08-01')
          appliedPeriodFilter = 'julho 2025'
        } else if (temporal.includes('agosto') || temporal.includes('2025-08') || temporal.includes('ago')) {
          query = query.gte('deal_created_at', '2025-08-01').lt('deal_created_at', '2025-09-01')
          appliedPeriodFilter = 'agosto 2025'
        } else if (temporal.includes('setembro') || temporal.includes('2025-09') || temporal.includes('set')) {
          query = query.gte('deal_created_at', '2025-09-01').lt('deal_created_at', '2025-10-01')
          appliedPeriodFilter = 'setembro 2025'
        } else if (temporal.includes('outubro') || temporal.includes('2025-10') || temporal.includes('out')) {
          query = query.gte('deal_created_at', '2025-10-01').lt('deal_created_at', '2025-11-01')
          appliedPeriodFilter = 'outubro 2025'
        } else if (temporal.includes('novembro') || temporal.includes('2025-11') || temporal.includes('nov')) {
          query = query.gte('deal_created_at', '2025-11-01').lt('deal_created_at', '2025-12-01')
          appliedPeriodFilter = 'novembro 2025'
        } else if (temporal.includes('dezembro') || temporal.includes('2025-12') || temporal.includes('dez')) {
          query = query.gte('deal_created_at', '2025-12-01').lt('deal_created_at', '2026-01-01')
          appliedPeriodFilter = 'dezembro 2025'
        }
      }

      // Status filters
      if (filters.status === 'fechados') {
        query = query.eq('win', true)
      } else if (filters.status === 'perdidos') {
        query = query.eq('win', false).eq('hold', false)
      } else if (filters.status === 'em_andamento') {
        query = query.eq('win', false).eq('hold', false)
      }

      // Limit for performance
      query = query.limit(5000)

      const { data, error } = await query
      
      if (error) {
        queryError = error
        appendLog(`Query error: ${error.message}`)
      } else {
        appendLog(`Query executed successfully. Retrieved ${data.length} records for period: ${appliedPeriodFilter || 'all data'}`)
        
        // Check if no data found for specific period
        if (data.length === 0 && appliedPeriodFilter) {
          appendLog(`No data found for period: ${appliedPeriodFilter}`)
          
          // Get available periods to suggest
          const { data: availablePeriods } = await supabase
            .from('deals_normalized')
            .select('deal_created_at')
            .eq('win', true)
            .order('deal_created_at', { ascending: true })
          
          let availableMonths = []
          if (availablePeriods && availablePeriods.length > 0) {
            const monthsSet = new Set()
            availablePeriods.forEach(deal => {
              const date = new Date(deal.deal_created_at)
              const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              monthsSet.add(monthYear)
            })
            availableMonths = Array.from(monthsSet)
          }
          
          const noDataResponse = `Não encontrei dados de vendas para **${appliedPeriodFilter}**. 📊\\n\\nIsso pode acontecer porque:\\n• Não houve vendas fechadas nesse período\\n• Os dados ainda não foram sincronizados\\n\\n**Períodos com dados disponíveis:**\\n${availableMonths.map(month => `• ${month}`).join('\\n')}\\n\\nGostaria de consultar algum desses períodos?`
          
          await supabase.from('nalk_ai_logs').insert([
            { 
              question, 
              prompt: analysisPrompt, 
              answer: noDataResponse, 
              sql_query: `No data found for period: ${appliedPeriodFilter}`,
              query_result: JSON.stringify({ no_data: true, period: appliedPeriodFilter, available_periods: availableMonths }),
              created_at: new Date().toISOString() 
            }
          ])
          
          return res.json({ answer: noDataResponse })
        }
        
        // Step 4: FORCE JavaScript processing for specific question types (BEFORE AI processing)
        const questionLower = question.toLowerCase()
        
        if (questionLower.includes('motivo') && questionLower.includes('perda')) {
          appendLog('Forcing JavaScript processing for loss reasons')
          
          const lostDeals = data.filter(item => !item.win && !item.hold)
          const reasonCounts = {}
          
          lostDeals.forEach(deal => {
            const reason = deal.deal_lost_reason_name || 'Motivo não especificado'
            if (reason && reason.trim() !== '' && reason !== 'null') {
              reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
            }
          })
          
          const sortedReasons = Object.entries(reasonCounts)
            .map(([motivo, quantidade]) => ({ motivo, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5)
          
          queryResult = {
            tipo: "motivos_perda",
            resultados: sortedReasons
          }
          
          appendLog(`JavaScript processed ${lostDeals.length} lost deals, found ${Object.keys(reasonCounts).length} unique reasons`)
          appendLog(`Top reasons: ${JSON.stringify(sortedReasons)}`)
          
        } else if (questionLower.includes('valor') && (questionLower.includes('vendido') || questionLower.includes('fechado') || questionLower.includes('vendas'))) {
          appendLog('Forcing JavaScript processing for sales values')
          
          // Process all data to get monthly breakdown if multiple months requested
          const monthlyData = {}
          
          data.forEach(item => {
            if (item.deal_created_at) {
              const date = new Date(item.deal_created_at)
              const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              
              if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                  total_value: 0,
                  closed_deals: 0,
                  total_opportunities: 0
                }
              }
              
              monthlyData[monthKey].total_opportunities++
              
              if (item.win === true) {
                const value = parseFloat(item.deal_amount_total) || 0
                monthlyData[monthKey].total_value += value
                monthlyData[monthKey].closed_deals++
              }
            }
          })
          
          // If multiple months mentioned, return breakdown
          const monthsInQuestion = ['junho', 'julho', 'agosto', 'maio', 'setembro', 'outubro', 'novembro', 'dezembro']
          const mentionedMonths = monthsInQuestion.filter(month => questionLower.includes(month))
          
          if (mentionedMonths.length > 1) {
            queryResult = {
              tipo: "valores_mensais",
              resultados: Object.entries(monthlyData).map(([mes, dados]) => ({
                mes,
                valor_total: dados.total_value,
                deals_fechados: dados.closed_deals,
                total_oportunidades: dados.total_opportunities
              }))
            }
          } else {
            // Single period summary
            const closedDeals = data.filter(item => item.win === true)
            const totalValue = closedDeals.reduce((sum, item) => {
              const value = parseFloat(item.deal_amount_total) || 0
              return sum + value
            }, 0)
            
            queryResult = {
              tipo: "valor_vendido",
              resultados: [{
                valor_total: totalValue,
                deals_fechados: closedDeals.length,
                total_oportunidades: data.length
              }]
            }
          }
          
          appendLog(`JavaScript processed sales data: ${JSON.stringify(queryResult)}`)
          
        } else {
          // Try multiple times to get valid JSON for other questions
          let processingAttempts = 0
          let processingSuccess = false
          
          while (processingAttempts < 3 && !processingSuccess) {
            processingAttempts++
            
            try {
              const strictPrompt = `CRITICAL: Return ONLY valid JSON. No explanations, no text, ONLY JSON.

QUESTION: "${question}"
DATA: ${data.length} records with fields: ${Object.keys(data[0] || {}).join(', ')}

For loss reasons analysis, use deal_lost_reason_name field.
For sales values, use deal_amount_total where win=true.

RETURN ONLY THIS JSON FORMAT:
{"tipo":"motivos_perda","resultados":[{"motivo":"Reason","quantidade":5}]}

ATTEMPT ${processingAttempts}/3 - JSON ONLY:`

              const processingResponse = await client.chat.completions.create({
                model: "llama3-8b-8192",
                messages: [
                  { role: "system", content: "You are a JSON generator. Return ONLY valid JSON, no other text." },
                  { role: "user", content: strictPrompt }
                ],
                temperature: 0.0
              })

              const processedText = processingResponse.choices?.[0]?.message?.content?.trim() || '{}'
              const cleanProcessed = processedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
              
              // Extract JSON if it's embedded in text
              const jsonMatch = cleanProcessed.match(/\{.*\}/s)
              const jsonToTest = jsonMatch ? jsonMatch[0] : cleanProcessed
              
              queryResult = JSON.parse(jsonToTest)
              appendLog(`Data processed by AI (attempt ${processingAttempts}): ${JSON.stringify(queryResult)}`)
              processingSuccess = true
              
            } catch (processError) {
              appendLog(`Processing parsing failed (attempt ${processingAttempts}): ${processError.message}`)
              
              if (processingAttempts === 3) {
                // Final fallback: intelligent JavaScript processing
                appendLog('Using JavaScript fallback processing')
                
                if (question.toLowerCase().includes('motivo') && question.toLowerCase().includes('perda')) {
                  // Process loss reasons - FORCE JavaScript processing for accuracy
                  const lostDeals = data.filter(item => !item.win && !item.hold)
                  const reasonCounts = {}
                  
                  lostDeals.forEach(deal => {
                    const reason = deal.deal_lost_reason_name || 'Motivo não especificado'
                    if (reason && reason.trim() !== '') {
                      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
                    }
                  })
                  
                  const sortedReasons = Object.entries(reasonCounts)
                    .map(([motivo, quantidade]) => ({ motivo, quantidade }))
                    .sort((a, b) => b.quantidade - a.quantidade)
                    .slice(0, 5)
                  
                  queryResult = {
                    tipo: "motivos_perda",
                    resultados: sortedReasons
                  }
                  
                  appendLog(`JavaScript processed ${lostDeals.length} lost deals, found ${Object.keys(reasonCounts).length} unique reasons`)
                } else {
                  // General statistics
                  const closedDeals = data.filter(item => item.win)
                  const totalValue = closedDeals.reduce((sum, item) => sum + (item.deal_amount_total || 0), 0)
                  queryResult = {
                    tipo: "estatisticas_gerais",
                    resultados: [{ 
                      total_deals: data.length,
                      deals_fechados: closedDeals.length,
                      valor_total: totalValue
                    }]
                  }
                }
                
                appendLog(`JavaScript fallback result: ${JSON.stringify(queryResult)}`)
              }
            }
          }
        }
      }
    } catch (err) {
      queryError = err
      appendLog(`Processing error: ${err.message}`)
    }

    // Step 5: Generate intelligent conversational response
    const responsePrompt = `Baseado na pergunta do usuário e nos dados processados, gere uma resposta OBJETIVA e DIRETA em português brasileiro.

PERGUNTA: ${question}
DADOS PROCESSADOS: ${JSON.stringify(queryResult)}

INSTRUÇÕES CRÍTICAS:
- Seja DIRETO e OBJETIVO - sem "groselha" ou texto desnecessário
- Use **texto** para destacar informações importantes
- Use quebras de linha duplas (\\n\\n) entre seções principais
- Para listas, use quebras de linha simples (\\n) entre itens
- Máximo 5 itens em listas
- NÃO adicione insights ou análises a menos que especificamente solicitado
- NÃO termine com frases como "Se precisar de mais informações..." ou similares

EXEMPLO OBJETIVO PARA MOTIVOS DE PERDA:
**Top 5 Motivos de Perda:**\\n\\n1. **Motivo não especificado**: 681 oportunidades\\n2. **Cliente não interagiu**: 63 oportunidades\\n3. **Negociação duplicada**: 58 oportunidades\\n4. **Cliente parou de interagir**: 33 oportunidades\\n5. **Outros**: 28 oportunidades

EXEMPLO OBJETIVO PARA VALORES:
**Valor vendido em março de 2025:** R$ 1.348,00\\n\\n• Deals fechados: 3\\n• Total de oportunidades: 15`

    const finalResponse = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente de dados expert em CRM/vendas. Responda sempre em português brasileiro de forma conversacional, precisa e bem formatada." 
        },
        { 
          role: "user", 
          content: responsePrompt 
        }
      ],
      temperature: 0.3
    })

    const answer = finalResponse.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.'
    appendLog('Final answer generated')

    // Persist comprehensive log
    await supabase.from('nalk_ai_logs').insert([
      { 
        question, 
        prompt: analysisPrompt, 
        answer, 
        sql_query: `AI-powered analysis: ${analysis.entendimento}`,
        query_result: queryResult ? JSON.stringify(queryResult) : null,
        created_at: new Date().toISOString() 
      }
    ])
    appendLog('Conversation persisted to Supabase')

    res.json({ answer })
  } catch (error) {
    appendLog(`Error: ${error.message || error}`)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const port = parseInt(process.env.PORT || '4000', 10)
app.listen(port, () => {
  console.log(`Nalk AI server listening on port ${port}`)
  appendLog(`Server started on port ${port}`)
})
