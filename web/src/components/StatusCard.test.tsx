import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatusCard } from './StatusCard.tsx'

test('на высшем статусе кольца нет и написано, что статус высший', () => {
  render(
    <StatusCard
      status={{ name: 'Платиновый', discount_percent: 15, next: null }}
    />,
  )

  screen.getByText('Высший статус клуба')
  expect(screen.queryByRole('progressbar')).toBeNull()
})
