export default async function handler(req, res) {

try {

const TOKEN = process.env.TELEGRAM_BOT_TOKEN

const message = "🔥 А вы уже стояли на гвоздях сегодня? Добавили для вас практику медитации, с сюрпризом, попробуйте! 🙏"

const response = await fetch(
`${process.env.VITE_SUPABASE_URL}/rest/v1/sessions?select=telegram_id`,
{
headers: {
apikey: process.env.VITE_SUPABASE_ANON_KEY,
Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
}
}
)

const data = await response.json()

const ids = [...new Set(data.map(u => u.telegram_id))]

for (const id of ids) {

await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
chat_id: id,
text: message
})
})

}

res.status(200).json({ sent: ids.length })

} catch (error) {

res.status(500).json({ error: error.message })

}

}
