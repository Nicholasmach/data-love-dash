import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL do serviço Python (pode ser configurado via variável de ambiente)
const PYTHON_AI_SERVICE_URL = Deno.env.get('PYTHON_AI_SERVICE_URL') || 'http://localhost:5000';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    console.log('🔍 Processing question:', question);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle welcome message
    if (question === '__GET_DATE_RANGE__') {
      try {
        const { data: minData } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .not('deal_created_at', 'is', null)
          .order('deal_created_at', { ascending: true })
          .limit(1);

        const { data: maxData } = await supabase
          .from('deals_normalized')
          .select('deal_created_at')
          .not('deal_created_at', 'is', null)
          .order('deal_created_at', { ascending: false })
          .limit(1);

        let dateInfo = '';
        if (minData?.[0] && maxData?.[0]) {
          const startDate = new Date(minData[0].deal_created_at);
          const endDate = new Date(maxData[0].deal_created_at);
          const startMonth = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const endMonth = endDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          dateInfo = `\n\n📅 **Dados disponíveis:** ${startMonth} até ${endMonth}`;
        }

        return new Response(JSON.stringify({
          answer: `👋 **Olá! Eu sou a Nalk AI!**\n\nPosso ajudar você com análises dos seus dados de CRM.${dateInfo}\n\nComo posso ajudar você hoje? 🚀`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('❌ Welcome message error:', error);
        return new Response(JSON.stringify({
          answer: `👋 **Olá! Eu sou a Nalk AI!**\n\nPosso ajudar você com análises de vendas, motivos de perda e rankings.\n\nComo posso ajudar você hoje? 🚀`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 1: Fetch all data from database
    console.log('📊 Fetching data from database...');
    const { data: allData, error: dataError } = await supabase
      .from('deals_normalized')
      .select('*');

    if (dataError) {
      console.error('❌ Database error:', dataError);
      throw new Error(`Database error: ${dataError.message}`);
    }

    if (!allData || allData.length === 0) {
      return new Response(JSON.stringify({
        answer: 'Não há dados disponíveis no sistema.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Fetched ${allData.length} records`);

    // Step 2: Call Python AI Service
    console.log('🐍 Calling Python AI Service...');
    
    try {
      const pythonResponse = await fetch(`${PYTHON_AI_SERVICE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          data: allData
        })
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python service error: ${pythonResponse.status}`);
      }

      const pythonResult = await pythonResponse.json();
      console.log('🎯 Python service result:', pythonResult.success);

      if (!pythonResult.success) {
        throw new Error(pythonResult.error || 'Python service processing failed');
      }

      // Step 3: Log interaction
      await supabase.from('nalk_ai_logs').insert([{
        question,
        answer: pythonResult.answer,
        query_result: pythonResult.result,
        sql_query: JSON.stringify(pythonResult.analysis),
        created_at: new Date().toISOString()
      }]);

      return new Response(JSON.stringify({ 
        answer: pythonResult.answer 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (pythonError) {
      console.error('❌ Python service error:', pythonError);
      
      // Fallback: Use simple TypeScript processing
      console.log('🔄 Falling back to TypeScript processing...');
      
      const fallbackAnswer = await processFallback(question, allData);
      
      return new Response(JSON.stringify({ 
        answer: fallbackAnswer 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({
      answer: 'Ops! Ocorreu um erro ao processar sua pergunta. Tente novamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Fallback processing function
async function processFallback(question: string, data: any[]): Promise<string> {
  try {
    const questionLower = question.toLowerCase();
    
    // Simple sales analysis
    if (questionLower.includes('valor') || questionLower.includes('vendido')) {
      const closedDeals = data.filter(deal => deal.win === true);
      const totalValue = closedDeals.reduce((sum, deal) => {
        return sum + (parseFloat(deal.deal_amount_total) || 0);
      }, 0);
      
      // Check for month filter
      let filteredDeals = closedDeals;
      if (questionLower.includes('junho')) {
        filteredDeals = closedDeals.filter(deal => {
          if (!deal.deal_created_at) return false;
          const dealDate = new Date(deal.deal_created_at);
          return dealDate.getMonth() === 5; // June is month 5 (0-indexed)
        });
        
        const monthValue = filteredDeals.reduce((sum, deal) => {
          return sum + (parseFloat(deal.deal_amount_total) || 0);
        }, 0);
        
        return `📊 **Vendas em junho de 2025:**\n\n💰 **Valor total vendido:** R$ ${monthValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n✅ **Deals fechados:** ${filteredDeals.length}`;
      }
      
      return `📊 **Vendas totais:**\n\n💰 **Valor total vendido:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n✅ **Deals fechados:** ${closedDeals.length}`;
    }
    
    // Simple loss reasons analysis
    if (questionLower.includes('motivo') && questionLower.includes('perda')) {
      const lostDeals = data.filter(deal => deal.win === false && deal.hold === false);
      const reasonCounts: { [key: string]: number } = {};
      
      lostDeals.forEach(deal => {
        const reason = deal.deal_lost_reason_name || 'Motivo não especificado';
        if (reason && reason.trim() !== '' && reason !== 'null') {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
      });
      
      const topReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => `• **${reason}**: ${count} deals`)
        .slice(0, 5)
        .join('\n');
      
      return `📉 **Motivos de perda:**\n\n❌ **Total perdidos:** ${lostDeals.length} deals\n\n**Top motivos:**\n${topReasons}`;
    }
    
    // Default summary
    const totalDeals = data.length;
    const closedDeals = data.filter(d => d.win === true).length;
    const lostDeals = data.filter(d => d.win === false && d.hold === false).length;
    const inProgress = data.filter(d => d.win === false && d.hold === true).length;
    
    return `📋 **Resumo dos dados:**\n\n📊 **Total de deals:** ${totalDeals}\n✅ **Fechados:** ${closedDeals}\n❌ **Perdidos:** ${lostDeals}\n⏳ **Em andamento:** ${inProgress}`;
    
  } catch (error) {
    console.error('Fallback processing error:', error);
    return 'Desculpe, não consegui processar sua pergunta no momento. Tente novamente.';
  }
}
