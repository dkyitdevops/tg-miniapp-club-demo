import pytest

from config import Settings, load_settings

ENV = {"BOT_TOKEN": "42:TEST", "WEBAPP_URL": "https://example.org/club/"}


def test_settings_from_env():
    """Токен и адрес Mini App читаются из окружения."""
    assert load_settings(ENV) == Settings("42:TEST", "https://example.org/club/")


@pytest.mark.parametrize("missing", ["BOT_TOKEN", "WEBAPP_URL"])
def test_missing_variable_stops_with_its_name(missing):
    """Без обязательной переменной бот не стартует, а в сообщении её имя."""
    env = {name: value for name, value in ENV.items() if name != missing}

    with pytest.raises(SystemExit, match=missing):
        load_settings(env)
