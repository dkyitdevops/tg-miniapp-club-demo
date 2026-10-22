from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp, WebAppInfo

TOPICS = {
    "book": "Здравствуйте! Хочу записаться на процедуру.",
    "care": "Здравствуйте! У меня вопрос к отделу заботы.",
}

DEMO_NOTE = (
    "Это демо. В рабочем кабинете это сообщение ушло бы менеджеру клуба "
    "вместе с телефоном и статусом клиента."
)

DESCRIPTION = (
    "Демо-бот aiglue открывает демонстрационный кабинет клиента клуба красоты: "
    "статус, бонусные карты и запись через чат с менеджером. Данные тестовые."
)

SHORT_DESCRIPTION = "Демо Telegram Mini App: кабинет клиента клуба красоты на тестовых данных."


def start_reply(payload: str | None) -> str:
    topic_text = TOPICS.get(payload or "")
    if topic_text is None:
        return (
            "Здравствуйте! Это демо-бот aiglue. Кнопка ниже открывает демонстрационный "
            "кабинет клиента клуба красоты, данные в нём тестовые."
        )
    return f"Сообщение менеджеру:\n<blockquote>{topic_text}</blockquote>\n{DEMO_NOTE}"


def fallback_reply() -> str:
    return (
        "Это демо-бот, он понимает только сообщения из кабинета клуба. "
        "Кабинет открывается кнопкой ниже."
    )


def open_app_keyboard(webapp_url: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Открыть кабинет", web_app=WebAppInfo(url=webapp_url))]
        ]
    )


def open_app_menu_button(webapp_url: str) -> MenuButtonWebApp:
    return MenuButtonWebApp(text="Кабинет", web_app=WebAppInfo(url=webapp_url))
