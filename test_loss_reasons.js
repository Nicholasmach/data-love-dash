// Teste para verificar motivos de perda

async function testLossReasons() {
    const testData = {
        question: "considerando todos os meses, liste os 5 maiores motivos de perdas",
        data: [
            {
                deal_created_at: "2025-07-01T10:00:00Z",
                deal_amount_total: 1000,
                win: false,
                hold: false,
                user_name: "Joao",
                deal_lost_reason_name: "Preco muito alto",
                rd_deal_id: "001"
            },
            {
                deal_created_at: "2025-07-02T10:00:00Z",
                deal_amount_total: 2000,
                win: false,
                hold: false,
                user_name: "Maria",
                deal_lost_reason_name: "Preco muito alto",
                rd_deal_id: "002"
            },
            {
                deal_created_at: "2025-08-03T10:00:00Z",
                deal_amount_total: 1500,
                win: false,
                hold: false,
                user_name: "Pedro",
                deal_lost_reason_name: "Escolheu concorrente",
                rd_deal_id: "003"
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:5000/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        console.log('Resultado:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Erro:', error);
    }
}

testLossReasons();
