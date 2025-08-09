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
      try {
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

    // Step 1: Analyze the question using Anthropic
    const analysisPrompt = `Analise esta pergunta sobre dados de vendas e retorne apenas um JSON:

PERGUNTA: "${question}"

Você precisa identificar:
1. Se é sobre vendas (valor vendido), motivos de perda, ou ranking
2. Se há período específico (mês/ano)
3. Que tipo de filtro aplicar

RETORNE APENAS JSON:
{
  "tipo": "vendas|motivos_perda|ranking|geral",
  "periodo": {
    "mes": 6,
    "ano": 2025
  },
  "filtro_status": "fechados|perdidos|todos"
}

Se não houver período específico, use "periodo": null`;

    const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    if (!analysisResponse.ok) {
      throw new Error(`Anthropic API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let analysis = null;
    
    try {
      const analysisText = analysisData.content?.[0]?.text?.trim() || '{}';
      const cleanAnalysis = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanAnalysis);
      console.log('Analysis:', analysis);
    } catch (parseError) {
      console.error('Analysis parsing failed:', parseError);
      analysis = { tipo: "geral", periodo: null, filtro_status: "todos" };
    }

    // Step 2: Build SQL query based on analysis
    let sqlQuery = `
      SELECT 
        COUNT(*) as total_deals,
        COUNT(CASE WHEN win = true THEN 1 END) as deals_fechados,
        COUNT(CASE WHEN win = false AND hold = false THEN 1 END) as deals_perdidos,
        COUNT(CASE WHEN win = false AND hold = true THEN 1 END) as deals_em_andamento,
        COALESCE(SUM(CASE WHEN win = true THEN deal_amount_total ELSE 0 END), 0) as valor_total
      FROM deals_normalized
      WHERE 1=1
    `;

    let periodDescription = '';

    // Add period filter if specified
    if (analysis.periodo && analysis.periodo.mes && analysis.periodo.ano) {
      const mes = analysis.periodo.mes;
      const ano = analysis.periodo.ano;
      
      sqlQuery += ` AND deal_created_at >= '${ano}-${mes.toString().padStart(2, '0')}-01'`;
      sqlQuery += ` AND deal_created_at < '${ano}-${(mes + 1).toString().padStart(2, '0')}-01'`;
      
      const monthNames = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                         'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      periodDescription = `${monthNames[mes]} de ${ano}`;
    }

    console.log('SQL Query:', sqlQuery);

    // Execute the query
    const { data: queryResult, error: queryError } = await supabase
      .rpc('execute_analytics_query', { sql_query: sqlQuery });

    if (queryError) {
      console.error('Query error:', queryError);
      throw new Error(`Database query error: ${queryError.message}`);
    }

    console.log('Query result:', queryResult);

    if (!queryResult || queryResult.length === 0) {
      return new Response(JSON.stringify({ 
        answer: `Não encontrei dados para ${periodDescription || 'o período solicitado'}. Verifique se há dados disponíveis para esse período.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = queryResult[0];

    // Step 3: Handle specific analysis types
    let additionalData = null;

    if (analysis.tipo === 'motivos_perda') {
      // Get loss reasons
      let lossQuery = `
        SELECT deal_lost_reason_name, COUNT(*) as quantidade
        FROM deals_normalized 
        WHERE win = false AND hold = false 
        AND deal_lost_reason_name IS NOT NULL 
        AND deal_lost_reason_name != ''
      `;
      
      if (analysis.periodo && analysis.periodo.mes && analysis.periodo.ano) {
        const mes = analysis.periodo.mes;
        const ano = analysis.periodo.ano;
        lossQuery += ` AND deal_created_at >= '${ano}-${mes.toString().padStart(2, '0')}-01'`;
        lossQuery += ` AND deal_created_at < '${ano}-${(mes + 1).toString().padStart(2, '0')}-01'`;
      }
      
      lossQuery += ` GROUP BY deal_lost_reason_name ORDER BY quantidade DESC LIMIT 5`;
      
      const { data: lossData } = await supabase.rpc('execute_analytics_query', { sql_query: lossQuery });
      additionalData = { motivos_perda: lossData || [] };
    }

    // Step 4: Generate response using Anthropic
    const responseData = {
      pergunta: question,
      periodo: periodDescription,
      dados: result,
      adicional: additionalData
    };

    const responsePrompt = `Baseado nestes dados, forneça uma resposta clara em português brasileiro:

DADOS: ${JSON.stringify(responseData, null, 2)}

INSTRUÇÕES:
1. Responda diretamente à pergunta
2. Use formatação markdown (**negrito**) para destacar números importantes
3. Formate valores monetários como R$ X.XXX,XX
4. Seja claro e objetivo
5. Se não houver dados, explique e sugira alternativas

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
        max_tokens: 1500,
        messages: [
          { role: 'user', content: responsePrompt }
        ]
      })
    });

    if (!finalResponse.ok) {
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
        sql_query: sqlQuery,
        query_result: responseData,
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