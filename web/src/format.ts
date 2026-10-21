import type { BonusCard, NextStatus } from './data/types.ts'

function greetingFor(hour: number): string {
  if (hour < 5 || hour >= 23) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function plural(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100
  if (lastTwo >= 11 && lastTwo <= 14) return many
  const last = count % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

// Разряды разделяем сами: разделитель групп у ru-RU в Intl разный в разных
// WebView.
function groupDigits(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+$)/g, '\u00a0')
}

export function greeting(hour: number, name: string): string {
  return `${greetingFor(hour)}, ${name}`
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const parts = digits.match(/^[78](\d{3})\d{5}(\d{2})$/)
  if (parts) return `+7 ${parts[1]} ***-**-${parts[2]}`
  return digits.slice(0, -2).replace(/\d/g, '*') + digits.slice(-2)
}

export function formatBalance(
  card: Pick<BonusCard, 'balance' | 'unit'>,
): string {
  const unitLabel =
    card.unit === 'rub'
      ? '₽'
      : plural(card.balance, 'балл', 'балла', 'баллов')
  return `${groupDigits(card.balance)}\u00a0${unitLabel}`
}

export function nextStatusLine(next: NextStatus): string {
  const left = next.visits_required - next.visits_done
  const visits = plural(left, 'визит', 'визита', 'визитов')
  return `${next.name} через ${left}\u00a0${visits}`
}
