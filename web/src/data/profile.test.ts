import { expect, test } from 'vitest'
import { loadProfile } from './profile.ts'

test('тестовый профиль приходит в форме ответа API', async () => {
  const profile = await loadProfile()

  expect(profile.cards.map((card) => card.id)).toEqual([
    'bonus',
    'gift',
    'cashback',
  ])
  expect(
    profile.cards.every(
      (card) => card.unit === 'points' || card.unit === 'rub',
    ),
  ).toBe(true)
  expect(profile.client.status.next).toEqual({
    name: 'Платиновый',
    visits_required: 10,
    visits_done: 7,
  })
})
