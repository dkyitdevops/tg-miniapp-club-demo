from collections.abc import Mapping
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    bot_token: str
    webapp_url: str


def load_settings(env: Mapping[str, str]) -> Settings:
    return Settings(
        bot_token=_required(env, "BOT_TOKEN"),
        webapp_url=_required(env, "WEBAPP_URL"),
    )


def _required(env: Mapping[str, str], name: str) -> str:
    if name not in env:
        raise SystemExit(f"Не задана переменная окружения {name}")
    return env[name]
