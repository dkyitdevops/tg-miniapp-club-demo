import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramAPIError

from config import load_settings
from handlers import build_router
from replies import DESCRIPTION, SHORT_DESCRIPTION, open_app_menu_button


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = load_settings(os.environ)
    dp = Dispatcher(settings=settings)
    dp.include_router(build_router())
    async with Bot(
        settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    ) as bot:
        # Бот работает и без описания, и без кнопки меню, а упавший здесь процесс
        # Docker перезапускал бы по кругу.
        try:
            await bot.set_my_description(DESCRIPTION)
            await bot.set_my_short_description(SHORT_DESCRIPTION)
            await bot.set_chat_menu_button(menu_button=open_app_menu_button(settings.webapp_url))
        except TelegramAPIError as error:
            logging.warning("Описание или кнопка меню не выставлены: %s", error)
        await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
