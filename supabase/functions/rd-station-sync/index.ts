import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client - usando variáveis de ambiente seguras
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// RD Station configuration
const API_URL = 'https://crm.rdstation.com/api/v1/deals';
const DEFAULT_BATCH_SIZE = 200;
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY = 60000; // 1 minute

interface DealResponse {
  deals: any[];
}

interface SyncConfig {
  apiKey: string;
  startDate: string;
  batchSize?: number;
  useStreaming?: boolean;
}

// Utility functions for data cleaning (mantendo as funções existentes)
function cleanName(name: any): string {
  if (name === null || name === undefined) {
    return '';
  }
  return String(name).replace(/\t/g, ' ').replace(/\s+/g, ' ').replace(/•/g, '').trim();
}

function extractNestedValues(deal: any) {
  const newFields: any = {};

  // Campaign
  const campaign = deal.campaign;
  if (campaign) {
    newFields.campaign_name = cleanName(campaign.name);
  }

  // Contacts
  const contacts = deal.contacts;
  if (contacts && contacts.length > 0) {
    const contact = contacts[0];
    newFields.contact_name = cleanName(contact.name);
    const contactEmails = contact.emails;
    newFields.contact_email = contactEmails && contactEmails.length > 0 ? contactEmails[0].email : '';
  }

  // Deal custom fields
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

  // Deal lost reason
  const dealLostReason = deal.deal_lost_reason;
  if (dealLostReason) {
    newFields.deal_lost_reason_name = cleanName(dealLostReason.name);
  }

  // Deal products
  const dealProducts = deal.deal_products || [];
  for (let i = 0; i < dealProducts.length; i++) {
    const product = dealProducts[i];
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

  // Deal source
  const dealSource = deal.deal_source;
  if (dealSource) {
    newFields.deal_source_name = cleanName(dealSource.name);
  }

  // Deal stage
  const dealStage = deal.deal_stage;
  if (dealStage) {
    newFields.deal_stage_id = dealStage.id;
    newFields.deal_stage_name = cleanName(dealStage.name);
  }

  // Organization
  const organization = deal.organization;
  if (organization) {
    newFields.organization_name = cleanName(organization.name);
  }

  // User
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
    
    // Process base fields
    for (const [k, v] of Object.entries(deal)) {
      if (!excludeFields.includes(k)) {
        const newKey = renameMap[k] || k;
        dealCleaned[newKey] = typeof v === 'string' ? cleanName(v) : v;
      }
    }

    // Process nested fields
    const nestedFields = extractNestedValues(deal);
    Object.assign(dealCleaned, nestedFields);
    
    cleanedDeals.push(dealCleaned);
  }

  return cleanedDeals;
}

// Função otimizada para buscar deals com streaming e controle de timeouts
async function fetchDealsForPeriod(
  startDate: string, 
  endDate: string, 
  apiKey: string,
  batchSize: number = DEFAULT_BATCH_SIZE,
  onProgress?: (current: number, total: number) => void
): Promise<any[]> {
  const allDeals = [];
  let page = 1;
  let hasMore = true;
  let retryCount = 0;

  console.log(`🚀 Iniciando coleta otimizada para período ${startDate} até ${endDate}`);
  console.log(`📊 Batch size: ${batchSize}, API: ${API_URL}`);

  while (hasMore && retryCount < MAX_RETRIES) {
    const url = `${API_URL}?token=${apiKey}&created_at_period=true&start_date=${startDate}&end_date=${endDate}&limit=${batchSize}&page=${page}`;
    
    try {
      console.log(`📄 Processando página ${page} (${allDeals.length} deals coletados)`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Lovable-Analytics/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 429) {
        console.log('⏳ Rate limit atingido, aguardando 60s...');
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        retryCount++;
        continue;
      }

      if (response.status === 401) {
        throw new Error('Token de API inválido. Verifique suas credenciais.');
      }

      if (!response.ok) {
        throw new Error(`Erro na API RD Station: ${response.status} - ${response.statusText}`);
      }

      const data: DealResponse = await response.json();
      const deals = data.deals || [];
      
      if (deals.length > 0) {
        const cleanedDeals = cleanDealData(deals);
        allDeals.push(...cleanedDeals);
        console.log(`✅ Página ${page}: ${deals.length} deals processados (Total: ${allDeals.length})`);
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(allDeals.length, allDeals.length + (deals.length === batchSize ? batchSize : 0));
        }
      } else {
        console.log(`📭 Página ${page}: Nenhum deal encontrado`);
      }
      
      page++;
      hasMore = deals.length === batchSize;
      retryCount = 0; // Reset retry count on success
      
      // Pausa entre requisições para evitar rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Erro na página ${page}:`, error);
      
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout na requisição, tentando novamente...');
      }
      
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Falha após ${MAX_RETRIES} tentativas: ${error.message}`);
      }
      
      // Exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`🔄 Tentativa ${retryCount}/${MAX_RETRIES} em ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  console.log(`🎯 Coleta concluída: ${allDeals.length} deals do período ${startDate} até ${endDate}`);
  return allDeals;
}

// Função para processar deals em batches menores para evitar timeouts
async function processDealsInBatches(deals: any[], syncJobId: string, batchSize: number = 500) {
  console.log(`🔄 Processando ${deals.length} deals em batches de ${batchSize}`);
  
  const processedDeals = [];
  const normalizedDeals = [];
  
  for (let i = 0; i < deals.length; i += batchSize) {
    const batch = deals.slice(i, i + batchSize);
    console.log(`📦 Processando batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(deals.length / batchSize)}`);
    
    for (const deal of batch) {
      const processedDeal = {
        rd_deal_id: deal.deal_id || String(deal.id) || '',
        raw_data: deal,
        processed_data: {
          deal_name: deal.deal_name || deal.name || '',
          deal_amount_total: deal.deal_amount_total || deal.amount_total || 0,
          deal_created_at: deal.deal_created_at || deal.created_at || null,
          deal_updated_at: deal.deal_updated_at || deal.updated_at || null,
          deal_closed_at: deal.deal_closed_at || deal.closed_at || null,
          custom_fields: {},
          products: []
        },
        sync_job_id: syncJobId
      };
      
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
      
      // Extract custom fields and products
      const customFields: any = {};
      const products = [];
      
      for (const [key, value] of Object.entries(deal)) {
        const standardFields = [
          'deal_id', 'id', 'deal_name', 'name', 'deal_amount_total', 'amount_total', 
          'deal_created_at', 'created_at', 'deal_updated_at', 'updated_at',
          'deal_closed_at', 'closed_at', 'deal_stage_id', 'deal_stage_name',
          'deal_source_name', 'deal_lost_reason_name', 'contact_name', 'contact_email',
          'campaign_name', 'organization_name', 'user_id', 'user_name', 'interactions',
          'win', 'hold', 'last_activity_at', 'last_activity_content'
        ];
        
        if (key.startsWith('product_')) {
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
          if (typeof value === 'object' && value !== null) {
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
  }
  
  return { processedDeals, normalizedDeals };
}

// Função para inserir dados em batches para evitar timeouts
async function insertDataInBatches(table: string, data: any[], batchSize: number = 1000) {
  console.log(`💾 Inserindo ${data.length} registros na tabela ${table} em batches de ${batchSize}`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(data.length / batchSize);
    
    console.log(`📝 Inserindo batch ${batchNumber}/${totalBatches} na tabela ${table}`);
    
    const { error } = await supabase
      .from(table)
      .insert(batch);
    
    if (error) {
      console.error(`❌ Erro ao inserir batch ${batchNumber} na tabela ${table}:`, error);
      throw error;
    }
    
    console.log(`✅ Batch ${batchNumber}/${totalBatches} inserido com sucesso`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: SyncConfig = await req.json();
    const { apiKey, startDate, batchSize = DEFAULT_BATCH_SIZE, useStreaming = true } = config;
    
    console.log('🚀 Iniciando sincronização RD Station otimizada...');
    console.log('📋 Configuração:', { 
      hasApiKey: !!apiKey, 
      startDate, 
      batchSize, 
      useStreaming 
    });
    
    if (!apiKey) {
      throw new Error('Token de API é obrigatório');
    }
    
    if (!startDate) {
      throw new Error('Data de início é obrigatória');
    }
    
    // Validar período máximo de 1 ano
    const start = new Date(startDate);
    const now = new Date();
    const diffInDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    if (diffInDays > 365) {
      throw new Error('Período máximo permitido é de 1 ano. Ajuste a data de início.');
    }
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];
    
    console.log(`📅 Período validado: ${startDateStr} até ${endDateStr} (${diffInDays} dias)`);
    
    // Create sync job
    const { data: syncJob, error: syncError } = await supabase
      .from('rd_sync_jobs')
      .insert({
        user_id: null,
        status: 'running',
        start_date: start.toISOString(),
        end_date: now.toISOString(),
        total_deals: 0,
        last_sync_date: now.toISOString()
      })
      .select()
      .single();
    
    if (syncError) {
      console.error('❌ Erro ao criar job de sincronização:', syncError);
      throw syncError;
    }

    console.log(`📋 Job de sincronização criado: ${syncJob.id}`);

    // Background task para sincronização
    EdgeRuntime.waitUntil((async () => {
      try {
        // Fetch deals with progress tracking
        const allDeals = await fetchDealsForPeriod(
          startDateStr, 
          endDateStr, 
          apiKey, 
          batchSize
        );

        console.log(`📊 Total coletado: ${allDeals.length} deals`);
        
        if (allDeals.length === 0) {
          await supabase
            .from('rd_sync_jobs')
            .update({
              status: 'completed',
              total_deals: 0,
              end_date: new Date().toISOString()
            })
            .eq('id', syncJob.id);
          return;
        }

        // Process deals in batches
        const { processedDeals, normalizedDeals } = await processDealsInBatches(
          allDeals, 
          syncJob.id, 
          500
        );

        // Clear existing data (full refresh)
        console.log('🧹 Executando limpeza de dados existentes...');
        await supabase.from('rd_deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('deals_normalized').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Dados existentes removidos');

        // Insert processed data in batches
        if (processedDeals.length > 0) {
          await insertDataInBatches('rd_deals', processedDeals, 1000);
        }

        if (normalizedDeals.length > 0) {
          await insertDataInBatches('deals_normalized', normalizedDeals, 1000);
        }

        // Update sync job as completed
        await supabase
          .from('rd_sync_jobs')
          .update({
            status: 'completed',
            total_deals: allDeals.length,
            end_date: new Date().toISOString()
          })
          .eq('id', syncJob.id);

        console.log('🎉 Sincronização concluída com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro na sincronização background:', error);
        
        await supabase
          .from('rd_sync_jobs')
          .update({
            status: 'error',
            end_date: new Date().toISOString()
          })
          .eq('id', syncJob.id);
      }
    })());

    // Retorna resposta imediata
    return new Response(
      JSON.stringify({ 
        success: true, 
        syncJobId: syncJob.id,
        message: 'Sincronização iniciada em background',
        estimatedTime: `${Math.ceil(diffInDays / 30)} minutos`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro durante inicialização da sincronização:', error);
    
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