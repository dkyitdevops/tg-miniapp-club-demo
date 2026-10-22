import logging
from unittest.mock import AsyncMock

import pytest
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramNetworkError, TelegramRetryAfter
from aiogram.methods import SetMyDescription

from main import main


@pytest.fixture(autouse=True)
def offline_main(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BOT_TOKEN", "42:TEST")
    monkeypatch.setenv("WEBAPP_URL", "https://example.org/club/")
    monkeypatch.setattr(Bot, "set_my_description", AsyncMock())
    monkeypatch.setattr(Bot, "set_my_short_description", AsyncMock())


@pytest.fixture
def start_polling(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    mock = AsyncMock()
    monkeypatch.setattr(Dispatcher, "start_polling", mock)
    return mock


@pytest.mark.parametrize(
    "error",
    [
        TelegramNetworkError(SetMyDescription(), "нет сети"),
        TelegramRetryAfter(SetMyDescription(), "Too Many Requests", 30),
    ],
    ids=["network", "retry_after"],
)
async def test_polling_starts_when_description_is_rejected(
    start_polling, monkeypatch, caplog, error
):
    """Сбой при выставлении описания не мешает начать polling и попадает в лог."""
    monkeypatch.setattr(Bot, "set_my_description", AsyncMock(side_effect=error))

    await main()

    start_polling.assert_awaited_once()
    assert [record.levelno for record in caplog.records] == [logging.WARNING]


async def test_bot_is_created_with_html_parse_mode(start_polling):
    """Ответы с <blockquote> читаются как разметка, только если бот создан с parse_mode HTML."""
    await main()

    bot = start_polling.await_args.args[0]
    assert bot.default.parse_mode == ParseMode.HTML
