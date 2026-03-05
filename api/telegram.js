export default async function handler(req, res) {
  try {

    const update = req.body || {};

    if (!update.message) {
      return res.status(200).send("ok");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text === "/start") {

      const url = "https://api.telegram.org/bot" + process.env.8617761046:AAE3NTz6eGoSEe6E2SKte3fNFHq-bVKSMJ8 + "/sendMessage";

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Нажми кнопку «Вперёд!» и начни свою практику ⚡️"
        })
      });

    }

    res.status(200).send("ok");

  } catch (e) {
    console.error(e);
    res.status(200).send("error");
  }
}
