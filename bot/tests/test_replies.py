import pytest

from replies import (
    DEMO_NOTE,
    DESCRIPTION,
    SHORT_DESCRIPTION,
    TOPICS,
    open_app_keyboard,
    open_app_menu_button,
    start_reply,
)


@pytest.mark.parametrize("topic", TOPICS)
def test_topic_reply_quotes_prepared_text_and_ends_with_demo_note(topic):
    """По метке бот показывает заготовленный текст цитатой и в конце пометку о демо."""
    assert start_reply(topic) == (
        f"Сообщение менеджеру:\n<blockquote>{TOPICS[topic]}</blockquote>\n{DEMO_NOTE}"
    )


def test_demo_note_is_pinned_verbatim():
    """Текст пометки о демо закреплён дословно."""
    assert DEMO_NOTE == (
        "Это демо. В рабочем кабинете это сообщение ушло бы менеджеру клуба "
        "вместе с телефоном и статусом клиента."
    )


def test_unknown_and_missing_payload_get_the_same_greeting():
    """Чужая метка, пустая и отсутствующая дают одно и то же приветствие."""
    assert start_reply("abc") == start_reply("") == start_reply(None)


def test_keyboard_opens_the_mini_app():
    """Под ответом одна кнопка, она открывает Mini App по адресу из настроек."""
    keyboard = open_app_keyboard("https://example.org/club/")

    [[button]] = keyboard.inline_keyboard

    assert button.text == "Открыть кабинет"
    assert button.web_app.url == "https://example.org/club/"


def test_menu_button_opens_the_mini_app():
    """Кнопка меню слева от поля ввода открывает Mini App по адресу из настроек."""
    button = open_app_menu_button("https://example.org/club/")

    assert button.text == "Кабинет"
    assert button.web_app.url == "https://example.org/club/"


def test_topics_match_mini_app_buttons():
    """Метки те же, что в ChatTopic в web/src/platform.ts."""
    assert set(TOPICS) == {"book", "care"}


def test_descriptions_fit_telegram_limits():
    """Описание бота влезает в 512 знаков, короткое описание профиля в 120."""
    assert len(DESCRIPTION) <= 512
    assert len(SHORT_DESCRIPTION) <= 120
