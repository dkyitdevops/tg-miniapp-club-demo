import type { BonusCard } from '../data/types.ts'
import { formatBalance } from '../format.ts'

export function BonusCards({ cards }: { cards: BonusCard[] }) {
  // role повторяет ul намеренно: список без маркеров WebKit не считает
  // списком, и VoiceOver теряет его подпись.
  return (
    <ul className="cards" role="list" aria-label="Бонусные карты">
      {cards.map((card) => (
        <li className="card" key={card.id}>
          <span>{card.title}</span>
          <span className="card-balance">{formatBalance(card)}</span>
        </li>
      ))}
    </ul>
  )
}
