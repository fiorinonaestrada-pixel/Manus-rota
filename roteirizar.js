export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { key, list } = req.body;

    try {
        // 1. Criar a tarefa no Manus
        const createRes = await fetch('https://api.manus.ai/v2/task.create', {
            method: 'POST',
            headers: { 
                'x-manus-api-key': key, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: { content: `Organize estes endereços na melhor ordem de entrega para economizar tempo e combustível: \n\n${list}` }
            })
        });

        const createData = await createRes.json();
        if (!createData.ok) throw new Error(createData.error.message);

        const taskId = createData.data.task_id;

        // 2. Esperar um pouco para a IA processar
        await new Promise(r => setTimeout(r, 15000));

        // 3. Pegar o resultado
        const listRes = await fetch(`https://api.manus.ai/v2/task.listMessages?task_id=${taskId}`, {
            headers: { 'x-manus-api-key': key }
        });
        const listData = await listRes.json();

        if (listData.ok) {
            const messages = listData.data.messages;
            const assistantMsg = messages.reverse().find(m => m.role === 'assistant');
            
            if (assistantMsg) {
                return res.status(200).json({ success: true, result: assistantMsg.content });
            }
        }

        res.status(200).json({ success: true, result: "A rota está sendo calculada. Por favor, tente clicar novamente em 10 segundos para ver o resultado final." });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
