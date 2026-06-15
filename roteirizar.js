const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { key, list } = req.body;

    try {
        // 1. Criar a tarefa no Manus
        const createRes = await axios.post('https://api.manus.ai/v2/task.create', {
            message: { content: `Organize estes endereços na melhor ordem de entrega: \n\n${list}` }
        }, {
            headers: { 'x-manus-api-key': key, 'Content-Type': 'application/json' }
        });

        const taskId = createRes.data.data.task_id;

        // 2. Polling simples para pegar o resultado (espera até 20 segundos)
        let resultText = "O Manus está processando... por favor, verifique sua conta Manus para o resultado final ou tente novamente em instantes.";
        
        // Tentamos 4 vezes com intervalo de 5 segundos
        for (let i = 0; i < 4; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const listRes = await axios.get(`https://api.manus.ai/v2/task.listMessages?task_id=${taskId}`, {
                headers: { 'x-manus-api-key': key }
            });

            const messages = listRes.data.data.messages;
            const assistantMsg = messages.reverse().find(m => m.role === 'assistant');
            
            if (assistantMsg) {
                resultText = assistantMsg.content;
                break;
            }
        }

        res.status(200).json({ success: true, result: resultText });

    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || error.message });
    }
}
