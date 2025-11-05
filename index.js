import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY não está configurada!");
  console.error("Por favor, adicione sua chave API do OpenAI nas variáveis de ambiente.");
}

const openai = new OpenAI({
  apiKey: apiKey
});

// Store conversation history (in-memory for now)
const conversations = new Map();

// Página inicial (visível no navegador)
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🤖 Grana Money IA</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #0d1117;
            color: #fff;
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .header {
            background: #161b22;
            padding: 20px;
            border-bottom: 1px solid #30363d;
            text-align: center;
          }
          h1 { 
            color: #00ff88;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .subtitle {
            color: #8b949e;
            font-size: 14px;
          }
          .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 12px;
            line-height: 1.5;
          }
          .user-message {
            align-self: flex-end;
            background: #00ff88;
            color: #0d1117;
            border-radius: 12px 12px 0 12px;
          }
          .ai-message {
            align-self: flex-start;
            background: #161b22;
            color: #fff;
            border: 1px solid #30363d;
            border-radius: 12px 12px 12px 0;
            white-space: pre-wrap;
          }
          .typing {
            align-self: flex-start;
            padding: 12px 16px;
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            display: none;
          }
          .typing.active {
            display: block;
          }
          .typing span {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            margin: 0 2px;
            animation: bounce 1.4s infinite;
          }
          .typing span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .typing span:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
          }
          .input-container {
            background: #161b22;
            border-top: 1px solid #30363d;
            padding: 20px;
          }
          .input-wrapper {
            display: flex;
            gap: 10px;
            max-width: 800px;
            margin: 0 auto;
          }
          textarea {
            flex: 1;
            min-height: 50px;
            max-height: 120px;
            padding: 12px 16px;
            border-radius: 10px;
            border: 2px solid #30363d;
            background: #0d1117;
            color: #fff;
            font-size: 16px;
            font-family: inherit;
            resize: none;
            transition: border-color 0.2s;
          }
          textarea:focus {
            outline: none;
            border-color: #00ff88;
          }
          textarea::placeholder {
            color: #6e7681;
          }
          button {
            background: #00ff88;
            color: #0d1117;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            align-self: flex-end;
          }
          button:hover {
            background: #00dd77;
            transform: translateY(-1px);
          }
          button:active {
            transform: translateY(0);
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .welcome {
            text-align: center;
            color: #8b949e;
            margin-top: 40px;
          }
          .welcome-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💬 Grana Money IA</h1>
          <p class="subtitle">Sua assistente financeira inteligente powered by OpenAI</p>
        </div>

        <div class="chat-container" id="chatContainer">
          <div class="welcome">
            <div class="welcome-icon">💰</div>
            <p>Olá! Sou a Grana Money IA, sua assistente financeira pessoal.</p>
            <p>Pergunte sobre orçamento, investimentos, economia ou qualquer dúvida financeira!</p>
          </div>
        </div>

        <div class="typing" id="typing">
          <span></span><span></span><span></span>
        </div>

        <div class="input-container">
          <div class="input-wrapper">
            <textarea 
              id="msg" 
              placeholder="Digite sua pergunta sobre finanças..."
              rows="1"
            ></textarea>
            <button onclick="enviar()" id="sendBtn">Enviar</button>
          </div>
        </div>

        <script>
          const sessionId = Date.now().toString();
          const chatContainer = document.getElementById('chatContainer');
          const msgInput = document.getElementById('msg');
          const sendBtn = document.getElementById('sendBtn');
          const typing = document.getElementById('typing');

          // Auto-resize textarea
          msgInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
          });

          // Send on Enter (but allow Shift+Enter for new line)
          msgInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          });

          async function enviar() {
            const msg = msgInput.value.trim();
            if (!msg) return;

            // Disable input while sending
            sendBtn.disabled = true;
            msgInput.disabled = true;

            // Add user message to chat
            addMessage(msg, 'user');
            msgInput.value = '';
            msgInput.style.height = 'auto';

            // Show typing indicator
            typing.classList.add('active');
            chatContainer.appendChild(typing);
            scrollToBottom();

            try {
              const res = await fetch("/chat", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                  message: msg,
                  sessionId: sessionId
                })
              });

              const data = await res.json();
              
              // Hide typing indicator
              typing.classList.remove('active');
              
              // Add AI response
              addMessage(data.resposta, 'ai');
            } catch (error) {
              typing.classList.remove('active');
              addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'ai');
              console.error('Error:', error);
            } finally {
              sendBtn.disabled = false;
              msgInput.disabled = false;
              msgInput.focus();
            }
          }

          function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (type === 'user' ? 'user-message' : 'ai-message');
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            scrollToBottom();
          }

          function scrollToBottom() {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        </script>
      </body>
    </html>
  `);
});

// Lógica da IA com OpenAI
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userMessage = message || "";

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ 
        resposta: "Sessão inválida. Por favor, recarregue a página." 
      });
    }

    if (!userMessage.trim()) {
      return res.json({ resposta: "Por favor, faça uma pergunta." });
    }

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, [
        {
          role: "system",
          content: `Você é a Grana Money IA, uma assistente financeira pessoal amigável e experiente.

Sua função é ajudar pessoas com:
- Planejamento de orçamento pessoal
- Dicas de economia e poupança
- Orientações sobre investimentos básicos (conservadores)
- Educação financeira
- Controle de gastos
- Metas financeiras

Diretrizes:
- Seja sempre amigável, clara e motivadora
- Use exemplos práticos do dia a dia brasileiro
- Evite jargões técnicos complexos
- Dê respostas concisas mas completas
- Use emojis ocasionalmente para tornar as respostas mais amigáveis
- Nunca recomende investimentos específicos ou prometa retornos
- Sempre incentive a educação financeira e decisões informadas
- Responda em português brasileiro`
        }
      ]);
    }

    const conversationHistory = conversations.get(sessionId);
    
    // Add user message to history
    conversationHistory.push({
      role: "user",
      content: userMessage
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 500
    });

    // Validate OpenAI response
    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      throw new Error("Invalid response from OpenAI");
    }

    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse || aiResponse.trim() === "") {
      throw new Error("Empty response from OpenAI");
    }

    // Add AI response to history
    conversationHistory.push({
      role: "assistant",
      content: aiResponse
    });

    // Keep only last 10 messages (plus system message) to manage memory
    if (conversationHistory.length > 21) {
      conversationHistory.splice(1, conversationHistory.length - 21);
    }

    res.json({ resposta: aiResponse });

  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    res.status(500).json({ 
      resposta: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes." 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Grana Money IA" });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Grana Money IA rodando na porta ${PORT}`);
  console.log(`🤖 OpenAI API configurada e pronta!`);
});
