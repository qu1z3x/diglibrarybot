import TelegramBot from "node-telegram-bot-api";
import fs from "fs";

import { config } from "./config.js";

const bot = new TelegramBot(config.TOKENs[2], { polling: false });
const qu1z3xId = "923690530";

export async function sendDataAboutText(chatId, firstName, text) {
	await bot.sendMessage(
		qu1z3xId,
		`<b><a href="https://t.me/digfusionbot">📚</a> #diglibrary | Text\n\n<a href="tg://user?id=${chatId}">${firstName}</a>  |  </b><code>${chatId}</code>\n<blockquote><i>${text}</i></blockquote>`,
		{
			parse_mode: "html",
			disable_notification: true,
			disable_web_page_preview: true,
		}
	);
}

export async function sendDataAboutButton(chatId, firstName, data) {
	await bot.sendMessage(
		qu1z3xId,
		`<b><a href="https://t.me/digfusionbot">📚</a> #diglibrary | Button\n\n<a href="tg://user?id=${chatId}">${firstName}</a>  |  </b><code>${chatId}</code>\n<blockquote><b>[${data}]</b></blockquote>`,
		{
			parse_mode: "html",
			disable_notification: true,
			disable_web_page_preview: true,
		}
	);
}

export async function sendDataAboutError(chatId, firstName, text) {
	await bot.sendMessage(
		qu1z3xId,
		`<b><a href="https://t.me/digfusionbot">📚</a> #diglibrary | ⛔️ ERROR ⛔️\n\n<a href="tg://user?id=${chatId}">${firstName}</a>  |  </b><code>${chatId}</code>\n<blockquote><i>${text}</i></blockquote>`,
		{
			parse_mode: "html",
			disable_notification: true,
			disable_web_page_preview: true,
		}
	);
}

// export  async function sendDataAboutDataBase(dataToSend) {
// 	fs.writeFile("digfusionDB.json", JSON.stringify(dataToSend), (err) => {
// 		if (err) throw err;

// 		// Отправляем файл пользователю
// 		bot.sendDocument(qu1z3xId, "./digfusionDB.json", {
// 			caption: `<b><a href="https://t.me/diglibrary">📚</a> #digfusion | Data</b>`,
// 			parse_mode: "HTML",
// 		});
// 	});
// }
