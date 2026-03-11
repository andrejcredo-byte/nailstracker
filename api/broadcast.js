export default async function handler(req, res) {
  // Используем стандартный процесс для серверных функций Vercel
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // Эти можно оставить с VITE, если они не секретные
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    // 1. Проверка авторизации (опционально, для безопасности)
    // Если хочешь, чтобы рассылку нельзя было запустить просто перейдя по ссылке, 
    // добавь в URL параметр ?pwd=твой_пароль
    // if (req.query.pwd !== 'твой_секретный_код') return res.status(403).json({ error: "Access denied" });

    if (!TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN не найден. Проверь настройки Environment Variables в Vercel и сделай Redeploy.");
    }

    const message = "🔥 А вы уже стояли на гвоздях сегодня? Добавили для вас практику медитации, с сюрпризом, попробуйте! 🙏";

    // 2. Получаем список ID из базы Supabase
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/sessions?select=telegram_id`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!dbResponse.ok) {
      throw new Error(`Ошибка базы данных: ${dbResponse.statusText}`);
    }

    const data = await dbResponse.json();
    
    // Фильтруем только уникальные и корректные ID
    const ids = [...new Set(data.map(u => u.telegram_id).filter(id => id && !isNaN(id)))];

    const results = {
      total_found: ids.length,
      sent: 0,
      errors: []
    };

    // 3. Цикл рассылки
    for (const id of ids) {
      try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: id,
            text: message,
            parse_mode: "HTML"
          })
        });

        const tgData = await tgResponse.json();

        if (tgData.ok) {
          results.sent++;
        } else {
          results.errors.push({ chat_id: id, reason: tgData.description });
        }
      } catch (e) {
        results.errors.push({ chat_id: id, reason: e.message });
      }

      // Небольшая задержка, чтобы не спамить API Telegram слишком быстро
      await new Promise(r => setTimeout(r, 50));
    }

    // Возвращаем детальный отчет
    res.status(200).json(results);

  } catch (error) {
    console.error("Broadcast failed:", error.message);
    res.status(500).json({ error: error.message });
  }
}
