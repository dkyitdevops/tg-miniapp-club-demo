import profile from './profile.json'
import type { ProfileResponse } from './types.ts'

// Единственное место, которое знает, откуда берутся данные: тестовый JSON в
// форме ответа API. Функция асинхронная, как запрос, чтобы экран не
// зависел от источника.
export function loadProfile(): Promise<ProfileResponse> {
  // Приведение неизбежно: JSON-импорт выводит string, а не объединение
  // литералов. Опечатку в unit ловит тест профиля.
  return Promise.resolve(profile as ProfileResponse)
}
