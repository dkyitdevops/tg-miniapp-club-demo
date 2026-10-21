import { expect, test } from 'vitest'
import {
  formatBalance,
  greeting,
  maskPhone,
  nextStatusLine,
} from './format.ts'

test.each([
  [5, 'Доброе утро'],
  [11, 'Доброе утро'],
  [12, 'Добрый день'],
  [17, 'Добрый день'],
  [18, 'Добрый вечер'],
  [22, 'Добрый вечер'],
  [23, 'Доброй ночи'],
  [0, 'Доброй ночи'],
  [4, 'Доброй ночи'],
])('в %i:00 — «%s»', (hour, text) => {
  expect(greeting(hour, 'Анна')).toBe(`${text}, Анна`)
})

test.each(['+79990000067', '89990000067', '+7 (999) 000-00-67'])(
  'номер %s показывается под маской',
  (phone) => {
    expect(maskPhone(phone)).toBe('+7 999 ***-**-67')
  },
)

test('у номера не того формата видны только две последние цифры', () => {
  expect(maskPhone('12345')).toBe('***45')
})

test('у номера из 11 цифр с первой не 7 и не 8 видны только две последние цифры', () => {
  expect(maskPhone('19990000067')).toBe('*********67')
})

test.each([
  [2450, 'points', '2\u00a0450\u00a0баллов'],
  [1, 'points', '1\u00a0балл'],
  [2, 'points', '2\u00a0балла'],
  [11, 'points', '11\u00a0баллов'],
  [12, 'points', '12\u00a0баллов'],
  [21, 'points', '21\u00a0балл'],
  [101, 'points', '101\u00a0балл'],
  [111, 'points', '111\u00a0баллов'],
  [5000, 'rub', '5\u00a0000\u00a0₽'],
  [380, 'rub', '380\u00a0₽'],
  [1234567, 'rub', '1\u00a0234\u00a0567\u00a0₽'],
] as const)('баланс %i %s → %s', (balance, unit, text) => {
  expect(formatBalance({ balance, unit })).toBe(text)
})

test.each([
  [7, 'Платиновый через 3\u00a0визита'],
  [9, 'Платиновый через 1\u00a0визит'],
  [5, 'Платиновый через 5\u00a0визитов'],
])('после %i визитов из 10 — «%s»', (done, text) => {
  expect(
    nextStatusLine({
      name: 'Платиновый',
      visits_required: 10,
      visits_done: done,
    }),
  ).toBe(text)
})
