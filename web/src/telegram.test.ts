import { expect, test, vi } from 'vitest'
import { createTelegramPlatform } from './telegram.ts'

const BACKGROUND = '#1d1719'

function versionAtLeast(version: string, required: string): boolean {
  const have = version.split('.').map(Number)
  const need = required.split('.').map(Number)
  for (let i = 0; i < Math.max(have.length, need.length); i += 1) {
    const difference = (have[i] ?? 0) - (need[i] ?? 0)
    if (difference !== 0) return difference > 0
  }
  return true
}

interface FakeOptions {
  version?: string
  platform?: string
  firstName?: string
}

function fakeWebApp({
  version = '8.0',
  platform = 'android',
  firstName,
}: FakeOptions = {}) {
  return {
    version,
    platform,
    initData: '',
    initDataUnsafe: firstName ? { user: { first_name: firstName } } : {},
    isVersionAtLeast: vi.fn((required: string) =>
      versionAtLeast(version, required),
    ),
    setBackgroundColor: vi.fn(),
    // Как в живом telegram-web-app.js: до 6.9 шапка принимает только ключи
    // цвета, а hex бросает исключение.
    setHeaderColor: vi.fn((color: string) => {
      const keys = ['bg_color', 'secondary_bg_color']
      if (!versionAtLeast(version, '6.9') && !keys.includes(color)) {
        throw new Error('WebAppHeaderColorKeyInvalid')
      }
    }),
    setBottomBarColor: vi.fn(),
    expand: vi.fn(),
    ready: vi.fn(),
    openTelegramLink: vi.fn(),
    HapticFeedback: { impactOccurred: vi.fn() },
  }
}

function fakeWindow(webApp: ReturnType<typeof fakeWebApp>): Window {
  return { Telegram: { WebApp: webApp }, open: vi.fn() } as unknown as Window
}

test('в Telegram 8.0 красит шапку, фон и нижнюю панель в цвет экрана и разворачивает его', () => {
  const webApp = fakeWebApp({ version: '8.0' })

  createTelegramPlatform(fakeWindow(webApp), BACKGROUND)

  expect(webApp.setHeaderColor).toHaveBeenCalledWith(BACKGROUND)
  expect(webApp.setBackgroundColor).toHaveBeenCalledWith(BACKGROUND)
  expect(webApp.setBottomBarColor).toHaveBeenCalledWith(BACKGROUND)
  expect(webApp.expand).toHaveBeenCalledTimes(1)
})

test('на клиенте 6.2 не трогает шапку и нижнюю панель и не падает', () => {
  const webApp = fakeWebApp({ version: '6.2' })

  expect(() =>
    createTelegramPlatform(fakeWindow(webApp), BACKGROUND),
  ).not.toThrow()

  expect(webApp.setHeaderColor).not.toHaveBeenCalled()
  expect(webApp.setBottomBarColor).not.toHaveBeenCalled()
  expect(webApp.setBackgroundColor).toHaveBeenCalledWith(BACKGROUND)
})

test.each([
  ['setHeaderColor', '6.8', '6.9'],
  ['setBottomBarColor', '7.9', '7.10'],
] as const)(
  '%s: на клиенте %s не вызывается, с версии %s вызывается',
  (method, below, since) => {
    const beforeThreshold = fakeWebApp({ version: below })
    const onThreshold = fakeWebApp({ version: since })

    createTelegramPlatform(fakeWindow(beforeThreshold), BACKGROUND)
    createTelegramPlatform(fakeWindow(onThreshold), BACKGROUND)

    expect(beforeThreshold[method]).not.toHaveBeenCalled()
    expect(onThreshold[method]).toHaveBeenCalledWith(BACKGROUND)
  },
)

test('на клиенте 6.0 пропускает фон и тактильный отклик, но разворачивает экран', () => {
  const webApp = fakeWebApp({ version: '6.0' })

  const platform = createTelegramPlatform(fakeWindow(webApp), BACKGROUND)
  platform.tap()

  expect(webApp.setBackgroundColor).not.toHaveBeenCalled()
  expect(webApp.HapticFeedback.impactOccurred).not.toHaveBeenCalled()
  expect(webApp.expand).toHaveBeenCalledTimes(1)
})

test('зритель — имя пользователя Telegram', () => {
  const webApp = fakeWebApp({ firstName: 'Константин' })

  const platform = createTelegramPlatform(fakeWindow(webApp), BACKGROUND)

  expect(platform.viewer).toEqual({ firstName: 'Константин' })
})

test('кнопка обычной клавиатуры не передаёт данных пользователя, но это всё равно Telegram', () => {
  const webApp = fakeWebApp()
  const win = fakeWindow(webApp)

  const platform = createTelegramPlatform(win, BACKGROUND)
  platform.openChat('care')

  expect(platform.viewer).toBeNull()
  expect(webApp.setHeaderColor).toHaveBeenCalledWith(BACKGROUND)
  expect(webApp.openTelegramLink).toHaveBeenCalledWith(
    'https://t.me/aiglue_demo_bot?start=care',
  )
  expect(win.open).not.toHaveBeenCalled()
})

test('openChat открывает чат бота с темой в параметре start', () => {
  const webApp = fakeWebApp()
  const win = fakeWindow(webApp)

  createTelegramPlatform(win, BACKGROUND).openChat('book')

  expect(webApp.openTelegramLink).toHaveBeenCalledWith(
    'https://t.me/aiglue_demo_bot?start=book',
  )
  expect(win.open).not.toHaveBeenCalled()
})

test('tap даёт лёгкий тактильный отклик', () => {
  const webApp = fakeWebApp()

  createTelegramPlatform(fakeWindow(webApp), BACKGROUND).tap()

  expect(webApp.HapticFeedback.impactOccurred).toHaveBeenCalledWith('light')
})

test('ready передаётся в Telegram', () => {
  const webApp = fakeWebApp()

  createTelegramPlatform(fakeWindow(webApp), BACKGROUND).ready()

  expect(webApp.ready).toHaveBeenCalledTimes(1)
})

test('в браузере скрипт есть, но платформа unknown: Telegram не трогаем, чат открываем в новой вкладке', () => {
  const webApp = fakeWebApp({ platform: 'unknown', version: '6.0' })
  const win = fakeWindow(webApp)

  const platform = createTelegramPlatform(win, BACKGROUND)
  platform.ready()
  platform.tap()
  platform.openChat('care')

  expect(platform.viewer).toBeNull()
  expect(webApp.setBackgroundColor).not.toHaveBeenCalled()
  expect(webApp.setHeaderColor).not.toHaveBeenCalled()
  expect(webApp.setBottomBarColor).not.toHaveBeenCalled()
  expect(webApp.expand).not.toHaveBeenCalled()
  expect(webApp.ready).not.toHaveBeenCalled()
  expect(webApp.openTelegramLink).not.toHaveBeenCalled()
  expect(webApp.HapticFeedback.impactOccurred).not.toHaveBeenCalled()
  expect(win.open).toHaveBeenCalledWith(
    'https://t.me/aiglue_demo_bot?start=care',
    '_blank',
    'noopener,noreferrer',
  )
})

test('без скрипта Telegram экран всё равно работает', () => {
  const win = { open: vi.fn() } as unknown as Window

  const platform = createTelegramPlatform(win, BACKGROUND)

  expect(platform.viewer).toBeNull()
  expect(() => platform.ready()).not.toThrow()
  expect(() => platform.tap()).not.toThrow()
  platform.openChat('book')
  expect(win.open).toHaveBeenCalledWith(
    'https://t.me/aiglue_demo_bot?start=book',
    '_blank',
    'noopener,noreferrer',
  )
})
