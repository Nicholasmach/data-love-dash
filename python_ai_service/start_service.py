#!/usr/bin/env python3
"""
Script para inicializar o serviço Python da Nalk AI
"""

import subprocess
import sys
import os
import time

def install_requirements():
    """Instala as dependências do requirements.txt"""
    print("📦 Instalando dependências...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependências instaladas com sucesso!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        sys.exit(1)

def test_processor():
    """Testa o processador Python"""
    print("🧪 Testando processador...")
    try:
        from nalk_ai_processor import process_nalk_ai_request
        
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
            }
        ]
        
        result = process_nalk_ai_request("Qual o valor vendido em junho de 2025?", test_data)
        
        if result['success']:
            print("✅ Processador funcionando corretamente!")
            print(f"📊 Resposta: {result['answer'][:100]}...")
        else:
            print(f"❌ Erro no processador: {result['error']}")
            
    except Exception as e:
        print(f"❌ Erro ao testar processador: {e}")
        sys.exit(1)

def start_api_server():
    """Inicia o servidor da API"""
    print("🚀 Iniciando servidor da API...")
    print("📍 Servidor rodando em: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/health")
    print("🧪 Teste: http://localhost:5000/test")
    print("\n⚡ Pressione Ctrl+C para parar o servidor\n")
    
    try:
        from api_server import app
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\n👋 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)

def main():
    """Função principal"""
    print("🤖 Nalk AI - Serviço Python")
    print("=" * 40)
    
    # Verificar se estamos no diretório correto
    if not os.path.exists('requirements.txt'):
        print("❌ Arquivo requirements.txt não encontrado!")
        print("💡 Execute este script no diretório python_ai_service/")
        sys.exit(1)
    
    # Instalar dependências
    install_requirements()
    
    # Testar processador
    test_processor()
    
    # Iniciar servidor
    start_api_server()

if __name__ == "__main__":
    main()
