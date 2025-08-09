import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client
const supabaseUrl = 'https://eilgptvbqczpfgmojnvm.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// RD Station configuration
const RD_STATION_TOKEN = Deno.env.get('RD_STATION_TOKEN')!;
const API_URL = 'https://crm.rdstation.com/api/v1/deals';
const LIMIT = 200;

interface DealResponse {
  deals: any[];
}

interface DealProduct {
  product_id?: string;
  name?: string;
  description?: string;
  base_price?: number;
  price?: number;
  discount?: number;
  discount_type?: string;
  total?: number;
}

function cleanName(name: any): string {
  if (name === null || name === undefined) {
    return '';
  }
  return String(name).replace(/\t/g, ' ').replace(/\s+/g, ' ').replace(/•/g, '').trim();
}

function extractNestedValues(deal: any) {
  const newFields: any = {};

  // Campanha
  const campaign = deal.campaign;
  if (campaign) {
    newFields.campaign_name = cleanName(campaign.name);
  }

  // Contatos
  const contacts = deal.contacts;
  if (contacts && contacts.length > 0) {
    const contact = contacts[0];
    newFields.contact_name = cleanName(contact.name);
    const contactEmails = contact.emails;
    newFields.contact_email = contactEmails && contactEmails.length > 0 ? contactEmails[0].email : '';
  }

  // Campos personalizados do negócio
  const dealCustomFields = deal.deal_custom_fields || [];
  for (const field of dealCustomFields) {
    const label = cleanName(field.custom_field?.label);
    let value = '';
    if (field.value) {
      if (Array.isArray(field.value)) {
        value = field.value.join(', ');
      } else {
        value = String(field.value);
      }
    }
    if (label) {
      newFields[label] = value;
    }
  }

  // Motivo da perda do negócio
  const dealLostReason = deal.deal_lost_reason;
  if (dealLostReason) {
    newFields.deal_lost_reason_name = cleanName(dealLostReason.name);
  }

  // Produtos do negócio
  const dealProducts = deal.deal_products || [];
  for (let i = 0; i < dealProducts.length; i++) {
    const product: DealProduct = dealProducts[i];
    const index = i + 1;
    newFields[`product_id_${index}`] = product.product_id || '';
    newFields[`product_name_${index}`] = cleanName(product.name);
    newFields[`product_description_${index}`] = cleanName(product.description);
    newFields[`product_base_price_${index}`] = product.base_price || 0;
    newFields[`product_price_${index}`] = product.price || 0;
    newFields[`product_discount_${index}`] = product.discount || 0;
    newFields[`product_discount_type_${index}`] = product.discount_type || '';
    newFields[`product_total_${index}`] = product.total || 0;
  }

  // Fonte do negócio
  const dealSource = deal.deal_source;
  if (dealSource) {
    newFields.deal_source_name = cleanName(dealSource.name);
  }

  // Etapa do negócio
  const dealStage = deal.deal_stage;
  if (dealStage) {
    newFields.deal_stage_id = dealStage.id;
    newFields.deal_stage_name = cleanName(dealStage.name);
  }

  // Organização
  const organization = deal.organization;
  if (organization) {
    newFields.organization_name = cleanName(organization.name);
  }

  // Usuário
  const user = deal.user;
  if (user) {
    newFields.user_id = user.id;
    newFields.user_name = cleanName(user.name);
  }

  return newFields;
}

function cleanDealData(deals: any[]) {
  const cleanedDeals = [];
  const renameMap: { [key: string]: string } = {
    'closed_at': 'deal_closed_at',
    'amount_total': 'deal_amount_total',
    'amount_unique': 'deal_amount_unique',
    'created_at': 'deal_created_at',
    'id': 'deal_id',
    'name': 'deal_name',
    'updated_at': 'deal_updated_at',
  };

  const excludeFields = [
    "campaign", "contacts", "deal_custom_fields", "deal_lost_reason", 
    "deal_products", "deal_source", "deal_stage", "organization", "user", 
    "next_task", "_id", "markup", "markup_created", "markup_last_activities", 
    "prediction_date", "rating", "stop_time_limit", "user_changed", "amount_monthly"
  ];

  for (const deal of deals) {
    const dealCleaned: any = {};
    
    // Processa campos base
    for (const [k, v] of Object.entries(deal)) {
      if (!excludeFields.includes(k)) {
        const newKey = renameMap[k] || k;
        dealCleaned[newKey] = typeof v === 'string' ? cleanName(v) : v;
      }
    }

    // Processa campos aninhados
    const nestedFields = extractNestedValues(deal);
    Object.assign(dealCleaned, nestedFields);
    
    cleanedDeals.push(dealCleaned);
  }

  return cleanedDeals;
}

async function fetchDealsForPeriod(startDate: string, endDate: string, rdToken: string): Promise<any[]> {
  const allDeals = [];
  let page = 1;
  let hasMore = true;

  console.log(`Iniciando coleta para período ${startDate} até ${endDate}`);
  console.log(`URL base da API: ${API_URL}`);

  while (hasMore) {
    const url = `${API_URL}?token=${rdToken}&created_at_period=true&start_date=${startDate}&end_date=${endDate}&limit=${LIMIT}&page=${page}`;
    console.log(`URL completa: ${url.replace(rdToken, '***')}`);
    
    try {
      console.log(`Buscando página ${page}`);
      const response = await fetch(url);
      
      if (response.status === 429) {
        console.log('Rate limit atingido, aguardando...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data: DealResponse = await response.json();
      const deals = data.deals || [];
      
      allDeals.push(...cleanDealData(deals));
      console.log(`Página ${page} - Coletados ${deals.length} registros`);
      
      page++;
      
      // Continue enquanto retornar o limite máximo
      hasMore = deals.length === LIMIT;
      
      // Pequena pausa entre requisições para evitar rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`Erro ao buscar deals: ${error}`);
      throw error;
    }
  }

  console.log(`Total de deals coletados para o período: ${allDeals.length}`);
  return allDeals;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


async function processAllDeals(allDeals: any[], syncJobId: string) {
  console.log('Processando deals para inserção...');
  
  // Processa todos os deals
  const processedDeals = [];
  const normalizedDeals = [];
  
  for (const deal of allDeals) {
    const processedDeal = {
      rd_deal_id: deal.deal_id || String(deal.id) || '',
      raw_data: deal, // Salva dados brutos
      processed_data: {
        // Campos principais extraídos
        deal_name: deal.deal_name || deal.name || '',
        deal_amount_total: deal.deal_amount_total || deal.amount_total || 0,
        deal_created_at: deal.deal_created_at || deal.created_at || null,
        deal_updated_at: deal.deal_updated_at || deal.updated_at || null,
        deal_closed_at: deal.deal_closed_at || deal.closed_at || null,
        // Campos customizados processados ficam aqui
        custom_fields: {},
        products: []
      }
    };
    
    // Cria versão normalizada para análises com TODOS os campos do JSON
    const normalizedDeal = {
      rd_deal_id: deal.deal_id || String(deal.id) || '',
      deal_name: deal.deal_name || deal.name || '',
      deal_amount_total: parseFloat(deal.deal_amount_total || deal.amount_total || 0),
      deal_amount_unique: parseFloat(deal.deal_amount_unique || deal.amount_unique || 0),
      deal_created_at: deal.deal_created_at || deal.created_at || null,
      deal_updated_at: deal.deal_updated_at || deal.updated_at || null,
      deal_closed_at: deal.deal_closed_at || deal.closed_at || null,
      deal_stage_id: deal.deal_stage_id || '',
      deal_stage_name: deal.deal_stage_name || '',
      deal_source_name: deal.deal_source_name || '',
      deal_lost_reason_name: deal.deal_lost_reason_name || '',
      contact_name: deal.contact_name || '',
      contact_email: deal.contact_email || '',
      campaign_name: deal.campaign_name || '',
      organization_name: deal.organization_name || '',
      user_id: deal.user_id || '',
      user_name: deal.user_name || '',
      interactions: parseInt(deal.interactions || 0),
      win: Boolean(deal.win),
      hold: Boolean(deal.hold),
      last_activity_at: deal.last_activity_at || null,
      last_activity_content: deal.last_activity_content || '',
      sync_job_id: syncJobId
    };
    
    // Extrai TODOS os campos customizados e produtos para processed_data
    const customFields: any = {};
    const products = [];
    
    // Normaliza TODOS os campos do JSON que não são padrão
    for (const [key, value] of Object.entries(deal)) {
      // Ignora campos já mapeados
      const standardFields = [
        'deal_id', 'id', 'deal_name', 'name', 'deal_amount_total', 'amount_total', 
        'deal_created_at', 'created_at', 'deal_updated_at', 'updated_at',
        'deal_closed_at', 'closed_at', 'deal_stage_id', 'deal_stage_name',
        'deal_source_name', 'deal_lost_reason_name', 'contact_name', 'contact_email',
        'campaign_name', 'organization_name', 'user_id', 'user_name', 'interactions',
        'win', 'hold', 'last_activity_at', 'last_activity_content'
      ];
      
      if (key.startsWith('product_')) {
        // Lógica de produtos mantida
        const parts = key.split('_');
        if (parts.length >= 3) {
          const index = parts[parts.length - 1];
          const field = parts.slice(1, -1).join('_');
          
          if (!products[parseInt(index) - 1]) {
            products[parseInt(index) - 1] = {};
          }
          products[parseInt(index) - 1][field] = value;
        }
      } else if (!standardFields.includes(key)) {
        // Todos os outros campos vão para custom_fields (NORMALIZAÇÃO COMPLETA)
        if (typeof value === 'object' && value !== null) {
          // Se for objeto, converte para string JSON para armazenar
          customFields[key] = JSON.stringify(value);
        } else {
          customFields[key] = value;
        }
      }
    }
    
    processedDeal.processed_data.custom_fields = customFields;
    processedDeal.processed_data.products = products.filter(p => p);
    
    processedDeals.push(processedDeal);
    normalizedDeals.push(normalizedDeal);
  }
  
  return { processedDeals, normalizedDeals };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, startDate, pageLimit, autoSync, incrementalSync } = await req.json();
    
    console.log('Iniciando sincronização RD Station...');
    console.log('Parâmetros recebidos:', { apiKey: apiKey ? '***' : 'não informado', startDate, incrementalSync, autoSync });
    
    // Use a data definida pelo usuário ou uma data padrão
    const syncStartDate = startDate ? new Date(startDate) : new Date('2024-01-01');
    const syncEndDate = new Date();
    
    console.log(`Coletando deals de ${syncStartDate.toISOString()} até ${syncEndDate.toISOString()}`);
    
    // SEMPRE usar a data especificada pelo usuário, ignorar sincronização incremental para full refresh
    let actualStartDate = syncStartDate;
    
    // Só usar incremental se não foi especificada uma data específica
    if (incrementalSync && !startDate) {
      console.log('Verificando última sincronização para modo incremental...');
      const { data: lastSync } = await supabase
        .from('rd_sync_jobs')
        .select('last_sync_date')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastSync?.last_sync_date) {
        actualStartDate = new Date(lastSync.last_sync_date);
        console.log(`Sincronização incremental desde: ${actualStartDate.toISOString()}`);
      }
    }
    
    // Registra o início da sincronização
    const { data: syncJob, error: syncError } = await supabase
      .from('rd_sync_jobs')
      .insert({
        user_id: null,
        status: 'running',
        start_date: actualStartDate.toISOString(),
        end_date: syncEndDate.toISOString(),
        total_deals: 0,
        last_sync_date: syncEndDate.toISOString()
      })
      .select()
      .single();
    
    if (syncError) {
      console.error('Erro ao criar job de sincronização:', syncError);
      throw syncError;
    }

    // Buscar todos os deals do período definido
    const startDateStr = actualStartDate.toISOString().split('T')[0];
    const endDateStr = syncEndDate.toISOString().split('T')[0];
    
    const allDeals = await fetchDealsForPeriod(startDateStr, endDateStr, apiKey);

    console.log(`Total de deals coletados: ${allDeals.length}`);
    
    const { processedDeals, normalizedDeals } = await processAllDeals(allDeals, syncJob.id);
    
    // Adiciona sync_job_id aos dados brutos
    const dealsWithSyncJobId = processedDeals.map(deal => ({
      ...deal,
      sync_job_id: syncJob.id
    }));
    
    // SEMPRE fazer full refresh quando especificada uma data inicial
    const shouldFullRefresh = !incrementalSync || startDate;
    
    if (shouldFullRefresh) {
      // Full refresh: deletar todos os dados existentes antes de inserir novos
      console.log('Executando full refresh - deletando dados existentes...');
      await supabase.from('rd_deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('deals_normalized').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('Dados existentes removidos');
    }
    
    // Salvar dados brutos
    if (dealsWithSyncJobId.length > 0) {
      const { error: insertError } = await supabase
        .from('rd_deals')
        .insert(dealsWithSyncJobId);
      
      if (insertError) {
        console.error('Erro ao inserir deals brutos:', insertError);
        throw insertError;
      }
    }
    
    // Salvar dados normalizados (upsert apenas para incremental, insert para full refresh)
    if (normalizedDeals.length > 0) {
      if (shouldFullRefresh) {
        const { error: insertError } = await supabase
          .from('deals_normalized')
          .insert(normalizedDeals);
        
        if (insertError) {
          console.error('Erro ao inserir deals normalizados:', insertError);
          throw insertError;
        }
      } else {
        const { error: upsertError } = await supabase
          .from('deals_normalized')
          .upsert(normalizedDeals, { onConflict: 'rd_deal_id' });
        
        if (upsertError) {
          console.error('Erro ao fazer upsert deals normalizados:', upsertError);
          throw upsertError;
        }
      }
    }

    // Atualiza o job como concluído
    await supabase
      .from('rd_sync_jobs')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
        total_deals: allDeals.length
      })
      .eq('id', syncJob.id);

    console.log('Sincronização concluída com sucesso');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        syncJobId: syncJob.id,
        recordsProcessed: allDeals.length,
        message: 'Sincronização RD Station concluída com sucesso' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro durante a sincronização:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro durante a sincronização', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});