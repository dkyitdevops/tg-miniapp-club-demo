import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramAPIError

from config import load_settings
from handlers import build_router
from replies import DESCRIPTION, SHORT_DESCRIPTION


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = load_settings(os.environ)
    dp = Dispatcher(settings=settings)
    dp.include_router(build_router())
    async with Bot(
        settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    ) as bot:
        # Бот работает и без описания, а упавший здесь процесс Docker
        # перезапускал бы по кругу.
        try:
            await bot.set_my_description(DESCRIPTION)
            await bot.set_my_short_description(SHORT_DESCRIPTION)
        except TelegramAPIError as error:
            logging.warning("Описание бота не выставлено: %s", error)
        await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
