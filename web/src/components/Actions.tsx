export function Actions({
  onBook,
  onOnlineBooking,
  onCare,
}: {
  onBook(): void
  onOnlineBooking(): void
  onCare(): void
}) {
  return (
    <div className="actions">
      <button className="pill pill-accent" type="button" onClick={onBook}>
        Записаться на процедуру
        <span className="pill-arrow" aria-hidden="true">→</span>
      </button>
      <button className="pill" type="button" onClick={onOnlineBooking}>
        Онлайн-запись
        <span className="pill-arrow" aria-hidden="true">→</span>
      </button>
      <button className="pill" type="button" onClick={onCare}>
        Связаться с отделом заботы
        <span className="pill-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  )
}
