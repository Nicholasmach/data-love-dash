// Script para testar os dados do banco
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://eilgptvbqczpfgmojnvm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGdwdHZicWN6cGZnbW9qbnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjAwNDMsImV4cCI6MjA2OTk5NjA0M30.0Eyzg_OH3QnMOrUVB07Z0Ai6K9234O-kMot_N77eo4o';

console.log('🔗 Conectando ao Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testData() {
  console.log('🔍 Testando dados do banco...\n');
  
  // Buscar todos os dados
  const { data: allData, error } = await supabase
    .from('deals_normalized')
    .select('*');
    
  if (error) {
    console.error('❌ Erro ao buscar dados:', error);
    return;
  }
  
  console.log(`📊 Total de registros: ${allData.length}`);
  
  // Filtrar por junho de 2025
  const june2025Deals = allData.filter(deal => {
    if (!deal.deal_created_at) return false;
    const date = new Date(deal.deal_created_at);
    return date.getMonth() === 5 && date.getFullYear() === 2025;
  });
  
  console.log(`📅 Deals em junho/2025: ${june2025Deals.length}`);
  
  // Deals fechados em junho
  const closedJune = june2025Deals.filter(d => d.win === true);
  console.log(`✅ Deals fechados em junho/2025: ${closedJune.length}`);
  
  // Calcular valor total
  const totalValue = closedJune.reduce((sum, deal) => {
    return sum + (parseFloat(deal.deal_amount_total) || 0);
  }, 0);
  
  console.log(`💰 Valor total vendido em junho/2025: R$ ${totalValue.toLocaleString('pt-BR')}`);
  
  // Mostrar alguns exemplos
  console.log('\n📋 Primeiros 5 deals de junho/2025:');
  june2025Deals.slice(0, 5).forEach((deal, i) => {
    console.log(`${i + 1}. ${deal.deal_name || 'Sem nome'} - R$ ${deal.deal_amount_total} - Win: ${deal.win} - Data: ${deal.deal_created_at}`);
  });
  
  // Verificar distribuição por mês
  console.log('\n📊 Distribuição por mês:');
  const monthCounts = {};
  allData.forEach(deal => {
    if (!deal.deal_created_at) return;
    const date = new Date(deal.deal_created_at);
    const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  
  Object.entries(monthCounts)
    .sort((a, b) => {
      const [ma, ya] = a[0].split('/').map(Number);
      const [mb, yb] = b[0].split('/').map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    })
    .forEach(([month, count]) => {
      console.log(`  ${month}: ${count} deals`);
    });
}

testData().catch(console.error);
