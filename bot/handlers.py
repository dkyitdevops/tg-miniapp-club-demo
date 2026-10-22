from aiogram import F, Router
from aiogram.enums import ChatType
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import Message

from config import Settings
from replies import fallback_reply, open_app_keyboard, start_reply


async def on_start(message: Message, command: CommandObject, settings: Settings) -> None:
    await message.answer(
        start_reply(command.args), reply_markup=open_app_keyboard(settings.webapp_url)
    )


async def on_other(message: Message, settings: Settings) -> None:
    await message.answer(fallback_reply(), reply_markup=open_app_keyboard(settings.webapp_url))


def build_router() -> Router:
    # Фабрика: один Router нельзя подключить к двум Dispatcher, а тесты создают свой.
    router = Router()
    # Кнопки web_app работают только в личных чатах, в группах и каналах бот молчит.
    router.message.filter(F.chat.type == ChatType.PRIVATE)
    router.message.register(on_start, CommandStart())
    # write_access_allowed Telegram присылает, когда человек разрешил боту писать
    # при первом запуске по прямой ссылке: он в этот момент уже в кабинете.
    router.message.register(on_other, ~F.write_access_allowed)
    return router
