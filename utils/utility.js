"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTime = exports.sendTelegramMessage = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
function sendTelegramMessage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const params = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
        };
        try {
            const response = yield fetch(url, {
                method: "POST",
                body: JSON.stringify(params),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error(`Telegram API responded with status ${response.status}`);
            }
            const responseData = yield response.json();
            return responseData;
        }
        catch (err) {
            console.error("Error sending Telegram message:", err);
            throw err;
        }
    });
}
exports.sendTelegramMessage = sendTelegramMessage;
// Function to format the current time to UTC+1
function formatTime(date) {
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
exports.formatTime = formatTime;
