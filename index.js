import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";

import { sendDataAboutButton } from "./tgterminal.js";
import { sendDataAboutError } from "./tgterminal.js";
import { sendDataAboutText } from "./tgterminal.js";

import { searchBooks } from "./search.js";

import { config } from "./config.js";

const TOKEN = config.TOKENs[0]; // 1 - оригинал
const bot = new TelegramBot(TOKEN, { polling: true });

// digfusion

const qu1z3xId = "923690530";
const jackId = "6815420098";
let BotName = "diglibrarybot";

let usersData = [];

bot.setMyCommands([
	{
		command: "/menu",
		description: "Главное меню 📚",
	},
	{
		command: "/help",
		description: "Это если потерялся❔",
	},
	{
		command: "/settings",
		description: "Настройки и профиль ⚙️",
	},
	{
		command: "/restart",
		description: "Перезапуск 🔄️",
	},
]);

let textToSayHello;

async function firstMeeting(chatId, numOfStage = 1) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		dataAboutUser.userAction = `firstMeeting${numOfStage}`;

		switch (numOfStage) {
			case 1:
				await bot
					.sendMessage(chatId, "ㅤ")
					.then(
						(message) => (dataAboutUser.messageId = message.message_id)
					);

				await bot.editMessageText(
					`<b>${dataAboutUser.login}, привет! 👋</b>\n\nЯ Смотри, <b>все предельно просто!</b>\n<blockquote>Как надумаешь почитать, пиши мне <b>название произведения,</b> я выдам <b>результат!</b></blockquote>\n\n<b>Если заблудишься, пиши /help </b>😉`,
					{
						parse_mode: "html",
						chat_id: chatId,
						message_id: usersData.find((obj) => obj.chatId == chatId)
							.messageId,
						disable_web_page_preview: true,
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "",
										callback_data: "-",
									},
								],
							],
						},
					}
				);
				break;
			case 2:
				break;
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function menuHome(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		dataAboutUser.userAction = "menuHome";

		const dateNowHHNN = new Date().getHours() * 100 + new Date().getMinutes();
		if (dateNowHHNN < 1200 && dateNowHHNN >= 600)
			textToSayHello = "Доброго утра";
		else if (dateNowHHNN < 1700 && dateNowHHNN >= 1200)
			textToSayHello = "Доброго дня";
		else if (dateNowHHNN < 2200 && dateNowHHNN >= 1700)
			textToSayHello = "Доброго вечера";
		else if (dateNowHHNN >= 2200 || dateNowHHNN < 600)
			textToSayHello = "Доброй ночи";

		await bot.editMessageText(
			`<b>${textToSayHello}, ${dataAboutUser.login}! 👋</b>\n\n<blockquote><b>Напоминаю,</b> захочешь расслабиться, пришли мне название любого произведения!</blockquote>\n<b>Что тебя интересует? 🤔</b>`,
			{
				parse_mode: "html",
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId).messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: `Поиск книг 🔎`,
								callback_data: `search0`,
							},
						],
						[
							{
								text: `Чарты 🔥`,
								callback_data: `-`,
							},
							{
								text: `Твои книги 📚`,
								callback_data: `-`,
							},
						],
						[
							{
								text: `Настройки и профиль ⚙️`,
								callback_data: `settings`,
							},
						],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

function textCropping(text, charsPerPage = 200) {
	try {
		const words = text.match(/\S+\s*/g); // Разбиваем текст на слова, включая пробелы и знаки препинания
		const pages = [];
		let currentPage = "";
		let currentLength = 0;

		for (let i = 0; i < words.length; i++) {
			const word = words[i];

			// Если добавление следующего слова превысит лимит символов, создаем новую страницу
			if (currentLength + word.length > charsPerPage) {
				pages.push(currentPage.trim()); // Сохраняем текущую страницу
				currentPage = ""; // Очищаем текущую страницу
				currentLength = 0; // Сбрасываем счётчик символов
			}

			currentPage += word; // Добавляем слово на текущую страницу
			currentLength += word.length; // Увеличиваем счётчик символов
		}

		// Добавляем последнюю страницу, если остался текст
		if (currentPage.length > 0) {
			pages.push(currentPage.trim());
		}

		return pages;
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function search(chatId, stageNum = 1, query = null) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		if (query) stageNum = 1;

		dataAboutUser.userAction = `search${stageNum}`;

		switch (stageNum) {
			case 0:
				break;
			case 1:
				await bot.editMessageText(
					`<b>Поиск книг по запросу <i>"${query}"</i> 🤔</b>`,
					{
						parse_mode: "html",
						chat_id: chatId,
						message_id: usersData.find((obj) => obj.chatId == chatId)
							.messageId,
						disable_web_page_preview: true,
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: `Прекратить поиск ✖️`,
										callback_data: "exit",
									},
								],
							],
						},
					}
				);

				let books = await searchBooks(query);

				setTimeout(() => {
					if (dataAboutUser.userAction == "search1") {
						if (books && books.length) {
							let buttons = [];
							for (let i = 0; i < books.length; i++) {
								buttons.push([
									{
										text: `${books[i].title}`,
										callback_data: `readBookWithId${books[i].id}`,
									},
								]);
							}
							buttons.push([
								{
									text: `⬅️Назад`,
									callback_data: `exit`,
								},
								{
									text: `Помощь❔`,
									callback_data: `help`,
								},
							]);

							bot.editMessageText(
								`<b>Результаты по запросу <i>"${query}"</i></b> 😉\n\n<a href="https://t.me/digfusionsupport">Сообщить о проблеме</a>`,
								{
									parse_mode: "html",
									chat_id: chatId,
									message_id: usersData.find(
										(obj) => obj.chatId == chatId
									).messageId,
									disable_web_page_preview: true,
									reply_markup: {
										inline_keyboard: buttons,
									},
								}
							);
						} else {
							bot.editMessageText(
								`<b>К сожалению, я не смог найти нужное тебе произведение по запросу <i>"${query}"</i> 😔</b>\n\n<blockquote><b>Совет:</b> попробуй написать более конкретный запрос, используй имя автора.</blockquote>`,
								{
									parse_mode: "html",
									chat_id: chatId,
									message_id: usersData.find(
										(obj) => obj.chatId == chatId
									).messageId,
									disable_web_page_preview: true,
									reply_markup: {
										inline_keyboard: [
											[
												{
													text: `⬅️В меню`,
													callback_data: "exit",
												},
											],
										],
									},
								}
							);
						}
					}
				}, 1000);

				break;
			case 2:
				textCropping(text, 200);
				break;
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function reader(chatId, stageNum = 1, bookData = null) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		switch (stageNum) {
			case 1:
				if (bookData) {
					await bot.editMessageText(
						`<b><i>"${bookData.title}"</i></b><blockquote>${bookData}</blockquote>\n`,
						{
							parse_mode: "html",
							chat_id: chatId,
							message_id: usersData.find((obj) => obj.chatId == chatId)
								.messageId,
							disable_web_page_preview: true,
							reply_markup: {
								inline_keyboard: [
									[
										{ text: `↩️`, callback_data: "-" },
										{ text: `${0} из ${10}`, callback_data: "-" },
										{ text: `↪️`, callback_data: "-" },
									],
									[
										{ text: "⬅️Назад", callback_data: "exit" },
										{ text: "Параметры ⚙️", callback_data: "-" },
									],
								],
							},
						}
					);
				}
				break;
			case 2:
				break;
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function StartAll() {
	if (TOKEN == config.TOKENs[0]) {
		BotName = "digtestingbot";
	} else if (TOKEN == config.TOKENs[1]) {
		BotName = "diglibrarybot";
	}

	bot.on("message", async (message) => {
		const chatId = message.chat.id;
		const text = message.text;

		try {
			if (!usersData.find((obj) => obj.chatId === chatId)) {
				usersData.push({
					chatId: chatId,
					login: message.from.first_name,
					messageId: null,
					userAction: null,
					supportveCount: null,
				});
			}

			const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

			if (Array.from(text)[0] != "/") {
				await search(chatId, null, text);
			}

			if (dataAboutUser) {
				switch (text) {
					case "/restart":
						if (chatId == qu1z3xId || chatId == jackId) {
							menuHome(chatId);
							break;
						}
					case "/start":
						firstMeeting(chatId);
						break;
					case "/menu":
						try {
							bot.deleteMessage(chatId, dataAboutUser.messageId);
						} catch (error) {}

						await bot
							.sendMessage(chatId, "ㅤ")
							.then(
								(message) =>
									(dataAboutUser.messageId = message.message_id)
							);

						menuHome(chatId);
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "/help":
						// helpList(chatId)
						break;
					case "/settings":
						// settings(chatId)
						break;
					case "":
						break;
				}
			}
			bot.deleteMessage(chatId, message.message_id);
			if (chatId != jackId && chatId != qu1z3xId) {
				sendDataAboutText(
					dataAboutUser.login,
					message.from.username,
					chatId,
					text
				);
			}
		} catch (error) {
			console.log(error);
			sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
		}
	});

	bot.on("callback_query", (query) => {
		const chatId = query.message.chat.id;
		const data = query.data;
		const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

		try {
			if (dataAboutUser) {
				switch (data) {
					case "exit":
						menuHome(chatId);
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "deleteexcess":
						try {
							bot.deleteMessage(chatId, query.message.message_id);
						} catch (error) {}
						break;
				}
			}
			if (chatId != qu1z3xId && chatId != jackId) {
				sendDataAboutButton(
					dataAboutUser.login,
					query.from.username,
					chatId,
					data
				);
			}
		} catch (error) {
			console.log(error);
			sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
		}
	});
}

StartAll();

// digfusion
