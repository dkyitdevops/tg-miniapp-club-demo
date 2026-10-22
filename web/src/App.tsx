import { useEffect, useLayoutEffect, useState } from 'react'
import { Actions } from './components/Actions.tsx'
import { BonusCards } from './components/BonusCards.tsx'
import { BookingSheet } from './components/BookingSheet.tsx'
import { StatusCard } from './components/StatusCard.tsx'
import { loadProfile } from './data/profile.ts'
import type { ProfileResponse } from './data/types.ts'
import { greeting, maskPhone } from './format.ts'
import type { ChatTopic, Platform } from './platform.ts'

export default function App({ platform }: { platform: Platform }) {
  const [hour] = useState(() => new Date().getHours())
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const shown = profile !== null || failed

  useEffect(() => {
    loadProfile().then(setProfile, () => setFailed(true))
  }, [])

  // Telegram советует звать ready() сразу, как только интерфейс на месте,
  // поэтому вызов идёт в том же коммите, где экран попал в DOM.
  useLayoutEffect(() => {
    if (shown) platform.ready()
  }, [shown, platform])

  // Пока лист открыт, показываем кнопку «Назад» Telegram: без неё системная
  // «Назад» на Android закрыла бы весь кабинет, а не лист.
  useEffect(() => {
    if (!sheetOpen) return
    return platform.showBack(() => setSheetOpen(false))
  }, [sheetOpen, platform])

  // Чат открываем прямо в обработчике касания, без анимации и await перед
  // ним: Android молча пропускает openTelegramLink, если с касания прошло
  // больше 10 секунд, и пускает один вызов на одно касание.
  function openChat(topic: ChatTopic) {
    platform.tap()
    platform.openChat(topic)
  }

  function openSheet() {
    platform.tap()
    setSheetOpen(true)
  }

  if (failed) {
    return (
      <main className="cabinet">
        <p className="notice">
          Не получилось загрузить кабинет. Закройте и откройте его ещё раз.
        </p>
      </main>
    )
  }

  if (!profile) return null

  const name = platform.viewer?.firstName ?? profile.client.first_name

  return (
    <>
      <main className="cabinet" inert={sheetOpen}>
        <h1 className="greeting">{greeting(hour, name)}</h1>
        <p className="phone">{maskPhone(profile.client.phone)}</p>
        <StatusCard status={profile.client.status} />
        <BonusCards cards={profile.cards} />
        <Actions
          onBook={() => openChat('book')}
          onOnlineBooking={openSheet}
          onCare={() => openChat('care')}
        />
      </main>
      <BookingSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
