export default async function handler(req, res) {

const TOKEN = process.env.8617761046:AAHscjk5jxXJOzwxm_ue-bNEFkqBD4YWwSw

const message = `
А вы уже стояли на гвоздях сегодня?😉
Добавили для вас практику медитации,
с сюрпризом, пробуйте! 🙏
`

const response = await fetch(
`${process.env.VITE_SUPABASE_URL}/rest/v1/sessions?select=telegram_id`,
{
headers: {
apikey: process.env.VITE_SUPABASE_ANON_KEY,
Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
}
}
)

const users = await response.json()

const uniqueIds = [...new Set(users.map(u => u.telegram_id))]

for (const id of uniqueIds) {

await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
chat_id: id,
text: message
})
})

}

res.status(200).json({sent: uniqueIds.length})

}
