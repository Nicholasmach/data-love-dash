// Serviço para comunicação com a Nalk AI
// Pode usar Python local ou Edge Function remota

const USE_LOCAL_PYTHON = true; // Mudar para false em produção
const PYTHON_SERVICE_URL = 'http://localhost:5000';

export async function processNalkAIQuestion(question: string) {
  if (USE_LOCAL_PYTHON) {
    try {
      // Primeiro, buscar dados do Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Se for mensagem de boas-vindas
      if (question === '__GET_DATE_RANGE__') {
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

        return {
          answer: `👋 **Olá! Eu sou a Nalk AI!**\n\nPosso ajudar você com análises dos seus dados de CRM.${dateInfo}\n\nComo posso ajudar você hoje? 🚀`
        };
      }
      
      // Buscar todos os dados
      const { data: allData, error: dataError } = await supabase
        .from('deals_normalized')
        .select('*');
        
      if (dataError) throw dataError;
      
      // Chamar serviço Python local
      const response = await fetch(`${PYTHON_SERVICE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          data: allData || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Python service error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }
      
      // Log no Supabase (opcional)
      try {
        await supabase.from('nalk_ai_logs').insert([{
          question,
          answer: result.answer,
          query_result: result.result,
          sql_query: JSON.stringify(result.analysis),
          created_at: new Date().toISOString()
        }]);
      } catch (logError) {
        console.warn('Failed to log interaction:', logError);
      }
      
      return { answer: result.answer };
      
    } catch (error) {
      console.error('Local Python service error:', error);
      
      // Fallback para Edge Function remota
      console.log('Falling back to remote Edge Function...');
      const { supabase } = await import('@/integrations/supabase/client');
      return await supabase.functions.invoke('nalk-ai', {
        body: { question }
      }).then(res => res.data);
    }
  } else {
    // Usar Edge Function remota
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('nalk-ai', {
      body: { question }
    });
    
    if (error) throw error;
    return data;
  }
}
