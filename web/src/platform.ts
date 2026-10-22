export type ChatTopic = 'book' | 'care'

export interface Viewer {
  firstName: string
}

// Всё, что экран знает о мессенджере. Telegram живёт только в telegram.ts.
export interface Platform {
  viewer: Viewer | null
  ready(): void
  openChat(topic: ChatTopic): void
  tap(): void
  showBack(onBack: () => void): () => void
}
