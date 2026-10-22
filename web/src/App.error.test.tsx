import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App.tsx'

vi.mock('./data/profile.ts', () => ({
  loadProfile: () => Promise.reject(new Error('offline')),
}))

test('если профиль не загрузился, говорит об этом и всё равно снимает заставку Telegram', async () => {
  const platform = {
    viewer: null,
    ready: vi.fn(),
    openChat: vi.fn(),
    tap: vi.fn(),
    showBack: vi.fn(() => vi.fn()),
  }
  render(<App platform={platform} />)

  await screen.findByText(
    'Не получилось загрузить кабинет. Закройте и откройте его ещё раз.',
  )
  expect(platform.ready).toHaveBeenCalledTimes(1)
})
