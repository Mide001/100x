import { config } from "dotenv";
config();

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;


export async function sendTelegramMessage(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const params = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Telegram API responded with status ${response.status}`);
    }

    const responseData = await response.json();
  } catch (err) {
    console.error("Error sending Telegram message:", err);
    throw err;
  }
}

// Function to format the current time to UTC+1
export function formatTime(date: Date): string {
  let utcHours = date.getUTCHours() + 1; // UTC+1
  if (utcHours >= 24) {
    utcHours -= 24; 
  }

  const minutes = date.getUTCMinutes();
  const ampm = utcHours >= 12 ? "PM" : "AM";

  let hours = utcHours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'

  const formattedHours = hours.toString().padStart(2, "0"); // Ensure two digits
  const formattedMinutes = minutes.toString().padStart(2, "0"); // Ensure two digits

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
