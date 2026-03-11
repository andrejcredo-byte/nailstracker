export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    // Проверка, что токен вообще дошел до функции
    if (!TOKEN) {
      throw new Error("Токен бота не найден в переменных окружения");
    }

    const message = "🔥 А вы уже стояли на гвоздях сегодня? Добавили для вас практику медитации, с сюрпризом, попробуйте! 🙏";

    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/sessions?select=telegram_id`,
      {
        headers: {
          apikey: process.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        }
      }
    );

    const data = await response.json();

    // Фильтруем пустые значения на всякий случай
    const ids = [...new Set(data.map(u => u.telegram_id).filter(Boolean))];

    let successCount = 0;
    let errors = [];

    for (const id of ids) {
      const tgResponse = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: message
        })
      });

      // Читаем, что ответил Telegram
      const tgData = await tgResponse.json();

      if (tgData.ok) {
        successCount++;
      } else {
        // Записываем причину, почему Telegram не отправил сообщение
        errors.push({ chat_id: id, reason: tgData.description });
      }
    }

    // Теперь в ответе будет полная картина
    res.status(200).json({ 
      total_found: ids.length, 
      sent_successfully: successCount,
      failed: errors
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
