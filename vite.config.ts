import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api-submit',
        configureServer(server) {
          server.middlewares.use('/api/submit', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Allow', 'POST');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';

            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              const token = env.TELEGRAM_BOT_TOKEN;
              const chatId = env.TELEGRAM_CHAT_ID;
              const topicIdRaw = env.TELEGRAM_TOPIC_ID;

              if (!token || !chatId) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Server misconfiguration: Missing env variables' }));
                return;
              }

              try {
                const parsed = body ? (JSON.parse(body) as Record<string, unknown>) : {};
                const { name, nim, category, message } = parsed;

                const sanitize = (str: string) => str.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

                const safeName = sanitize(typeof name === 'string' && name.trim() ? name : 'Anonim');
                const safeNim = sanitize(typeof nim === 'string' && nim.trim() ? nim : '-');
                const safeCategory = sanitize(typeof category === 'string' && category.trim() ? category : 'Umum');
                const safeMessage = sanitize(typeof message === 'string' && message.trim() ? message : '-');

                const text = [
                  '📢 *ADUAN BARU MASUK*',
                  '──────────────────',
                  `👤 *Nama:* ${safeName}`,
                  `🆔 *NIM:* ${safeNim}`,
                  `📂 *Kategori:* ${safeCategory}`,
                  '',
                  '📝 *Pesan:*',
                  safeMessage
                ].join('\n');

                const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

                const topicId = topicIdRaw ? Number(topicIdRaw) : undefined;
                const payload: Record<string, unknown> = {
                  chat_id: chatId,
                  text,
                  parse_mode: 'MarkdownV2'
                };

                if (typeof topicId === 'number' && Number.isInteger(topicId) && topicId !== 0) {
                  payload.message_thread_id = topicId;
                }

                const response = await fetch(telegramUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                  console.error('Telegram API Error:', data);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to send to Telegram' }));
                  return;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                console.error('Internal Server Error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
              }
            });
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GROQ_API_KEY),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
