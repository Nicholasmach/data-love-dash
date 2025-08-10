from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from nalk_ai_processor import process_nalk_ai_request

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criar app Flask
app = Flask(__name__)
CORS(app)  # Permitir CORS para todas as rotas

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Nalk AI Processor'})

@app.route('/process', methods=['POST'])
def process_question():
    """
    Endpoint principal para processar perguntas da Nalk AI
    """
    try:
        # Obter dados da requisição
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        question = data.get('question')
        deals_data = data.get('data', [])
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        logger.info(f"Processing question: {question}")
        logger.info(f"Data records: {len(deals_data)}")
        
        # Processar usando o processador Python
        result = process_nalk_ai_request(question, deals_data)
        
        logger.info(f"Processing result: {result.get('success', False)}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'answer': 'Ops! Ocorreu um erro interno. Tente novamente.'
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_question():
    """
    Endpoint para apenas analisar a pergunta (sem processar dados)
    """
    try:
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        from nalk_ai_processor import NalkAIProcessor
        processor = NalkAIProcessor()
        analysis = processor.analyze_question(question)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        logger.error(f"Error analyzing question: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test', methods=['GET'])
def test_processor():
    """
    Endpoint de teste com dados mock
    """
    try:
        # Dados de teste
        test_data = [
            {
                'deal_created_at': '2025-06-15T10:00:00Z',
                'deal_amount_total': 1500.00,
                'win': True,
                'hold': False,
                'user_name': 'João Silva',
                'deal_lost_reason_name': None,
                'deal_stage_name': 'Fechado',
                'rd_deal_id': 'test_001'
            },
            {
                'deal_created_at': '2025-06-20T14:30:00Z',
                'deal_amount_total': 2500.00,
                'win': True,
                'hold': False,
                'user_name': 'Maria Santos',
                'deal_lost_reason_name': None,
                'deal_stage_name': 'Fechado',
                'rd_deal_id': 'test_002'
            },
            {
                'deal_created_at': '2025-06-25T09:15:00Z',
                'deal_amount_total': 1200.00,
                'win': False,
                'hold': False,
                'user_name': 'Pedro Costa',
                'deal_lost_reason_name': 'Preço muito alto',
                'deal_stage_name': 'Perdido',
                'rd_deal_id': 'test_003'
            }
        ]
        
        # Testar pergunta
        test_question = "Qual o valor vendido em junho de 2025?"
        
        result = process_nalk_ai_request(test_question, test_data)
        
        return jsonify({
            'test_question': test_question,
            'test_data_count': len(test_data),
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Error in test: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Nalk AI Processor API Server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
