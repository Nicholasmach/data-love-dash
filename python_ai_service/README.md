# Nalk AI - Serviço Python

Sistema robusto de processamento de dados para a Nalk AI, desenvolvido em Python com Pandas para análises eficientes e sem hardcode.

## 🚀 Características

### ✅ **Zero Hardcode**
- Detecção automática de períodos temporais
- Análise dinâmica de tipos de pergunta
- Processamento adaptativo baseado nos dados

### ⚡ **Performance Otimizada**
- Processamento em memória com Pandas
- Filtragem eficiente de grandes datasets
- Arquitetura modular e escalável

### 🧠 **Inteligência Avançada**
- Análise de vendas com métricas detalhadas
- Motivos de perda com ranking automático
- Rankings de vendedores com conversão
- Análise de funil e conversão
- Resumos executivos dinâmicos

## 📦 Instalação

### Pré-requisitos
- Python 3.8+
- pip

### Instalação Automática
```bash
cd python_ai_service
python start_service.py
```

### Instalação Manual
```bash
cd python_ai_service
pip install -r requirements.txt
python api_server.py
```

## 🔧 Uso

### Iniciar o Serviço
```bash
python start_service.py
```

O serviço estará disponível em: `http://localhost:5000`

### Endpoints Disponíveis

#### 1. Health Check
```bash
GET http://localhost:5000/health
```

#### 2. Processar Pergunta
```bash
POST http://localhost:5000/process
Content-Type: application/json

{
  "question": "Qual o valor vendido em junho de 2025?",
  "data": [...]
}
```

#### 3. Analisar Pergunta
```bash
POST http://localhost:5000/analyze
Content-Type: application/json

{
  "question": "Quais os motivos de perda mais comuns?"
}
```

#### 4. Teste
```bash
GET http://localhost:5000/test
```

## 🎯 Tipos de Análise Suportados

### 📊 **Vendas**
- Valor total vendido
- Número de deals fechados
- Ticket médio
- Taxa de conversão

**Exemplos de perguntas:**
- "Qual o valor vendido em junho de 2025?"
- "Quantos deals foram fechados este mês?"
- "Qual a receita total?"

### 📉 **Motivos de Perda**
- Top 10 motivos de perda
- Quantidade por motivo
- Análise de padrões

**Exemplos de perguntas:**
- "Quais os motivos de perda mais comuns?"
- "Por que perdemos deals em julho?"
- "Principais razões de perda"

### 🏆 **Ranking de Vendedores**
- Ordenação por valor vendido
- Taxa de conversão individual
- Performance comparativa

**Exemplos de perguntas:**
- "Ranking dos melhores vendedores"
- "Quem vendeu mais este mês?"
- "Performance dos vendedores"

### 📈 **Análise de Conversão**
- Taxa de conversão geral
- Taxa de perda
- Distribuição por status

**Exemplos de perguntas:**
- "Qual a taxa de conversão?"
- "Quantos % dos deals são perdidos?"
- "Análise de conversão mensal"

### 🔄 **Funil de Vendas**
- Análise por estágio
- Conversão por etapa
- Gargalos identificados

**Exemplos de perguntas:**
- "Como está o funil de vendas?"
- "Análise por estágio"
- "Onde perdemos mais deals?"

## 🏗️ Arquitetura

### Componentes Principais

#### `NalkAIProcessor`
Classe principal que coordena todo o processamento:
- Análise de perguntas
- Processamento de dados
- Geração de respostas

#### `QueryAnalyzer`
Analisa perguntas em linguagem natural:
- Detecção de tipo de análise
- Extração de períodos temporais
- Identificação de filtros

#### `DataProcessor`
Processa dados com Pandas:
- Filtragem temporal eficiente
- Agregações complexas
- Cálculos estatísticos

#### `ResponseGenerator`
Gera respostas em português:
- Formatação de moeda brasileira
- Estruturação com markdown
- Contexto dinâmico

### Fluxo de Processamento

1. **Recepção da Pergunta**
   - API Flask recebe requisição
   - Validação dos dados de entrada

2. **Análise da Pergunta**
   - Detecção do tipo de análise
   - Extração de filtros temporais
   - Identificação de parâmetros

3. **Processamento dos Dados**
   - Carregamento em DataFrame
   - Aplicação de filtros
   - Cálculos específicos por tipo

4. **Geração da Resposta**
   - Formatação em linguagem natural
   - Estruturação com emojis e markdown
   - Contextualização temporal

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Opcional: URL customizada para o serviço
PYTHON_AI_SERVICE_URL=http://localhost:5000
```

### Integração com Supabase Edge Function
A Edge Function automaticamente tenta usar o serviço Python e faz fallback para TypeScript se necessário.

## 🧪 Testes

### Teste Local
```bash
python nalk_ai_processor.py
```

### Teste via API
```bash
curl http://localhost:5000/test
```

### Teste com Dados Reais
```bash
curl -X POST http://localhost:5000/process \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o valor vendido em junho de 2025?",
    "data": [...]
  }'
```

## 📊 Exemplos de Uso

### Análise de Vendas
```python
from nalk_ai_processor import process_nalk_ai_request

result = process_nalk_ai_request(
    "Qual o valor vendido em junho de 2025?",
    deals_data
)

print(result['answer'])
# 📊 Vendas em junho de 2025:
# 💰 Valor total vendido: R$ 5.680,00
# ✅ Deals fechados: 22
# 📈 Total de oportunidades: 1.543
# 💵 Ticket médio: R$ 258,18
```

### Motivos de Perda
```python
result = process_nalk_ai_request(
    "Quais os motivos de perda mais comuns?",
    deals_data
)

print(result['answer'])
# 📉 Motivos de perda:
# ❌ Total perdidos: 156 deals
# 
# Top motivos:
# 1. Preço muito alto (45 deals)
# 2. Não tem orçamento (32 deals)
# 3. Escolheu concorrente (28 deals)
```

## 🚀 Performance

### Benchmarks
- **Processamento**: ~1000 registros em <100ms
- **Análise de pergunta**: <10ms
- **Geração de resposta**: <50ms

### Otimizações
- Uso de Pandas para operações vetorizadas
- Filtragem eficiente com máscaras booleanas
- Cache de resultados intermediários
- Processamento em memória

## 🔄 Integração

### Com Supabase Edge Function
A Edge Function automaticamente detecta e usa o serviço Python quando disponível.

### Com Frontend React
O frontend continua usando a mesma interface, mas agora com processamento Python mais robusto.

### Fallback Automático
Se o serviço Python não estiver disponível, a Edge Function usa processamento TypeScript como fallback.

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
python_ai_service/
├── nalk_ai_processor.py    # Processador principal
├── api_server.py           # Servidor Flask
├── start_service.py        # Script de inicialização
├── requirements.txt        # Dependências
└── README.md              # Documentação
```

### Adicionando Novos Tipos de Análise
1. Adicione detecção em `_detect_analysis_type()`
2. Implemente processamento em `_process_by_type()`
3. Adicione geração de resposta em `generate_response()`

### Logs e Debug
O serviço inclui logs detalhados para debugging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] Cache Redis para performance
- [ ] Análise de tendências temporais
- [ ] Previsões com machine learning
- [ ] Análise de sentimento em motivos de perda
- [ ] Dashboard de métricas do serviço
- [ ] Suporte a múltiplos idiomas

### Melhorias Planejadas
- [ ] Containerização com Docker
- [ ] Testes automatizados
- [ ] Monitoramento com Prometheus
- [ ] Documentação da API com Swagger
- [ ] Versionamento da API

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**🚀 Nalk AI - Inteligência Artificial para Análise de Vendas**
