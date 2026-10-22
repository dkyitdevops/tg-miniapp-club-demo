import { expect, test, vi } from 'vitest'
import { BOT_USERNAME } from './config.ts'
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
    BackButton: {
      show: vi.fn(),
      hide: vi.fn(),
      onClick: vi.fn(),
      offClick: vi.fn(),
    },
  }
}

type FakeWebApp = ReturnType<typeof fakeWebApp>

function fakeWindow(webApp: FakeWebApp): Window {
  return { Telegram: { WebApp: webApp }, open: vi.fn() } as unknown as Window
}

function expectBackButtonUntouched(webApp: FakeWebApp) {
  for (const method of Object.values(webApp.BackButton)) {
    expect(method).not.toHaveBeenCalled()
  }
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
    `https://t.me/${BOT_USERNAME}?start=care`,
  )
  expect(win.open).not.toHaveBeenCalled()
})

test('openChat открывает чат бота с темой в параметре start', () => {
  const webApp = fakeWebApp()
  const win = fakeWindow(webApp)

  createTelegramPlatform(win, BACKGROUND).openChat('book')

  expect(webApp.openTelegramLink).toHaveBeenCalledWith(
    `https://t.me/${BOT_USERNAME}?start=book`,
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

test('в Telegram 8.0 showBack показывает кнопку «Назад», нажатие зовёт onBack, а снятие прячет кнопку и убирает обработчик', () => {
  const webApp = fakeWebApp({ version: '8.0' })
  const platform = createTelegramPlatform(fakeWindow(webApp), BACKGROUND)
  const onBack = vi.fn()

  const hideBack = platform.showBack(onBack)

  expect(webApp.BackButton.show).toHaveBeenCalledTimes(1)
  expect(webApp.BackButton.onClick).toHaveBeenCalledTimes(1)
  const [handler] = webApp.BackButton.onClick.mock.calls[0]
  handler()
  expect(onBack).toHaveBeenCalledTimes(1)
  expect(webApp.BackButton.hide).not.toHaveBeenCalled()
  expect(webApp.BackButton.offClick).not.toHaveBeenCalled()

  hideBack()

  expect(webApp.BackButton.offClick).toHaveBeenCalledExactlyOnceWith(handler)
  expect(webApp.BackButton.hide).toHaveBeenCalledTimes(1)
})

test('на клиенте 6.0 showBack не трогает кнопку «Назад», а снятие безопасно', () => {
  const webApp = fakeWebApp({ version: '6.0' })
  const platform = createTelegramPlatform(fakeWindow(webApp), BACKGROUND)

  const hideBack = platform.showBack(vi.fn())

  expect(() => hideBack()).not.toThrow()
  expectBackButtonUntouched(webApp)
})

test('кнопка «Назад» доступна с версии 6.1', () => {
  const webApp = fakeWebApp({ version: '6.1' })

  createTelegramPlatform(fakeWindow(webApp), BACKGROUND).showBack(vi.fn())

  expect(webApp.BackButton.show).toHaveBeenCalledTimes(1)
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
    `https://t.me/${BOT_USERNAME}?start=care`,
    '_blank',
    'noopener,noreferrer',
  )
})

test('в браузере showBack не трогает кнопку «Назад» и не падает', () => {
  // Версия 8.0, чтобы кнопку отключала именно платформа unknown, а не порог
  // версии.
  const webApp = fakeWebApp({ platform: 'unknown', version: '8.0' })
  const platform = createTelegramPlatform(fakeWindow(webApp), BACKGROUND)

  const hideBack = platform.showBack(vi.fn())

  expect(() => hideBack()).not.toThrow()
  expectBackButtonUntouched(webApp)
})

test('без скрипта Telegram экран всё равно работает', () => {
  const win = { open: vi.fn() } as unknown as Window

  const platform = createTelegramPlatform(win, BACKGROUND)

  expect(platform.viewer).toBeNull()
  expect(() => platform.ready()).not.toThrow()
  expect(() => platform.tap()).not.toThrow()
  const hideBack = platform.showBack(vi.fn())
  expect(() => hideBack()).not.toThrow()
  platform.openChat('book')
  expect(win.open).toHaveBeenCalledWith(
    `https://t.me/${BOT_USERNAME}?start=book`,
    '_blank',
    'noopener,noreferrer',
  )
})
