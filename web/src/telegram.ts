import { BOT_USERNAME } from './config.ts'
import type { ChatTopic, Platform } from './platform.ts'

interface TelegramWebApp {
  platform: string
  initDataUnsafe: { user?: { first_name: string } }
  isVersionAtLeast(version: string): boolean
  setBackgroundColor(color: string): void
  setHeaderColor(color: string): void
  setBottomBarColor(color: string): void
  expand(): void
  ready(): void
  openTelegramLink(url: string): void
  HapticFeedback: { impactOccurred(style: 'light'): void }
  BackButton: {
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp }
  }
}

function chatUrl(topic: ChatTopic): string {
  return `https://t.me/${BOT_USERNAME}?start=${topic}`
}

function createBrowserPlatform(win: Window): Platform {
  return {
    viewer: null,
    ready() {},
    openChat(topic) {
      win.open(chatUrl(topic), '_blank', 'noopener,noreferrer')
    },
    tap() {},
    showBack() {
      return () => {}
    },
  }
}

export function createTelegramPlatform(
  win: Window,
  background: string,
): Platform {
  const webApp = win.Telegram?.WebApp
  // Признак по initData не годится: он пуст и внутри Telegram, если приложение
  // открыто кнопкой обычной клавиатуры. В браузере скрипт всё равно заводит
  // WebApp, но с platform 'unknown'.
  if (!webApp || webApp.platform === 'unknown') {
    return createBrowserPlatform(win)
  }

  // Цвета выставляем под проверкой версии: на клиентах до 6.9 setHeaderColor
  // с hex бросает WebAppHeaderColorKeyInvalid, и экран падает до отрисовки.
  if (webApp.isVersionAtLeast('6.1')) webApp.setBackgroundColor(background)
  if (webApp.isVersionAtLeast('6.9')) webApp.setHeaderColor(background)
  if (webApp.isVersionAtLeast('7.10')) webApp.setBottomBarColor(background)
  webApp.expand()

  const firstName = webApp.initDataUnsafe.user?.first_name
  return {
    viewer: firstName ? { firstName } : null,
    ready() {
      webApp.ready()
    },
    openChat(topic) {
      webApp.openTelegramLink(chatUrl(topic))
    },
    tap() {
      if (webApp.isVersionAtLeast('6.1')) {
        webApp.HapticFeedback.impactOccurred('light')
      }
    },
    showBack(onBack) {
      if (!webApp.isVersionAtLeast('6.1')) return () => {}
      webApp.BackButton.onClick(onBack)
      webApp.BackButton.show()
      return () => {
        webApp.BackButton.offClick(onBack)
        webApp.BackButton.hide()
      }
    },
  }
}
