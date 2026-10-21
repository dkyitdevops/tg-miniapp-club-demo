import {
  cleanup,
  getDefaultNormalizer,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import type { Viewer } from './platform.ts'

// Обычный нормализатор Testing Library схлопывает пробелы и превращает
// неразрывный пробел в обычный, а проверить нужно именно неразрывный.
const exact = {
  normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
}

function fakePlatform(viewer: Viewer | null = { firstName: 'Константин' }) {
  return { viewer, ready: vi.fn(), openChat: vi.fn(), tap: vi.fn() }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 19, 0))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('приветствует зрителя по имени из Telegram и времени суток', async () => {
  render(<App platform={fakePlatform()} />)

  await screen.findByRole('heading', {
    level: 1,
    name: 'Добрый вечер, Константин',
  })
})

test('без зрителя из Telegram приветствует тестового клиента', async () => {
  render(<App platform={fakePlatform(null)} />)

  await screen.findByRole('heading', { level: 1, name: 'Добрый вечер, Анна' })
})

test('показывает телефон под маской, статус, скидку и прогресс', async () => {
  render(<App platform={fakePlatform()} />)

  await screen.findByText('+7 999 ***-**-67')
  screen.getByText('Золотой статус')
  screen.getByText('Скидка 10%')
  screen.getByText('Платиновый через 3\u00a0визита', exact)
  const progress = screen.getByRole('progressbar', {
    name: 'Визиты до следующего статуса',
  })
  expect(progress.getAttribute('aria-valuenow')).toBe('7')
  expect(progress.getAttribute('aria-valuemax')).toBe('10')
  expect(progress.getAttribute('aria-valuetext')).toBe('7 из 10')
})

test('показывает все бонусные карты с балансом, и ни одна из них не кнопка', async () => {
  render(<App platform={fakePlatform()} />)

  const cards = await screen.findByRole('list', { name: 'Бонусные карты' })
  within(cards).getByText('2\u00a0450\u00a0баллов', exact)
  within(cards).getByText('5\u00a0000\u00a0₽', exact)
  within(cards).getByText('380\u00a0₽', exact)
  expect(screen.getAllByRole('button')).toHaveLength(3)
})

test('«Записаться на процедуру» даёт отклик и открывает чат бота по теме записи', async () => {
  const platform = fakePlatform()
  const user = userEvent.setup()
  render(<App platform={platform} />)

  await user.click(
    await screen.findByRole('button', { name: 'Записаться на процедуру' }),
  )

  expect(platform.tap).toHaveBeenCalledTimes(1)
  expect(platform.openChat).toHaveBeenCalledExactlyOnceWith('book')
})

test('«Связаться с отделом заботы» открывает чат по теме заботы', async () => {
  const platform = fakePlatform()
  const user = userEvent.setup()
  render(<App platform={platform} />)

  await user.click(
    await screen.findByRole('button', { name: 'Связаться с отделом заботы' }),
  )

  expect(platform.tap).toHaveBeenCalledTimes(1)
  expect(platform.openChat).toHaveBeenCalledExactlyOnceWith('care')
})

test('«Онлайн-запись» открывает лист внутри приложения, и он закрывается кнопкой и Escape', async () => {
  const platform = fakePlatform()
  const user = userEvent.setup()
  render(<App platform={platform} />)
  const opener = await screen.findByRole('button', { name: 'Онлайн-запись' })

  await user.click(opener)

  const sheet = screen.getByRole('dialog', { name: 'Онлайн-запись' })
  within(sheet).getByText(
    'Здесь откроется онлайн-запись YCLIENTS вашего филиала.',
  )
  expect(platform.openChat).not.toHaveBeenCalled()
  expect(platform.tap).toHaveBeenCalledTimes(1)
  const confirmButton = within(sheet).getByRole('button', { name: 'Понятно' })
  expect(document.activeElement).toBe(confirmButton)

  await user.click(confirmButton)

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(opener)

  await user.click(opener)
  screen.getByRole('dialog')
  await user.keyboard('{Escape}')

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(platform.tap).toHaveBeenCalledTimes(2)
})

test('касание подложки закрывает лист', async () => {
  const user = userEvent.setup()
  const { container } = render(<App platform={fakePlatform()} />)
  await user.click(await screen.findByRole('button', { name: 'Онлайн-запись' }))
  screen.getByRole('dialog')

  // У подложки нет роли: это поверхность для касания, а не элемент
  // управления, поэтому её ищем по классу.
  await user.click(container.querySelector('.sheet-backdrop')!)

  expect(screen.queryByRole('dialog')).toBeNull()
})

test('пока лист открыт, экран под ним недоступен, а текст листа описывает диалог', async () => {
  const user = userEvent.setup()
  render(<App platform={fakePlatform()} />)
  await user.click(await screen.findByRole('button', { name: 'Онлайн-запись' }))

  const sheet = screen.getByRole('dialog', {
    description: 'Здесь откроется онлайн-запись YCLIENTS вашего филиала.',
  })
  expect(screen.getByRole('main').hasAttribute('inert')).toBe(true)

  await user.click(within(sheet).getByRole('button', { name: 'Понятно' }))

  expect(screen.getByRole('main').hasAttribute('inert')).toBe(false)
})

test('сообщает Telegram о готовности один раз, когда экран показан', async () => {
  const platform = fakePlatform()
  render(<App platform={platform} />, { reactStrictMode: true })
  expect(platform.ready).not.toHaveBeenCalled()

  await screen.findByRole('heading', { level: 1 })

  expect(platform.ready).toHaveBeenCalledTimes(1)
})
