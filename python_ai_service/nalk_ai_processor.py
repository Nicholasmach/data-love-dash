import json
import pandas as pd
from datetime import datetime, timedelta
import re
from typing import Dict, List, Any, Optional, Tuple
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NalkAIProcessor:
    """
    Processador de IA da Nalk - Sistema robusto para análise de dados de CRM
    Sem hardcode, totalmente dinâmico e eficiente
    """
    
    def __init__(self):
        self.months_pt = {
            'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4, 
            'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
            'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
        }
        
    def analyze_question(self, question: str) -> Dict[str, Any]:
        """
        Analisa a pergunta do usuário e extrai intenção, período e filtros
        """
        question_lower = question.lower()
        
        # Detectar tipo de análise
        analysis_type = self._detect_analysis_type(question_lower)
        
        # Detectar período temporal
        period = self._detect_period(question_lower)
        
        # Detectar filtros de status
        status_filter = self._detect_status_filter(question_lower)
        
        # Detectar filtros adicionais
        additional_filters = self._detect_additional_filters(question_lower)
        
        return {
            'type': analysis_type,
            'period': period,
            'status_filter': status_filter,
            'additional_filters': additional_filters,
            'original_question': question
        }
    
    def _detect_analysis_type(self, question: str) -> str:
        """Detecta o tipo de análise baseado na pergunta"""
        
        # Análise de vendas/receita
        if any(word in question for word in ['valor', 'vendido', 'receita', 'faturamento', 'vendas']):
            return 'sales'
        
        # Análise de motivos de perda
        if any(word in question for word in ['motivo', 'perda', 'perdido', 'perdeu']):
            return 'loss_reasons'
        
        # Ranking/performance
        if any(word in question for word in ['ranking', 'melhor', 'top', 'performance', 'vendedor']):
            return 'ranking'
        
        # Conversão
        if any(word in question for word in ['conversão', 'taxa', 'percentual']):
            return 'conversion'
        
        # Funil/pipeline
        if any(word in question for word in ['funil', 'pipeline', 'etapa', 'stage']):
            return 'funnel'
        
        # Resumo geral
        return 'summary'
    
    def _detect_period(self, question: str) -> Optional[Dict[str, int]]:
        """Detecta período temporal na pergunta"""
        
        # Detectar mês
        month = None
        for month_name, month_num in self.months_pt.items():
            if month_name in question:
                month = month_num
                break
        
        # Detectar ano
        year_match = re.search(r'202[0-9]', question)
        year = int(year_match.group()) if year_match else 2025
        
        if month:
            return {'month': month, 'year': year}
        
        # Detectar outros períodos
        if 'trimestre' in question:
            # Lógica para trimestre
            pass
        
        if 'semestre' in question:
            # Lógica para semestre
            pass
            
        return None
    
    def _detect_status_filter(self, question: str) -> str:
        """Detecta filtro de status dos deals"""
        
        if any(word in question for word in ['fechado', 'vendido', 'ganho']):
            return 'closed'
        
        if any(word in question for word in ['perdido', 'perda']):
            return 'lost'
        
        if any(word in question for word in ['andamento', 'progresso', 'pipeline']):
            return 'in_progress'
        
        return 'all'
    
    def _detect_additional_filters(self, question: str) -> Dict[str, Any]:
        """Detecta filtros adicionais como vendedor, fonte, etc."""
        filters = {}
        
        # Detectar vendedor específico
        if 'vendedor' in question:
            # Extrair nome do vendedor se mencionado
            pass
        
        # Detectar fonte específica
        if 'fonte' in question or 'origem' in question:
            pass
        
        return filters
    
    def process_data(self, data: List[Dict], analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processa os dados baseado na análise da pergunta
        """
        try:
            # Converter para DataFrame para processamento eficiente
            df = pd.DataFrame(data)
            
            logger.info(f"Processando {len(df)} registros")
            
            # Aplicar filtros temporais
            if analysis['period']:
                df = self._filter_by_period(df, analysis['period'])
                logger.info(f"Após filtro temporal: {len(df)} registros")
            
            # Aplicar filtros de status
            if analysis['status_filter'] != 'all':
                df = self._filter_by_status(df, analysis['status_filter'])
                logger.info(f"Após filtro de status: {len(df)} registros")
            
            # Processar baseado no tipo de análise
            result = self._process_by_type(df, analysis['type'])
            
            return result
            
        except Exception as e:
            logger.error(f"Erro no processamento: {str(e)}")
            return {'error': str(e)}
    
    def _filter_by_period(self, df: pd.DataFrame, period: Dict[str, int]) -> pd.DataFrame:
        """Filtra dados por período"""
        
        # Converter coluna de data
        df['deal_created_at'] = pd.to_datetime(df['deal_created_at'], errors='coerce')
        
        if 'month' in period and 'year' in period:
            mask = (
                (df['deal_created_at'].dt.month == period['month']) &
                (df['deal_created_at'].dt.year == period['year'])
            )
            return df[mask]
        
        return df
    
    def _filter_by_status(self, df: pd.DataFrame, status: str) -> pd.DataFrame:
        """Filtra dados por status"""
        
        if status == 'closed':
            return df[df['win'] == True]
        elif status == 'lost':
            return df[(df['win'] == False) & (df['hold'] == False)]
        elif status == 'in_progress':
            return df[(df['win'] == False) & (df['hold'] == True)]
        
        return df
    
    def _process_by_type(self, df: pd.DataFrame, analysis_type: str) -> Dict[str, Any]:
        """Processa dados baseado no tipo de análise"""
        
        if analysis_type == 'sales':
            return self._process_sales(df)
        elif analysis_type == 'loss_reasons':
            return self._process_loss_reasons(df)
        elif analysis_type == 'ranking':
            return self._process_ranking(df)
        elif analysis_type == 'conversion':
            return self._process_conversion(df)
        elif analysis_type == 'funnel':
            return self._process_funnel(df)
        else:
            return self._process_summary(df)
    
    def _process_sales(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Processa análise de vendas"""
        
        closed_deals = df[df['win'] == True]
        
        total_value = closed_deals['deal_amount_total'].fillna(0).sum()
        closed_count = len(closed_deals)
        total_opportunities = len(df)
        avg_deal_size = total_value / closed_count if closed_count > 0 else 0
        
        return {
            'type': 'sales',
            'total_value': float(total_value),
            'closed_deals': closed_count,
            'total_opportunities': total_opportunities,
            'average_deal_size': float(avg_deal_size),
            'conversion_rate': (closed_count / total_opportunities * 100) if total_opportunities > 0 else 0
        }
    
    def _process_loss_reasons(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Processa análise de motivos de perda"""
        
        lost_deals = df[(df['win'] == False) & (df['hold'] == False)]
        
        # Contar motivos de perda
        reason_counts = lost_deals['deal_lost_reason_name'].fillna('Motivo não especificado').value_counts()
        
        # Filtrar motivos válidos
        valid_reasons = reason_counts[
            (reason_counts.index != 'Motivo não especificado') & 
            (reason_counts.index.notna()) & 
            (reason_counts.index != '') &
            (reason_counts.index != 'null')
        ]
        
        top_reasons = [
            {'reason': reason, 'count': int(count)} 
            for reason, count in valid_reasons.head(10).items()
        ]
        
        return {
            'type': 'loss_reasons',
            'total_lost': len(lost_deals),
            'top_reasons': top_reasons,
            'total_with_reason': len(valid_reasons)
        }
    
    def _process_ranking(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Processa ranking de vendedores"""
        
        # Agrupar por vendedor
        user_stats = df.groupby('user_name').agg({
            'deal_amount_total': lambda x: x[df.loc[x.index, 'win'] == True].fillna(0).sum(),
            'win': ['count', 'sum'],
            'rd_deal_id': 'count'
        }).round(2)
        
        user_stats.columns = ['total_value', 'total_deals', 'closed_deals', 'all_deals']
        user_stats['conversion_rate'] = (user_stats['closed_deals'] / user_stats['total_deals'] * 100).round(1)
        
        # Ordenar por valor total
        ranking = user_stats.sort_values('total_value', ascending=False).head(10)
        
        users = [
            {
                'user': user,
                'total_value': float(stats['total_value']),
                'closed_deals': int(stats['closed_deals']),
                'total_deals': int(stats['total_deals']),
                'conversion_rate': float(stats['conversion_rate'])
            }
            for user, stats in ranking.iterrows()
        ]
        
        return {
            'type': 'ranking',
            'users': users
        }
    
    def _process_conversion(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Processa análise de conversão"""
        
        total_deals = len(df)
        closed_deals = len(df[df['win'] == True])
        lost_deals = len(df[(df['win'] == False) & (df['hold'] == False)])
        in_progress = len(df[(df['win'] == False) & (df['hold'] == True)])
        
        conversion_rate = (closed_deals / total_deals * 100) if total_deals > 0 else 0
        loss_rate = (lost_deals / total_deals * 100) if total_deals > 0 else 0
        
        return {
            'type': 'conversion',
            'total_deals': total_deals,
            'closed_deals': closed_deals,
            'lost_deals': lost_deals,
            'in_progress_deals': in_progress,
            'conversion_rate': round(conversion_rate, 1),
            'loss_rate': round(loss_rate, 1)
        }
    
    def _process_funnel(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Processa análise de funil"""
        
        # Agrupar por estágio
        stage_stats = df.groupby('deal_stage_name').agg({
            'rd_deal_id': 'count',
            'deal_amount_total': 'sum',
            'win': 'sum'
        }).fillna(0)
        
        stage_stats.columns = ['total_deals', 'total_value', 'closed_deals']
        stage_stats['conversion_rate'] = (stage_stats['closed_deals'] / stage_stats['total_deals'] * 100).round(1)
        
        stages = [
            {
                'stage': stage,
                'total_deals': int(stats['total_deals']),
                'total_value': float(stats['total_value']),
                'closed_deals': int(stats['closed_deals']),
                'conversion_rate': float(stats['conversion_rate'])
            }
            for stage, stats in stage_stats.iterrows()
        ]
        
        return {
            'type': 'funnel',
            'stages': stages
        }
    
    def _process_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Processa resumo geral"""
        
        total_deals = len(df)
        closed_deals = len(df[df['win'] == True])
        lost_deals = len(df[(df['win'] == False) & (df['hold'] == False)])
        in_progress = len(df[(df['win'] == False) & (df['hold'] == True)])
        
        total_value = df[df['win'] == True]['deal_amount_total'].fillna(0).sum()
        conversion_rate = (closed_deals / total_deals * 100) if total_deals > 0 else 0
        
        return {
            'type': 'summary',
            'total_deals': total_deals,
            'closed_deals': closed_deals,
            'lost_deals': lost_deals,
            'in_progress_deals': in_progress,
            'total_value': float(total_value),
            'conversion_rate': round(conversion_rate, 1)
        }
    
    def generate_response(self, analysis: Dict[str, Any], result: Dict[str, Any]) -> str:
        """
        Gera resposta em linguagem natural baseada nos resultados
        """
        
        if 'error' in result:
            return f"Ops! Ocorreu um erro ao processar sua pergunta: {result['error']}"
        
        # Texto do período
        period_text = ""
        if analysis['period']:
            month_name = list(self.months_pt.keys())[analysis['period']['month'] - 1]
            period_text = f" em {month_name} de {analysis['period']['year']}"
        
        # Gerar resposta baseada no tipo
        if result['type'] == 'sales':
            return self._generate_sales_response(result, period_text)
        elif result['type'] == 'loss_reasons':
            return self._generate_loss_reasons_response(result, period_text)
        elif result['type'] == 'ranking':
            return self._generate_ranking_response(result, period_text)
        elif result['type'] == 'conversion':
            return self._generate_conversion_response(result, period_text)
        elif result['type'] == 'funnel':
            return self._generate_funnel_response(result, period_text)
        else:
            return self._generate_summary_response(result, period_text)
    
    def _generate_sales_response(self, result: Dict[str, Any], period_text: str) -> str:
        """Gera resposta para análise de vendas"""
        
        if result['closed_deals'] == 0:
            if result['total_opportunities'] > 0:
                return f"""📊 **Vendas{period_text}:**

💰 **Valor total vendido:** R$ 0,00
📈 **Total de oportunidades:** {result['total_opportunities']:,}
⚠️ **Nenhum deal fechado neste período**

💡 **Dica:** Existem {result['total_opportunities']} oportunidades em aberto que podem ser trabalhadas."""
            else:
                return f"Não foram encontradas vendas ou oportunidades{period_text}."
        
        return f"""📊 **Vendas{period_text}:**

💰 **Valor total vendido:** {self._format_currency(result['total_value'])}
✅ **Deals fechados:** {result['closed_deals']:,}
📈 **Total de oportunidades:** {result['total_opportunities']:,}
💵 **Ticket médio:** {self._format_currency(result['average_deal_size'])}
📊 **Taxa de conversão:** {result['conversion_rate']:.1f}%"""
    
    def _generate_loss_reasons_response(self, result: Dict[str, Any], period_text: str) -> str:
        """Gera resposta para motivos de perda"""
        
        if result['total_lost'] == 0:
            return f"Não foram encontrados deals perdidos{period_text}."
        
        reasons_list = "\n".join([
            f"{i+1}. **{reason['reason']}** ({reason['count']} deals)"
            for i, reason in enumerate(result['top_reasons'])
        ])
        
        return f"""📉 **Motivos de perda{period_text}:**

❌ **Total perdidos:** {result['total_lost']:,} deals

**Top motivos:**
{reasons_list}"""
    
    def _generate_ranking_response(self, result: Dict[str, Any], period_text: str) -> str:
        """Gera resposta para ranking"""
        
        users_list = "\n".join([
            f"{i+1}. **{user['user']}** - {self._format_currency(user['total_value'])} "
            f"({user['closed_deals']}/{user['total_deals']} deals - {user['conversion_rate']:.1f}%)"
            for i, user in enumerate(result['users'])
        ])
        
        return f"""🏆 **Ranking de vendedores{period_text}:**

{users_list}"""
    
    def _generate_conversion_response(self, result: Dict[str, Any], period_text: str) -> str:
        """Gera resposta para análise de conversão"""
        
        return f"""📈 **Análise de Conversão{period_text}:**

📊 **Total de deals:** {result['total_deals']:,}
✅ **Taxa de conversão:** {result['conversion_rate']}%
❌ **Taxa de perda:** {result['loss_rate']}%
⏳ **Em andamento:** {result['in_progress_deals']:,} deals"""
    
    def _generate_funnel_response(self, result: Dict[str, Any], period_text: str) -> str:
        """Gera resposta para análise de funil"""
        
        stages_list = "\n".join([
            f"**{stage['stage']}:** {stage['total_deals']} deals "
            f"({self._format_currency(stage['total_value'])}) - {stage['conversion_rate']}%"
            for stage in result['stages']
        ])
        
        return f"""🔄 **Funil de Vendas{period_text}:**

{stages_list}"""
    
    def _generate_summary_response(self, result: Dict[str, Any], period_text: str) -> str:
        """Gera resposta para resumo geral"""
        
        return f"""📋 **Resumo{period_text}:**

📊 **Total de deals:** {result['total_deals']:,}
✅ **Fechados:** {result['closed_deals']:,}
❌ **Perdidos:** {result['lost_deals']:,}
⏳ **Em andamento:** {result['in_progress_deals']:,}
💰 **Valor total:** {self._format_currency(result['total_value'])}
📈 **Taxa de conversão:** {result['conversion_rate']}%"""
    
    def _format_currency(self, value: float) -> str:
        """Formata valor como moeda brasileira"""
        return f"R$ {value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

# Função principal para ser chamada pela Edge Function
def process_nalk_ai_request(question: str, data: List[Dict]) -> Dict[str, Any]:
    """
    Função principal para processar requisições da Nalk AI
    """
    try:
        processor = NalkAIProcessor()
        
        # Analisar pergunta
        analysis = processor.analyze_question(question)
        logger.info(f"Análise da pergunta: {analysis}")
        
        # Processar dados
        result = processor.process_data(data, analysis)
        logger.info(f"Resultado do processamento: {result}")
        
        # Gerar resposta
        response = processor.generate_response(analysis, result)
        
        return {
            'success': True,
            'answer': response,
            'analysis': analysis,
            'result': result
        }
        
    except Exception as e:
        logger.error(f"Erro no processamento: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'answer': 'Ops! Ocorreu um erro ao processar sua pergunta. Tente novamente.'
        }

if __name__ == "__main__":
    # Teste local
    test_data = [
        {
            'deal_created_at': '2025-06-15',
            'deal_amount_total': 1000,
            'win': True,
            'hold': False,
            'user_name': 'João Silva',
            'deal_lost_reason_name': None
        }
    ]
    
    result = process_nalk_ai_request("Qual o valor vendido em junho de 2025?", test_data)
    print(json.dumps(result, indent=2, ensure_ascii=False))
