export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { key, list } = req.body;

    try {
        const createRes = await fetch('https://api.manus.ai/v2/task.create', {
            method: 'POST',
            headers: { 
                'x-manus-api-key': key.trim(), 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: { content: `Organize estes endereços na melhor ordem de entrega para economizar tempo e combustível: \n\n${list}` }
            })
        });

        const createData = await createRes.json();
        
        // Se o Manus retornar erro, repassamos a mensagem real para o usuário
        if (!createData.ok) {
            return res.status(200).json({ 
                success: false, 
                error: `Erro do Manus: ${createData.error?.message || 'Verifique sua API Key e créditos.'}` 
            });
        }

        const taskId = createData.data.task_id;

        // Esperar o processamento
        await new Promise(r => setTimeout(r, 12000));

        const listRes = await fetch(`https://api.manus.ai/v2/task.listMessages?task_id=${taskId}`, {
            headers: { 'x-manus-api-key': key.trim() }
        });
        const listData = await listRes.json();

        if (listData.ok) {
            const messages = listData.data.messages;
            const assistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
            
            if (assistantMsg) {
                return res.status(200).json({ success: true, result: assistantMsg.content });
            }
        }

        res.status(200).json({ success: true, result: "O Manus ainda está calculando. Por favor, clique no botão novamente em 10 segundos para ver o resultado final." });

    } catch (error) {
        res.status(500).json({ success: false, error: "Erro interno no servidor: " + error.message });
    }
}
