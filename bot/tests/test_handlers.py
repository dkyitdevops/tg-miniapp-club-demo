from conftest import feed

from replies import fallback_reply, open_app_keyboard, start_reply


async def test_start_book_shows_prepared_text_with_cabinet_button(dp, bot, answers, settings):
    """/start book: заготовленный текст менеджеру и кнопка в кабинет."""
    await feed(dp, bot, text="/start book")

    answers.assert_awaited_once_with(
        start_reply("book"), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def test_start_care_shows_care_text(dp, bot, answers, settings):
    """/start care: текст для отдела заботы."""
    await feed(dp, bot, text="/start care")

    answers.assert_awaited_once_with(
        start_reply("care"), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def test_plain_start_greets(dp, bot, answers, settings):
    """/start без метки: приветствие и кнопка в кабинет."""
    await feed(dp, bot, text="/start")

    answers.assert_awaited_once_with(
        start_reply(None), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def test_unknown_topic_greets_like_plain_start(dp, bot, answers, settings):
    """/start с чужой меткой отвечает так же, как /start без метки."""
    await feed(dp, bot, text="/start abc")

    answers.assert_awaited_once_with(
        start_reply(None), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def test_other_text_gets_fallback(dp, bot, answers, settings):
    """Любой другой текст в личке: ответ, что бот понимает только кабинет, и кнопка."""
    await feed(dp, bot, text="привет")

    answers.assert_awaited_once_with(
        fallback_reply(), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def test_sticker_gets_fallback(dp, bot, answers, settings):
    """Стикер в личке отвечается так же, как другой текст."""
    await feed(dp, bot, sticker=True)

    answers.assert_awaited_once_with(
        fallback_reply(), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def test_group_chat_is_ignored(dp, bot, answers):
    """В группе бот молчит: кнопки web_app работают только в личных чатах."""
    await feed(dp, bot, text="/start book", chat_type="group")

    answers.assert_not_called()


async def test_repeated_start_answers_again(dp, bot, answers):
    """Повторное нажатие кнопки чата отвечается снова, а не молчанием."""
    await feed(dp, bot, text="/start book")
    await feed(dp, bot, text="/start book")

    assert answers.await_count == 2


async def test_write_access_service_message_is_not_answered(dp, bot, answers):
    """Служебное write_access_allowed остаётся без ответа: человек уже в кабинете."""
    await feed(dp, bot, write_access=True)

    answers.assert_not_called()
