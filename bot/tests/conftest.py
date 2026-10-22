from datetime import UTC, datetime
from itertools import count
from unittest.mock import AsyncMock

import pytest
from aiogram import Bot, Dispatcher
from aiogram.types import Chat, Message, Sticker, Update, User, WriteAccessAllowed

from config import Settings
from handlers import build_router

USER = User(id=1001, is_bot=False, first_name="Анна")
STICKER = Sticker(
    file_id="sticker-file",
    file_unique_id="sticker-unique",
    type="regular",
    width=512,
    height=512,
    is_animated=False,
    is_video=False,
)

_ids = count(1)


@pytest.fixture
def settings() -> Settings:
    return Settings("42:TEST", "https://example.org/club/")


@pytest.fixture
def bot() -> Bot:
    return Bot("42:TEST")


@pytest.fixture
def dp(settings: Settings) -> Dispatcher:
    dispatcher = Dispatcher(settings=settings)
    dispatcher.include_router(build_router())
    return dispatcher


@pytest.fixture
def answers(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    mock = AsyncMock()
    monkeypatch.setattr(Message, "answer", mock)
    return mock


async def feed(
    dp: Dispatcher,
    bot: Bot,
    *,
    text: str | None = None,
    sticker: bool = False,
    write_access: bool = False,
    chat_type: str = "private",
) -> None:
    message = Message(
        message_id=next(_ids),
        date=datetime(2026, 10, 21, 12, 0, tzinfo=UTC),
        chat=Chat(id=USER.id, type=chat_type),
        from_user=USER,
        text=text,
        sticker=STICKER if sticker else None,
        write_access_allowed=WriteAccessAllowed(web_app_name="club") if write_access else None,
    )
    await dp.feed_update(bot, Update(update_id=next(_ids), message=message))
