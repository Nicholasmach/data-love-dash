import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
          .not('deal_created_at', 'is', null)
          .order('deal_created_at', { ascending: true })
          .limit(1);
          
        const { data: dateRangeMax } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .not('deal_created_at', 'is', null)
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

    // Get comprehensive data from the database for context
    console.log('Fetching data from deals_normalized table...');
    
    const { data: allData, error: dataError } = await supabase
      .from('deals_normalized')
      .select('*')
      .limit(5000);

    if (dataError) {
      console.error('Error fetching data:', dataError);
      throw new Error(`Database error: ${dataError.message}`);
    }

    console.log(`Successfully fetched ${allData?.length || 0} records from database`);

    if (!allData || allData.length === 0) {
      return new Response(JSON.stringify({ 
        answer: 'Não encontrei dados disponíveis no sistema. Verifique se os dados foram sincronizados corretamente.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get sample of data for AI context
    const sampleData = allData.slice(0, 3);
    
    // Get available columns dynamically
    const availableColumns = Object.keys(allData[0] || {});
    
    // Get data summary for AI context
    const totalDeals = allData.length;
    const closedDeals = allData.filter(deal => deal.win === true);
    const lostDeals = allData.filter(deal => deal.win === false && deal.hold === false);
    const inProgressDeals = allData.filter(deal => deal.win === false && deal.hold === true);
    
    const totalRevenue = closedDeals.reduce((sum, deal) => sum + (parseFloat(deal.deal_amount_total) || 0), 0);
    
    // Get unique values for key fields
    const uniqueStages = [...new Set(allData.map(d => d.deal_stage_name).filter(Boolean))];
    const uniqueSources = [...new Set(allData.map(d => d.deal_source_name).filter(Boolean))];
    const uniqueUsers = [...new Set(allData.map(d => d.user_name).filter(Boolean))];
    
    // Get date range
    const dates = allData.map(d => d.deal_created_at).filter(Boolean).sort();
    const minDate = dates[0] ? new Date(dates[0]).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'N/A';
    const maxDate = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'N/A';

    // Step 1: Intelligent question analysis
    const analysisPrompt = `Você é um especialista em análise de dados de CRM. Analise esta pergunta e retorne APENAS um JSON válido.

PERGUNTA DO USUÁRIO: "${question}"

CONTEXTO DOS DADOS:
- Total de deals: ${totalDeals}
- Deals fechados: ${closedDeals.length}
- Deals perdidos: ${lostDeals.length}  
- Deals em progresso: ${inProgressDeals.length}
- Receita total: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Período dos dados: ${minDate} até ${maxDate}

CAMPOS DISPONÍVEIS: ${availableColumns.join(', ')}

EXEMPLOS DE DADOS:
${JSON.stringify(sampleData, null, 2)}

REGRAS IMPORTANTES:
- win=true: deal fechado/vendido
- win=false AND hold=false: deal perdido  
- win=false AND hold=true: deal em progresso/em espera
- deal_amount_total: valor do deal
- deal_created_at: data de criação
- deal_lost_reason_name: motivo da perda

INSTRUÇÕES:
1. Identifique o que o usuário quer saber
2. Determine quais campos são necessários
3. Identifique filtros temporais (mês/ano) se houver
4. Determine o tipo de análise necessária

RETORNE APENAS ESTE JSON:
{
  "tipo_analise": "vendas|motivos_perda|ranking|resumo_geral",
  "campos_necessarios": ["campo1", "campo2"],
  "filtros": {
    "temporal": "mês YYYY ou null",
    "status": "fechados|perdidos|em_progresso|todos"
  },
  "entendimento": "resumo do que o usuário quer"
}`;

    console.log('Sending analysis request to Anthropic...');
    
    const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('Analysis response received');

    let analysis = null;
    try {
      const analysisText = analysisData.content?.[0]?.text?.trim() || '{}';
      const cleanAnalysis = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanAnalysis);
      console.log('Analysis parsed successfully:', analysis);
    } catch (parseError) {
      console.error('Analysis parsing failed:', parseError);
      analysis = { 
        tipo_analise: "resumo_geral",
        campos_necessarios: ["*"], 
        filtros: { temporal: null, status: "todos" },
        entendimento: "Análise geral dos dados"
      };
    }

    // Step 2: Filter and process data based on analysis
    let filteredData = [...allData];
    let appliedFilters = [];

    // Apply temporal filters dynamically
    if (analysis.filtros?.temporal) {
      const temporal = analysis.filtros.temporal.toLowerCase();
      console.log('Applying temporal filter:', temporal);
      
      // Extract month and year from the temporal filter
      const monthNames = {
        'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4, 'maio': 5, 'junho': 6,
        'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
      };
      
      let targetMonth = null;
      let targetYear = null;
      
      // Try to extract month and year
      for (const [monthName, monthNum] of Object.entries(monthNames)) {
        if (temporal.includes(monthName)) {
          targetMonth = monthNum;
          break;
        }
      }
      
      const yearMatch = temporal.match(/\d{4}/);
      if (yearMatch) {
        targetYear = parseInt(yearMatch[0]);
      }
      
      if (targetMonth && targetYear) {
        filteredData = filteredData.filter(deal => {
          if (!deal.deal_created_at) return false;
          const dealDate = new Date(deal.deal_created_at);
          return dealDate.getMonth() + 1 === targetMonth && dealDate.getFullYear() === targetYear;
        });
        appliedFilters.push(`${Object.keys(monthNames)[targetMonth - 1]} de ${targetYear}`);
      }
    }

    // Apply status filters
    if (analysis.filtros?.status && analysis.filtros.status !== 'todos') {
      const status = analysis.filtros.status;
      if (status === 'fechados') {
        filteredData = filteredData.filter(deal => deal.win === true);
        appliedFilters.push('deals fechados');
      } else if (status === 'perdidos') {
        filteredData = filteredData.filter(deal => deal.win === false && deal.hold === false);
        appliedFilters.push('deals perdidos');
      } else if (status === 'em_progresso') {
        filteredData = filteredData.filter(deal => deal.win === false && deal.hold === true);
        appliedFilters.push('deals em progresso');
      }
    }

    console.log(`Filtered data: ${filteredData.length} records`);

    // Step 3: Process data based on analysis type
    let processedResult = null;

    switch (analysis.tipo_analise) {
      case 'vendas':
        const closedInPeriod = filteredData.filter(deal => deal.win === true);
        const totalValue = closedInPeriod.reduce((sum, deal) => sum + (parseFloat(deal.deal_amount_total) || 0), 0);
        
        processedResult = {
          tipo: 'vendas',
          valor_total: totalValue,
          quantidade_deals: closedInPeriod.length,
          total_oportunidades: filteredData.length,
          filtros_aplicados: appliedFilters
        };
        break;

      case 'motivos_perda':
        const lostInPeriod = filteredData.filter(deal => deal.win === false && deal.hold === false);
        const reasonCounts = {};
        
        lostInPeriod.forEach(deal => {
          const reason = deal.deal_lost_reason_name || 'Motivo não especificado';
          if (reason && reason.trim() !== '' && reason !== 'null') {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          }
        });
        
        const topReasons = Object.entries(reasonCounts)
          .map(([motivo, quantidade]) => ({ motivo, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10);
        
        processedResult = {
          tipo: 'motivos_perda',
          motivos: topReasons,
          total_perdidos: lostInPeriod.length,
          filtros_aplicados: appliedFilters
        };
        break;

      case 'ranking':
        // Ranking can be by user, source, stage, etc.
        const userStats = {};
        filteredData.forEach(deal => {
          const user = deal.user_name || 'Usuário não especificado';
          if (!userStats[user]) {
            userStats[user] = { total: 0, fechados: 0, valor: 0 };
          }
          userStats[user].total++;
          if (deal.win === true) {
            userStats[user].fechados++;
            userStats[user].valor += parseFloat(deal.deal_amount_total) || 0;
          }
        });
        
        const userRanking = Object.entries(userStats)
          .map(([usuario, stats]) => ({ usuario, ...stats }))
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 10);
        
        processedResult = {
          tipo: 'ranking_usuarios',
          ranking: userRanking,
          filtros_aplicados: appliedFilters
        };
        break;

      default:
        // Resumo geral
        const summary = {
          total_deals: filteredData.length,
          deals_fechados: filteredData.filter(d => d.win === true).length,
          deals_perdidos: filteredData.filter(d => d.win === false && d.hold === false).length,
          deals_em_progresso: filteredData.filter(d => d.win === false && d.hold === true).length,
          valor_total: filteredData.filter(d => d.win === true).reduce((sum, d) => sum + (parseFloat(d.deal_amount_total) || 0), 0)
        };
        
        processedResult = {
          tipo: 'resumo_geral',
          ...summary,
          filtros_aplicados: appliedFilters
        };
        break;
    }

    console.log('Processed result:', processedResult);

    // Step 4: Generate natural language response
    const responsePrompt = `Baseado nos dados processados, forneça uma resposta clara e útil em português brasileiro:

PERGUNTA ORIGINAL: "${question}"
DADOS PROCESSADOS: ${JSON.stringify(processedResult, null, 2)}

INSTRUÇÕES:
1. Responda de forma direta e clara à pergunta
2. Use formatação markdown para destacar números importantes
3. Inclua insights relevantes se houver
4. Seja profissional mas acessível
5. Se não houver dados para o período, explique e sugira períodos alternativos
6. Use números formatados em português (ex: R$ 1.234,56)

Resposta:`;

    const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: responsePrompt }
        ]
      })
    });

    if (!finalResponse.ok) {
      const errorText = await finalResponse.text();
      console.error('Final response API error:', errorText);
      throw new Error(`Final response API error: ${finalResponse.status}`);
    }

    const finalData = await finalResponse.json();
    const finalAnswer = finalData.content?.[0]?.text || 'Desculpe, não consegui processar sua pergunta.';

    // Log the interaction
    await supabase.from('nalk_ai_logs').insert([
      { 
        question, 
        prompt: responsePrompt, 
        answer: finalAnswer, 
        sql_query: JSON.stringify(analysis),
        query_result: processedResult,
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