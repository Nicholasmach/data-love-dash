import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryAnalysis {
  type: 'sales' | 'loss_reasons' | 'ranking' | 'summary';
  period?: {
    month: number;
    year: number;
  };
  filters: {
    status: 'closed' | 'lost' | 'in_progress' | 'all';
  };
}

class DataProcessor {
  private data: any[] = [];
  
  constructor(data: any[]) {
    this.data = data;
  }

  filterByPeriod(month?: number, year?: number) {
    if (!month || !year) return this.data;
    
    return this.data.filter(deal => {
      if (!deal.deal_created_at) return false;
      const dealDate = new Date(deal.deal_created_at);
      return dealDate.getMonth() + 1 === month && dealDate.getFullYear() === year;
    });
  }

  filterByStatus(data: any[], status: string) {
    switch (status) {
      case 'closed':
        return data.filter(deal => deal.win === true);
      case 'lost':
        return data.filter(deal => deal.win === false && deal.hold === false);
      case 'in_progress':
        return data.filter(deal => deal.win === false && deal.hold === true);
      default:
        return data;
    }
  }

  processSales(data: any[]) {
    const closedDeals = data.filter(deal => deal.win === true);
    const totalValue = closedDeals.reduce((sum, deal) => {
      return sum + (parseFloat(deal.deal_amount_total) || 0);
    }, 0);

    return {
      type: 'sales',
      total_value: totalValue,
      closed_deals: closedDeals.length,
      total_opportunities: data.length,
      average_deal_size: closedDeals.length > 0 ? totalValue / closedDeals.length : 0
    };
  }

  processLossReasons(data: any[]) {
    const lostDeals = data.filter(deal => deal.win === false && deal.hold === false);
    const reasonCounts: { [key: string]: number } = {};

    lostDeals.forEach(deal => {
      const reason = deal.deal_lost_reason_name || 'Motivo não especificado';
      if (reason && reason.trim() !== '' && reason !== 'null') {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    });

    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      type: 'loss_reasons',
      total_lost: lostDeals.length,
      top_reasons: topReasons
    };
  }

  processRanking(data: any[]) {
    const userStats: { [key: string]: { total: number; closed: number; value: number } } = {};

    data.forEach(deal => {
      const user = deal.user_name || 'Usuário não especificado';
      if (!userStats[user]) {
        userStats[user] = { total: 0, closed: 0, value: 0 };
      }
      
      userStats[user].total++;
      if (deal.win === true) {
        userStats[user].closed++;
        userStats[user].value += parseFloat(deal.deal_amount_total) || 0;
      }
    });

    const ranking = Object.entries(userStats)
      .map(([user, stats]) => ({
        user,
        total_deals: stats.total,
        closed_deals: stats.closed,
        total_value: stats.value,
        conversion_rate: stats.total > 0 ? (stats.closed / stats.total * 100) : 0
      }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 10);

    return {
      type: 'ranking',
      users: ranking
    };
  }

  processSummary(data: any[]) {
    const closed = data.filter(d => d.win === true);
    const lost = data.filter(d => d.win === false && d.hold === false);
    const inProgress = data.filter(d => d.win === false && d.hold === true);
    const totalValue = closed.reduce((sum, d) => sum + (parseFloat(d.deal_amount_total) || 0), 0);

    return {
      type: 'summary',
      total_deals: data.length,
      closed_deals: closed.length,
      lost_deals: lost.length,
      in_progress_deals: inProgress.length,
      total_value: totalValue,
      conversion_rate: data.length > 0 ? (closed.length / data.length * 100) : 0
    };
  }
}

class QueryAnalyzer {
  static analyze(question: string): QueryAnalysis {
    const questionLower = question.toLowerCase();
    
    // Detect type
    let type: QueryAnalysis['type'] = 'summary';
    if (questionLower.includes('valor') || questionLower.includes('vendido') || questionLower.includes('receita')) {
      type = 'sales';
    } else if (questionLower.includes('motivo') && questionLower.includes('perda')) {
      type = 'loss_reasons';
    } else if (questionLower.includes('ranking') || questionLower.includes('melhor') || questionLower.includes('top')) {
      type = 'ranking';
    }

    // Detect period
    let period: QueryAnalysis['period'] = undefined;
    const months = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4, 'maio': 5, 'junho': 6,
      'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };

    for (const [monthName, monthNum] of Object.entries(months)) {
      if (questionLower.includes(monthName)) {
        period = { month: monthNum, year: 2025 }; // Default to 2025 based on data
        break;
      }
    }

    // Year detection
    const yearMatch = questionLower.match(/202[0-9]/);
    if (yearMatch && period) {
      period.year = parseInt(yearMatch[0]);
    }

    // Detect status filter
    let status: QueryAnalysis['filters']['status'] = 'all';
    if (questionLower.includes('fechado') || questionLower.includes('vendido')) {
      status = 'closed';
    } else if (questionLower.includes('perdido')) {
      status = 'lost';
    } else if (questionLower.includes('andamento') || questionLower.includes('progresso')) {
      status = 'in_progress';
    }

    return { type, period, filters: { status } };
  }
}

class ResponseGenerator {
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  static generateResponse(question: string, analysis: QueryAnalysis, result: any): string {
    const periodText = analysis.period 
      ? ` em ${this.getMonthName(analysis.period.month)} de ${analysis.period.year}`
      : '';

    switch (result.type) {
      case 'sales':
        if (result.total_value === 0) {
          return `Não foram encontradas vendas${periodText}. ${result.total_opportunities > 0 ? `Há ${result.total_opportunities} oportunidades no pipeline.` : ''}`;
        }
        return `📊 **Vendas${periodText}:**\n\n` +
               `💰 **Valor total vendido:** ${this.formatCurrency(result.total_value)}\n` +
               `✅ **Deals fechados:** ${result.closed_deals}\n` +
               `📈 **Total de oportunidades:** ${result.total_opportunities}\n` +
               `💵 **Ticket médio:** ${this.formatCurrency(result.average_deal_size)}`;

      case 'loss_reasons':
        if (result.total_lost === 0) {
          return `Não foram encontrados deals perdidos${periodText}.`;
        }
        const reasonsList = result.top_reasons
          .map((r: any, i: number) => `${i + 1}. **${r.reason}** (${r.count} deals)`)
          .join('\n');
        return `📉 **Motivos de perda${periodText}:**\n\n` +
               `❌ **Total perdidos:** ${result.total_lost} deals\n\n` +
               `**Top motivos:**\n${reasonsList}`;

      case 'ranking':
        const usersList = result.users
          .map((u: any, i: number) => 
            `${i + 1}. **${u.user}** - ${this.formatCurrency(u.total_value)} (${u.closed_deals}/${u.total_deals} deals - ${this.formatPercentage(u.conversion_rate)})`
          )
          .join('\n');
        return `🏆 **Ranking de vendedores${periodText}:**\n\n${usersList}`;

      case 'summary':
        return `📋 **Resumo${periodText}:**\n\n` +
               `📊 **Total de deals:** ${result.total_deals}\n` +
               `✅ **Fechados:** ${result.closed_deals}\n` +
               `❌ **Perdidos:** ${result.lost_deals}\n` +
               `⏳ **Em andamento:** ${result.in_progress_deals}\n` +
               `💰 **Valor total:** ${this.formatCurrency(result.total_value)}\n` +
               `📈 **Taxa de conversão:** ${this.formatPercentage(result.conversion_rate)}`;

      default:
        return 'Desculpe, não consegui processar essa solicitação.';
    }
  }

  static getMonthName(month: number): string {
    const months = [
      '', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return months[month] || '';
  }
}

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

    // Step 1: Analyze the question
    console.log('🧠 Analyzing question...');
    const analysis = QueryAnalyzer.analyze(question);
    console.log('📋 Analysis result:', analysis);

    // Step 2: Fetch all data from database
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

    // Step 3: Process data
    console.log('⚙️ Processing data...');
    const processor = new DataProcessor(allData);

    // Filter by period
    let filteredData = processor.filterByPeriod(analysis.period?.month, analysis.period?.year);
    console.log(`📅 After period filter: ${filteredData.length} records`);

    // Filter by status
    filteredData = processor.filterByStatus(filteredData, analysis.filters.status);
    console.log(`🔍 After status filter: ${filteredData.length} records`);

    // Process based on type
    let result;
    switch (analysis.type) {
      case 'sales':
        result = processor.processSales(filteredData);
        break;
      case 'loss_reasons':
        result = processor.processLossReasons(filteredData);
        break;
      case 'ranking':
        result = processor.processRanking(filteredData);
        break;
      default:
        result = processor.processSummary(filteredData);
    }

    console.log('📈 Processing result:', result);

    // Step 4: Generate response
    const response = ResponseGenerator.generateResponse(question, analysis, result);
    console.log('💬 Generated response');

    // Log interaction
    await supabase.from('nalk_ai_logs').insert([{
      question,
      answer: response,
      query_result: result,
      sql_query: JSON.stringify(analysis),
      created_at: new Date().toISOString()
    }]);

    return new Response(JSON.stringify({ answer: response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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