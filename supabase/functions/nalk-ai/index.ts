import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DealsMetadata {
  name: string;
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('Processing question:', question);

    // Special handler for welcome message with date range
    if (question === '__GET_DATE_RANGE__') {
      console.log('Processing welcome message request');
      
      try {
        // Get date range from database
        const { data: dateRange } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .order('deal_created_at', { ascending: true })
          .limit(1);
          
        const { data: dateRangeMax } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .order('deal_created_at', { ascending: false })
          .limit(1);

        let dateInfo = '';
        if (dateRange?.[0] && dateRangeMax?.[0]) {
          const startDate = new Date(dateRange[0].deal_created_at);
          const endDate = new Date(dateRangeMax[0].deal_created_at);
          
          const startMonth = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const endMonth = endDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          
          dateInfo = `\n\n📅 **Dados disponíveis:** ${startMonth} até ${endMonth}`;
        }

        const welcomeMessage = `👋 **Olá! Eu sou a Nalk AI!**\n\nPosso ajudar você com análises dos seus dados de CRM.${dateInfo}\n\nComo posso ajudar você hoje? 🚀`;
        
        return new Response(JSON.stringify({ answer: welcomeMessage }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Welcome message error:', error);
        return new Response(JSON.stringify({ 
          answer: `👋 **Olá! Eu sou a Nalk AI!**\\n\\nPosso ajudar você com análises de vendas, motivos de perda e rankings.\\n\\nComo posso ajudar você hoje? 🚀`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Load metadata for AI understanding
    const metadata: DealsMetadata[] = [
      { name: "deal_id", description: "ID único do deal" },
      { name: "deal_name", description: "Nome do deal" },
      { name: "deal_amount_total", description: "Valor total do deal" },
      { name: "deal_created_at", description: "Data de criação do deal" },
      { name: "deal_lost_reason_name", description: "Motivo da perda (se perdido)" },
      { name: "deal_stage_name", description: "Estágio atual do deal" },
      { name: "deal_close_date", description: "Data de fechamento do deal" },
      { name: "win", description: "true se deal foi fechado/vendido, false caso contrário" },
      { name: "hold", description: "true se deal está em espera, false caso contrário" },
      { name: "contact_name", description: "Nome do contato" },
      { name: "contact_email", description: "Email do contato" },
      { name: "organization_name", description: "Nome da organização" }
    ];

    // Get sample data for context
    const { data: sampleData } = await supabase
      .from('deals_normalized')
      .select('*')
      .limit(5);

    console.log(`Sample data retrieved: ${sampleData?.length || 0} records`);

    // Step 1: Question analysis using Anthropic Claude
    const analysisPrompt = `Analise esta pergunta sobre dados de vendas e retorne APENAS um JSON válido:

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
}`;

    const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    const analysisData = await analysisResponse.json();
    console.log('Analysis response:', analysisData);

    let analysis = null;
    try {
      const analysisText = analysisData.content?.[0]?.text?.trim() || '{}';
      const cleanAnalysis = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanAnalysis);
      console.log('Analysis completed:', JSON.stringify(analysis));
    } catch (parseError) {
      console.error('Analysis parsing failed:', parseError);
      analysis = { 
        entendimento: "Análise geral dos dados", 
        campos_necessarios: ["*"], 
        filtros_identificados: {},
        precisa_esclarecimento: false
      };
    }

    // Step 2: Check if clarification is needed
    if (analysis.precisa_esclarecimento) {
      const clarificationAnswer = `${analysis.pergunta_esclarecimento}\n\nPor favor, me ajude com mais detalhes para que eu possa fornecer uma resposta mais precisa.`;
      
      await supabase.from('nalk_ai_logs').insert([
        { 
          question, 
          prompt: analysisPrompt, 
          answer: clarificationAnswer, 
          sql_query: 'Clarification needed',
          query_result: analysis,
          created_at: new Date().toISOString() 
        }
      ]);
      
      return new Response(JSON.stringify({ answer: clarificationAnswer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Execute data retrieval
    let queryResult = null;
    let queryError = null;

    try {
      // Get data based on AI analysis
      let query = supabase.from('deals_normalized');
      
      // Select fields based on AI analysis
      const fields = analysis.campos_necessarios?.includes('*') 
        ? '*'
        : analysis.campos_necessarios?.join(', ') || '*';
      
      query = query.select(fields);

      // Apply filters based on AI analysis
      const filters = analysis.filtros_identificados || {};
      
      // Temporal filters
      let appliedPeriodFilter = null;
      if (filters.temporal) {
        const temporal = filters.temporal.toLowerCase();
        
        // Map common period references to actual date ranges
        const monthMappings: { [key: string]: { start: string, end: string, name: string } } = {
          'janeiro': { start: '2025-01-01', end: '2025-02-01', name: 'janeiro 2025' },
          '2025-01': { start: '2025-01-01', end: '2025-02-01', name: 'janeiro 2025' },
          'fevereiro': { start: '2025-02-01', end: '2025-03-01', name: 'fevereiro 2025' },
          '2025-02': { start: '2025-02-01', end: '2025-03-01', name: 'fevereiro 2025' },
          'março': { start: '2025-03-01', end: '2025-04-01', name: 'março 2025' },
          '2025-03': { start: '2025-03-01', end: '2025-04-01', name: 'março 2025' },
          'abril': { start: '2025-04-01', end: '2025-05-01', name: 'abril 2025' },
          '2025-04': { start: '2025-04-01', end: '2025-05-01', name: 'abril 2025' },
          'maio': { start: '2025-05-01', end: '2025-06-01', name: 'maio 2025' },
          '2025-05': { start: '2025-05-01', end: '2025-06-01', name: 'maio 2025' },
          'junho': { start: '2025-06-01', end: '2025-07-01', name: 'junho 2025' },
          '2025-06': { start: '2025-06-01', end: '2025-07-01', name: 'junho 2025' },
          'julho': { start: '2025-07-01', end: '2025-08-01', name: 'julho 2025' },
          '2025-07': { start: '2025-07-01', end: '2025-08-01', name: 'julho 2025' },
          'agosto': { start: '2025-08-01', end: '2025-09-01', name: 'agosto 2025' },
          '2025-08': { start: '2025-08-01', end: '2025-09-01', name: 'agosto 2025' }
        };

        for (const [key, mapping] of Object.entries(monthMappings)) {
          if (temporal.includes(key)) {
            query = query.gte('deal_created_at', mapping.start).lt('deal_created_at', mapping.end);
            appliedPeriodFilter = mapping.name;
            break;
          }
        }
      }

      // Status filters
      if (filters.status === 'fechados') {
        query = query.eq('win', true);
      } else if (filters.status === 'perdidos') {
        query = query.eq('win', false).eq('hold', false);
      } else if (filters.status === 'em_andamento') {
        query = query.eq('win', false).eq('hold', false);
      }

      // Limit for performance
      query = query.limit(5000);

      const { data, error } = await query;
      
      if (error) {
        queryError = error;
        console.error('Query error:', error);
      } else {
        console.log(`Query executed successfully. Retrieved ${data.length} records for period: ${appliedPeriodFilter || 'all data'}`);
        
        // Check if no data found for specific period
        if (data.length === 0 && appliedPeriodFilter) {
          console.log(`No data found for period: ${appliedPeriodFilter}`);
          
          // Get available periods to suggest
          const { data: availablePeriods } = await supabase
            .from('deals_normalized')
            .select('deal_created_at')
            .eq('win', true)
            .order('deal_created_at', { ascending: true });
          
          let availableMonths: string[] = [];
          if (availablePeriods && availablePeriods.length > 0) {
            const monthsSet = new Set<string>();
            availablePeriods.forEach(deal => {
              const date = new Date(deal.deal_created_at);
              const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              monthsSet.add(monthYear);
            });
            availableMonths = Array.from(monthsSet);
          }
          
          const noDataResponse = `Não encontrei dados de vendas para **${appliedPeriodFilter}**. 📊\\n\\nIsso pode acontecer porque:\\n• Não houve vendas fechadas nesse período\\n• Os dados ainda não foram sincronizados\\n\\n**Períodos com dados disponíveis:**\\n${availableMonths.map(month => `• ${month}`).join('\\n')}\\n\\nGostaria de consultar algum desses períodos?`;
          
          await supabase.from('nalk_ai_logs').insert([
            { 
              question, 
              prompt: analysisPrompt, 
              answer: noDataResponse, 
              sql_query: `No data found for period: ${appliedPeriodFilter}`,
              query_result: { no_data: true, period: appliedPeriodFilter, available_periods: availableMonths },
              created_at: new Date().toISOString() 
            }
          ]);
          
          return new Response(JSON.stringify({ answer: noDataResponse }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Process data based on question type
        const questionLower = question.toLowerCase();
        
        if (questionLower.includes('motivo') && questionLower.includes('perda')) {
          console.log('Processing loss reasons');
          
          const lostDeals = data.filter(item => !item.win && !item.hold);
          const reasonCounts: { [key: string]: number } = {};
          
          lostDeals.forEach(deal => {
            const reason = deal.deal_lost_reason_name || 'Motivo não especificado';
            if (reason && reason.trim() !== '' && reason !== 'null') {
              reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            }
          });
          
          const sortedReasons = Object.entries(reasonCounts)
            .map(([motivo, quantidade]) => ({ motivo, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);
          
          queryResult = {
            tipo: "motivos_perda",
            resultados: sortedReasons
          };
          
          console.log(`Processed ${lostDeals.length} lost deals, found ${Object.keys(reasonCounts).length} unique reasons`);
          
        } else if (questionLower.includes('valor') && (questionLower.includes('vendido') || questionLower.includes('fechado') || questionLower.includes('vendas'))) {
          console.log('Processing sales values');
          
          const closedDeals = data.filter(item => item.win === true);
          const totalValue = closedDeals.reduce((sum, item) => {
            const value = parseFloat(item.deal_amount_total) || 0;
            return sum + value;
          }, 0);
          
          queryResult = {
            tipo: "valor_vendido",
            resultados: [{
              valor_total: totalValue,
              deals_fechados: closedDeals.length,
              total_oportunidades: data.length
            }]
          };
          
          console.log('Processed sales data:', JSON.stringify(queryResult));
          
        } else {
          // General data summary
          queryResult = {
            tipo: "resumo_geral",
            resultados: [{
              total_deals: data.length,
              deals_fechados: data.filter(item => item.win === true).length,
              deals_perdidos: data.filter(item => !item.win && !item.hold).length,
              deals_em_andamento: data.filter(item => !item.win && item.hold).length
            }]
          };
        }
      }
    } catch (error) {
      console.error('Data retrieval error:', error);
      queryError = error;
    }

    // Step 4: Generate final answer using Anthropic
    const responsePrompt = `Baseado nos dados analisados, forneça uma resposta clara e útil em português brasileiro:

PERGUNTA ORIGINAL: "${question}"
ANÁLISE: ${JSON.stringify(analysis)}
DADOS PROCESSADOS: ${JSON.stringify(queryResult)}

Forneça uma resposta profissional e útil que:
1. Responda diretamente à pergunta
2. Inclua números e insights relevantes
3. Use formatação em markdown para destacar informações importantes
4. Seja clara e fácil de entender
5. Termine com uma pergunta ou sugestão de próximos passos

Resposta:`;

    const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: responsePrompt }
        ]
      })
    });

    const finalData = await finalResponse.json();
    const finalAnswer = finalData.content?.[0]?.text || 'Desculpe, não consegui processar sua pergunta.';

    // Log the interaction
    await supabase.from('nalk_ai_logs').insert([
      { 
        question, 
        prompt: responsePrompt, 
        answer: finalAnswer, 
        sql_query: JSON.stringify(queryResult),
        query_result: queryResult,
        created_at: new Date().toISOString() 
      }
    ]);

    return new Response(JSON.stringify({ answer: finalAnswer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nalk-ai function:', error);
    return new Response(JSON.stringify({ 
      answer: 'Ops! Ocorreu um erro ao processar sua pergunta. Tente novamente.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});