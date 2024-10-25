import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";

import fs from "fs"; // для работы с TXT
// import { PDFDocument } from 'pdf-lib'; // Для работы с PDF
import Epub from "epub"; // Для работы с EPUB
import fb2 from "node-fb2"; // Для работы с FB2

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
		description: "Помощь❔",
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

let textToSayHello, match;

async function firstMeeting(chatId, numOfStage = 1) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		dataAboutUser.userAction = `firstMeeting${numOfStage}`;

		switch (numOfStage) {
			case 1:
				await bot
					.sendMessage(chatId, "ㅤ")
					.then(
						(message) =>
							(dataAboutUser.messageId = message.message_id)
					);

				await bot.editMessageText(
					`<b>${dataAboutUser.login}, привет! 👋</b>\n\nСмотри, <b>все предельно просто!</b>\n<blockquote>Как надумаешь почитать, пиши мне <b>название произведения,</b> я выдам <b>результат!</b></blockquote>\n\n<b>Если заблудишься, пиши /help </b>😉`,
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

		dataAboutUser.foundBooks = null;

		let dataAboutBook = dataAboutUser.currentBookId
			? dataAboutUser.myLibrary.find(
					(obj) => obj.bookId == dataAboutUser.currentBookId
			  )
			: null;

		const dateNowHHNN =
			new Date().getHours() * 100 + new Date().getMinutes();
		if (dateNowHHNN < 1200 && dateNowHHNN >= 600)
			textToSayHello = "Доброе утро";
		else if (dateNowHHNN < 1700 && dateNowHHNN >= 1200)
			textToSayHello = "Добрый день";
		else if (dateNowHHNN < 2200 && dateNowHHNN >= 1700)
			textToSayHello = "Добрый вечер";
		else if (dateNowHHNN >= 2200 || dateNowHHNN < 600)
			textToSayHello = "Доброй ночи";

		await bot.editMessageText(
			`<b>${textToSayHello}, ${dataAboutUser.login}! 👋</b>\n<blockquote><b>Напоминаю,</b> захочешь расслабиться, пришли мне название любого произведения!</blockquote>\n<b>Что тебя интересует? 🤔</b>`,
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
								text: `Поиск книг 🔎`,
								callback_data: `search`,
							},
						],
						[
							{
								text: dataAboutBook
									? `${truncateString(
											dataAboutBook.title,
											20
									  )} ( ${dataAboutBook.currentPage} / ${
											dataAboutBook.pages.length
									  } ) ➡️`
									: ``,
								callback_data: dataAboutBook
									? `readBookWithId${dataAboutBook.bookId}`
									: `-`,
							},
						],
						[
							{
								text: `Чарты 🔥`,
								callback_data: `soon`,
							},
							{
								text: `Мои книги 📚`,
								callback_data: `soon`,
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

async function textCropping(text, charsPerPage = 200) {
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

function truncateString(text, maxLength) {
	if (text && text.length > maxLength) {
		return text.substring(0, maxLength - 3) + "..";
	}
	return text;
}

async function search(chatId, dataAboutBook = null, query = null) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		if (query) {
			dataAboutUser.userAction = `search1`;

			if (!dataAboutUser.foundBooks) {
				await bot.editMessageText(
					`<b>Ищу книги по запросу <i>"${query}"</i> 🔎</b>`,
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
										text: `Прекратить поиск ✖️`,
										callback_data: "exit",
									},
								],
							],
						},
					}
				);

				dataAboutUser.foundBooks =
					dataAboutUser.foundBooks && query == `;8|digfusion|5*`
						? dataAboutUser.foundBooks
						: await searchBooks(query, dataAboutUser);
			}

			// setTimeout(
			// () => {
			if (dataAboutUser.userAction == "search1") {
				if (dataAboutUser.foundBooks) {
					let buttons = [];
					for (let i = 0; i < dataAboutUser.foundBooks.length; i++) {
						buttons.push([
							{
								text: `${truncateString(
									dataAboutUser.foundBooks[i].title,
									20
								)}`,
								callback_data: `moreAboutBookWithId${dataAboutUser.foundBooks[i].bookId}`,
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
						`<b>Вот что я нашел по запросу <i>"${query}"</i></b> 😉\n\n<a href="https://t.me/digfusionsupport">Сообщить о проблеме</a>`,
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
			// },}
			// 	dataAboutUser.foundBooks ? 0 : 2000
			// );
		} else if (dataAboutBook) {
			dataAboutUser.userAction = `search2`;

			await bot.editMessageText(
				`<b>📕 <i>"${dataAboutBook.title}"</i> - ${
					dataAboutBook.author
				}</b>\n\nДата: <b>${
					dataAboutBook.date
				}</b>\nЖанр: <b>Антиутопия</b>\n<blockquote><b>Отрывок произведения:</b>\n<i>${truncateString(
					dataAboutBook.text,
					100
				)}</i></blockquote>\n\n<b>${
					dataAboutBook.currentPage > 1
						? `Продолжить читать эту книгу? 😃`
						: `Будем читать вместе? 😃`
				}</b>`,
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
									text:
										dataAboutBook.currentPage > 1
											? `Продолжить ( на ${dataAboutBook.currentPage}стр ) ✅`
											: `Начать читать ✅`,
									callback_data: `readBookWithId${dataAboutBook.bookId}`,
								},
							],
							[
								{ text: `Скачать 📁`, callback_data: `soon` },
								{
									text: ` ${
										dataAboutUser.myLibrary.find(
											(obj) =>
												obj.bookId ==
												dataAboutBook.bookId
										)
											? `Из моих книг ✖️`
											: `В мои книги 📌`
									}`,
									callback_data: `soon`,
								},
							],
							[
								{
									text: `⬅️Назад`,
									callback_data: dataAboutUser.foundBooks
										? `search1`
										: `myLibrary`,
								},
							],
						],
					},
				}
			);
		} else {
			let text = "";
			let lastSearchedRequests = dataAboutUser.statistics.searchHistory
				? dataAboutUser.statistics.searchHistory.slice(-3)
				: null;

			lastSearchedRequests.forEach((obj) => {
				text += `\n<i><a href="https://t.me/${BotName}/?start=searchBy${
					obj.request
				}">- ${truncateString(obj.request, 17)}</a></i>`;
			});

			await bot.editMessageText(
				`<b>Отлично,</b> давай поищем для тебя поэму, роман, пове.. <b>Да все что угодно! 🔎</b>\n${
					text
						? `<blockquote><b>Искать еще раз:</b>${text}</blockquote>`
						: `\n`
				}<b>Просто напиши мне название!</b> 😉`,
				{
					parse_mode: "html",
					chat_id: chatId,
					message_id: usersData.find((obj) => obj.chatId == chatId)
						.messageId,
					disable_web_page_preview: true,
					reply_markup: {
						inline_keyboard: [
							[
								{ text: `⬅️Назад`, callback_data: `exit` },
								{ text: `Чарты 🔥`, callback_data: `soon` },
							],
						],
					},
				}
			);
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function reader(chatId, dataAboutBook = null, showSettings = false) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		dataAboutUser.userAction = "reader";

		let buttons = null;

		if (showSettings)
			buttons = [
				[
					{
						text: `Размер текста: ${
							dataAboutUser.settings.charsPerPage
						} ${
							(dataAboutUser.settings.charsPerPage >= 5 &&
								dataAboutUser.settings.charsPerPage <= 20) ||
							(dataAboutUser.settings.charsPerPage % 10 >= 5 &&
								dataAboutUser.settings.charsPerPage % 10 <=
									9) ||
							dataAboutUser.settings.charsPerPage % 10 == 0
								? "букв"
								: `${
										dataAboutUser.settings.charsPerPage %
											10 ==
										1
											? "буква"
											: `${
													dataAboutUser.settings
														.charsPerPage %
														10 >=
														2 &&
													dataAboutUser.settings
														.charsPerPage %
														10 <=
														4
														? "буквы"
														: ``
											  }`
								  }`
						}`,
						callback_data: `-`,
					},
				],
				[
					{
						text:
							dataAboutUser.settings.charsPerPage > 100
								? `➖`
								: `🚫`,
						callback_data:
							dataAboutUser.settings.charsPerPage > 100
								? "cutCharsOnPage"
								: `-`,
					},
					{
						text: "Aa",
						callback_data: `-`,
					},
					{
						text:
							dataAboutUser.settings.charsPerPage < 800
								? `➕`
								: `🚫`,
						callback_data:
							dataAboutUser.settings.charsPerPage < 800
								? "addCharsOnPage"
								: `-`,
					},
				],
				[
					{
						text: "⬅️Назад и применить",
						callback_data: `readBookWithId${dataAboutBook.bookId}`,
					},
				],
			];
		else {
			buttons = [
				[
					{
						text: dataAboutBook.currentPage == 1 ? `🚫` : `↩️`,
						callback_data:
							dataAboutBook.currentPage == 1
								? `-`
								: "previousPage",
					},
					{
						text: `${dataAboutBook.currentPage} из ${dataAboutBook.pages.length}`,
						callback_data: "-",
					},
					{
						text:
							dataAboutBook.currentPage ==
							dataAboutBook.pages.length
								? `🚫`
								: `↪️`,
						callback_data:
							dataAboutBook.currentPage ==
							dataAboutBook.pages.length
								? `-`
								: "nextPage",
					},
				],
				[
					{
						text: "⬅️Назад",
						callback_data: dataAboutUser.foundBooks
							? `moreAboutBookWithId${dataAboutUser.currentBookId}`
							: `myLibrary`,
					},
					{
						text: "Прочее⚙️",
						callback_data: "readerSettings",
					},
				],
			];
		}

		if (dataAboutBook) {
			let pagesLeft =
				dataAboutBook.pages.length - dataAboutBook.currentPage;

			await bot.editMessageText(
				`<b><i>"${dataAboutBook.title}"</i> - ${
					dataAboutBook.author
				}</b><blockquote>${
					dataAboutBook.pages[dataAboutBook.currentPage - 1]
				}</blockquote>\n<i>${
					pagesLeft == 0
						? `Осталась <b>последняя страница</b>`
						: `До конца <b>${pagesLeft} ${
								(pagesLeft >= 5 && pagesLeft <= 20) ||
								(pagesLeft % 10 >= 5 && pagesLeft % 10 <= 9) ||
								pagesLeft % 10 == 0
									? "страниц"
									: `${
											pagesLeft % 10 == 1
												? "страница"
												: `${
														pagesLeft % 10 >= 2 &&
														pagesLeft % 10 <= 4
															? "страницы"
															: ``
												  }`
									  }`
						  }</b>`
				}</i>`,
				{
					parse_mode: "html",
					chat_id: chatId,
					message_id: usersData.find((obj) => obj.chatId == chatId)
						.messageId,
					disable_web_page_preview: true,
					reply_markup: {
						inline_keyboard: buttons,
					},
				}
			);
		} else {
			await bot.editMessageText(
				`<b>Походу, я потерял информацию об этой книге.. 😢\n\nПовтори поиск или проверь ее в своих книгах! 😉</b>`,
				{
					parse_mode: "html",
					chat_id: chatId,
					message_id: usersData.find((obj) => obj.chatId == chatId)
						.messageId,
					disable_web_page_preview: true,
					reply_markup: {
						inline_keyboard: [[{ text: ``, callback_data: `-` }]],
					},
				}
			);
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function myLibrary(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		dataAboutUser.userAction = "myLibrary";

		let text = "";

		await bot.editMessageText(
			`<b><i>📚 Мои книги${
				dataAboutUser.myLibrary
					? ` • ${dataAboutUser.myLibrary.length}шт`
					: ``
			} 📌</i></b>`,
			{
				parse_mode: "html",
				chat_id: chatId,
				message_id: usersData.find((obj) => obj.chatId == chatId)
					.messageId,
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: [
						[{ text: `⬅️Назад`, callback_data: `exit` }],
					],
				},
			}
		);
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function calculateReadingLevel(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		return dataAboutUser.statistics.finishedBooksCount <= 1
			? "Начинающий 🙂"
			: dataAboutUser.statistics.finishedBooksCount <= 3
			? "Книголюб 📚"
			: dataAboutUser.statistics.finishedBooksCount <= 6
			? "Читак 🧠"
			: dataAboutUser.statistics.finishedBooksCount <= 10
			? "Книгоед 🍽️"
			: dataAboutUser.statistics.finishedBooksCount <= 20
			? "Книгозавр 🦖"
			: dataAboutUser.statistics.finishedBooksCount <= 50
			? "Гуру страниц 👑"
			: "Сам как книга 🤯";
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function settings(
	chatId,
	editLogin = false,
	afterEdit = false,
	readingLevelScale = false
) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		if (!editLogin && !readingLevelScale) {
			dataAboutUser.userAction = "settings";

			await bot.editMessageText(
				`<b><i>👤 Профиль • <code>${
					dataAboutUser.chatId
				}</code> ⚙️</i>\n\nДанные:\n</b>Логин: <b>${
					dataAboutUser.login
				}</b> - <a href="https://t.me/${BotName}/?start=editLogin">изменить</a>\nРанг: <b>${await calculateReadingLevel(
					chatId
				)} - <a href="https://t.me/${BotName}/?start=moreAboutReadingLevel">подробнее</a>\n\nСтатистика:</b>\nЛюбимый жанр: <b>${"Антиутопия"}</b>\nПрочитано: <b>${
					dataAboutUser.finishedBooksCount
				}</b> ${
					dataAboutUser.settings.booksGoal
						? `<b>${
								(dataAboutUser.finishedBooksCount >= 5 &&
									dataAboutUser.finishedBooksCount <= 20) ||
								(dataAboutUser.finishedBooksCount % 10 >= 5 &&
									dataAboutUser.finishedBooksCount % 10 <=
										9) ||
								dataAboutUser.finishedBooksCount % 10 == 0
									? "книг"
									: `${
											dataAboutUser.finishedBooksCount %
												10 ==
											1
												? "книга"
												: `${
														dataAboutUser.finishedBooksCount %
															10 >=
															2 &&
														dataAboutUser.finishedBooksCount %
															10 <=
															4
															? "книги"
															: ``
												  }`
									  }`
						  }</b> - <a href="https://t.me/${BotName}/?start=soon">задать цель</a>`
						: ``
				}\n\n<b>Параметры:</b>\nСтраница вмещает: <b>${
					dataAboutUser.settings.charsPerPage
				} ${
					(dataAboutUser.settings.charsPerPage >= 5 &&
						dataAboutUser.settings.charsPerPage <= 20) ||
					(dataAboutUser.settings.charsPerPage % 10 >= 5 &&
						dataAboutUser.settings.charsPerPage % 10 <= 9) ||
					dataAboutUser.settings.charsPerPage % 10 == 0
						? "букв"
						: `${
								dataAboutUser.settings.charsPerPage % 10 == 1
									? "букву"
									: `${
											dataAboutUser.settings
												.charsPerPage %
												10 >=
												2 &&
											dataAboutUser.settings
												.charsPerPage %
												10 <=
												4
												? "буквы"
												: ``
									  }`
						  }`
				}</b>`,
				{
					parse_mode: "html",
					chat_id: chatId,
					message_id: usersData.find((obj) => obj.chatId == chatId)
						.messageId,
					disable_web_page_preview: true,
					reply_markup: {
						inline_keyboard: [
							[
								{ text: `⬅️Назад`, callback_data: `exit` },
								{
									text: "digfusion❔",
									callback_data: "digfusionInfo",
								},
							],
						],
					},
				}
			);
		} else if (editLogin) {
			dataAboutUser.userAction = "editLogin";

			await bot.editMessageText(
				`<i><b>🛠️ Изменение логина ⚙️\n\n</b>Логин используется для идентификации пользователя! 🔒</i><b>\n\n${
					afterEdit
						? `Изменённый: <code>${dataAboutUser.supportiveCount}</code>`
						: `Текущий: <code>${dataAboutUser.login}</code>`
				}${
					afterEdit
						? "\n\nПрименить изменения для логина? 🤔"
						: "\n\nНапишите, как можно к вам обращаться ✍️"
				}</b>`,
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
									text: `${
										dataAboutUser.login !=
										dataAboutUser.telegramFirstName
											? "Сбросить❌"
											: ""
									}`,
									callback_data: "resetLogin",
								},
							],
							[
								{
									text: `⬅️Назад`,
									callback_data: "settings",
								},
								{
									text: `${afterEdit ? "Принять✅" : ""}`,
									callback_data: "editLogin",
								},
							],
						],
					},
				}
			);
		} else if (readingLevelScale) {
			dataAboutUser.userAction = "readingLevelScale";

			await bot.editMessageText(
				`<b><i>🤓 Читательский ранг 🎖️</i>\n\nУ меня существует собственная шкала оценивания твоей начитанности!\n\nОна выглядит так:</b><blockquote></blockquote>\n\nТекущий ранг: <b>${await calculateReadingLevel(
					chatId
				)}</b>`,
				{
					parse_mode: "html",
					chat_id: chatId,
					message_id: usersData.find((obj) => obj.chatId == chatId)
						.messageId,
					disable_web_page_preview: true,
					reply_markup: {
						inline_keyboard: [
							[{ text: `⬅️Назад`, callback_data: `settings` }],
						],
					},
				}
			);
		}
	} catch (error) {
		console.log(error);
		sendDataAboutError(chatId, dataAboutUser.login, `${String(error)}`);
	}
}

async function digfusionInfo(chatId) {
	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	try {
		await bot.editMessageText(
			`<b><i>❔digfusion • О нас 💁🏻‍♂️</i></b>\n\n<i>Это приложение разработано <b>digfusion</b> с душой 🤍</i>\n\n<b><i>digfusion</i></b> - <b>начинающий стартап,</b> разрабатывающий <b>свои приложения</b> и предоставляющий услуги по <b>созданию чат-ботов</b> различных типов! ☑️\n\nПросмотреть все <b>наши проекты, реальные отзывы, каталог услуг</b> и <b>прочую информацию о компании</b> можно в нашем <b>Telegram канале</b> и <b>боте-консультанте! 🤗\n\n<a href="https://t.me/digfusion">digfusion | инфо</a> • <a href="https://t.me/digfusionbot">digfusion | услуги</a></b>`,
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
								text: "Наш Telegram канал 📣",
								url: "https://t.me/digfusion",
							},
						],
						[
							{ text: "⬅️Назад", callback_data: "settings" },
							{
								text: "Поддержка 💭",
								url: "https://t.me/digfusionsupport",
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

async function StartAll() {
	if (TOKEN == config.TOKENs[0]) {
		BotName = "digtestingbot";
	} else if (TOKEN == config.TOKENs[1]) {
		BotName = "diglibrarybot";
	}

	// Поддерживаемые форматы документов
	const supportedTypes = [
		"text/plain",
		"application/pdf",
		"application/epub+zip",
		"application/x-fictionbook+xml",
	];

	// Основной обработчик сообщений
	// bot.on("message", async (message) => {
	// 	const chatId = message.chat.id;

	// 	const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

	// 	if (message.document) {
	// 		const fileId = message.document.file_id;
	// 		const mimeType = message.document.mime_type;

	// 		console.log(mimeType);

	// 		// Проверка, поддерживается ли формат файла
	// 		if (supportedTypes.includes(mimeType)) {
	// 			// Скачиваем файл

	// 			const filePath = await bot.downloadFile(fileId, "./downloads");
	// 			console.log("Скачанный файл находится по пути:", filePath);

	// 			let title = null,
	// 				author = null,
	// 				text = null;

	// 			// Обработка текстового файла
	// 			if (mimeType == "text/plain") {
	// 				text = fs.readFileSync(filePath, "utf8");

	// 				// Обработка PDF файла
	// 			} else if (mimeType == "application/pdf") {
	// 				// Обработка EPUB файла
	// 			} else if (mimeType == "application/epub+zip") {
	// 				const epub = new Epub(filePath);
	// 				epub.on("end", function () {
	// 					epub.getChapter("1", (err, fileText) => {
	// 						if (!err) {
	// 							text = fileText;
	// 							title = epub.metadata.title || null;
	// 							author = epub.metadata.creator || null;
	// 						}
	// 					});
	// 				});
	// 				epub.parse();

	// 				// Обработка FB2 файла
	// 			} else if (mimeType == "application/x-fictionbook+xml") {
	// 				const fb2Data = fs.readFileSync(filePath, "utf8");
	// 				const parsed = fb2.parse(fb2Data);

	// 				// Извлечение метаданных
	// 				text = parsed.body;
	// 				title = parsed.description.title || null;
	// 				author = parsed.description.author
	// 					? `${parsed.description.author.firstName} ${parsed.description.author.lastName}`
	// 					: null;
	// 			}

	// 			dataAboutUser.supportveCount.push({
	// 				title: title,
	// 				author: author,
	// 				date: null,
	// 				text: text,
	// 				bookId: 88460,
	// 				pages: null,
	// 				currentPage: 1,
	// 			});

	// 			search(chatId, dataAboutUser.supportveCount);
	// 		} else {
	// 			console.log("Этот файл нельзя преобразовать в текст.");
	// 		}
	// 	}
	// });

	bot.on("text", async (message) => {
		const chatId = message.chat.id;
		const text = message.text;

		const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

		try {
			if (!usersData.find((obj) => obj.chatId == chatId)) {
				usersData.push({
					chatId: chatId,
					login: message.from.first_name,
					messageId: null,
					userAction: null,
					supportveCount: null,

					currentBookId: null,

					myLibrary: [], // моя медиатека (добавленные в "мои книги", начатые или прочитанные книги)
					foundBooks: [], // книги найденные в поиске

					settings: {
						charsPerPage: 300,
						booksCountGoal: null,
						notifications: true,
					},
					statistics: {
						searchHistory: [],
						finishedBooksCount: 0,
					},
				});
			}

			const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

			if (
				Array.from(text)[0] != "/" &&
				dataAboutUser.userAction != "editLogin"
			) {
				dataAboutUser.foundBooks = null;

				dataAboutUser.statistics.searchHistory.push({
					request: text,
					date: new Date(),
				});

				await search(chatId, null, text);
			}

			if (text.includes("/start searchBy")) {
				match = text.match(/^\/start searchBy(.*)$/);

				await search(chatId, null, match[1]);
			}

			if (dataAboutUser) {
				switch (text) {
					case "/restart":
						if (chatId == qu1z3xId || chatId == jackId) {
							await bot
								.sendMessage(chatId, "ㅤ")
								.then(
									(message) =>
										(dataAboutUser.messageId =
											message.message_id)
								);

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
									(dataAboutUser.messageId =
										message.message_id)
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
						settings(chatId);
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

	bot.on("callback_query", async (query) => {
		const chatId = query.message.chat.id;
		const data = query.data;
		const dataAboutUser = usersData.find((obj) => obj.chatId == chatId);

		try {
			if (dataAboutUser) {
				if (data.includes("readBookWithId")) {
					match = data.match(/^readBookWithId(.*)$/);

					let dataAboutBook = dataAboutUser.foundBooks
						? dataAboutUser.foundBooks.find(
								(obj) => obj.bookId == match[1]
						  )
						: dataAboutUser.myLibrary.find(
								(obj) => obj.bookId == match[1]
						  );

					dataAboutBook.pages = await textCropping(
						dataAboutBook.text,
						dataAboutUser.settings.charsPerPage
					);

					dataAboutUser.myLibrary.push(dataAboutBook);

					dataAboutUser.currentBookId = match[1];

					reader(chatId, dataAboutBook);
				}

				if (data.includes("moreAboutBookWithId")) {
					match = data.match(/^moreAboutBookWithId(.*)$/);

					search(
						chatId,
						dataAboutUser.foundBooks.find(
							(obj) => obj.bookId == match[1]
						)
					);
				}

				if (
					data.includes("previousPage") ||
					data.includes("nextPage") ||
					data.includes("firstPage")
				) {
					match = data.match(/^(.*)Page$/);

					if (match[1] == "next") {
						if (dataAboutUser.userAction == "reader") {
							let dataAboutBook = dataAboutUser.myLibrary.find(
								(obj) =>
									obj.bookId == dataAboutUser.currentBookId
							);

							if (
								dataAboutBook.currentPage !=
								dataAboutBook.pages.length
							)
								++dataAboutBook.currentPage;

							reader(chatId, dataAboutBook);
						}
					} else if (match[1] == "previous") {
						if (dataAboutUser.userAction == "reader") {
							let dataAboutBook = dataAboutUser.myLibrary.find(
								(obj) =>
									obj.bookId == dataAboutUser.currentBookId
							);

							if (dataAboutBook.currentPage > 1)
								--dataAboutBook.currentPage;

							reader(chatId, dataAboutBook);
						}
					} else if (match[1] == "first") {
					}
				}

				if (data.includes("CharsOnPage")) {
					match = data.match(/^(.*)CharsOnPage$/);

					let dataAboutBook = dataAboutUser.myLibrary.find(
						(obj) => obj.bookId == dataAboutUser.currentBookId
					);

					if (
						match[1] == "add" &&
						dataAboutUser.settings.charsPerPage < 800
					) {
						dataAboutUser.settings.charsPerPage += 100;
					}

					if (
						match[1] == "cut" &&
						dataAboutUser.settings.charsPerPage > 100
					) {
						dataAboutUser.settings.charsPerPage -= 100;
					}

					dataAboutBook.pages = await textCropping(
						dataAboutBook.text,
						dataAboutUser.settings.charsPerPage
					);

					reader(chatId, dataAboutBook, true);
				}

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
					case "search":
						search(chatId);
						break;
					case "search1":
						search(chatId, null, ";8|digfusion|5*");
						break;
					case "readerSettings":
						reader(
							chatId,
							dataAboutUser.myLibrary.find(
								(obj) =>
									obj.bookId == dataAboutUser.currentBookId
							),
							true
						);
						break;
					case "myLibrary":
						myLibrary(chatId);
						break;
					case "":
						break;
					case "":
						break;
					case "":
						break;
					case "settings":
						settings(chatId);
						break;
					case "resetLogin":
						dataAboutUser.login = dataAboutUser.telegramFirstName;

						bot.answerCallbackQuery(query.id, {
							text: `Ваш логин снова \n«${dataAboutUser.login}» 😉`,
							show_alert: true,
						});

						settings(chatId);
						break;
					case "editLogin":
						dataAboutUser.login = dataAboutUser.supportiveCount;

						bot.answerCallbackQuery(query.id, {
							text: `Ваш логин изменен на\n«${dataAboutUser.supportiveCount}» 😉`,
							show_alert: true,
						});

						settings(chatId);
						break;
					case "digfusionInfo":
						digfusionInfo(chatId);
						break;
					case "soon":
						bot.editMessageText(
							`<b>Помощник пока в раннем доступе.. 🫤</b>\n\n<i>Я ценю твоё сильное желание увидеть этот раздел!</i>\n\n<b>Но он еще просто не готов.. ☹️</b>`,
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
												text: "⬅️В меню",
												callback_data: "exit",
											},
										],
									],
								},
							}
						);
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
