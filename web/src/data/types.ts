// Форма ответа API кабинета. Имена полей как в JSON, поэтому snake_case.
export interface ProfileResponse {
  client: Client
  cards: BonusCard[]
  review_links: ReviewLink[]
}

export interface Client {
  first_name: string
  last_name: string
  phone: string
  status: ClubStatus
}

export interface ClubStatus {
  name: string
  discount_percent: number
  next: NextStatus | null
}

export interface NextStatus {
  name: string
  visits_required: number
  visits_done: number
}

export interface BonusCard {
  id: string
  title: string
  balance: number
  unit: 'points' | 'rub'
}

export interface ReviewLink {
  branch: string
  url: string
}
