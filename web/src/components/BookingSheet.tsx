import { useEffect, useId, useRef } from 'react'

export function BookingSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose(): void
}) {
  const titleId = useId()
  const textId = useId()
  const confirmButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    confirmButton.current?.focus()
    return () => {
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
      >
        <h2 className="sheet-title" id={titleId}>Онлайн-запись</h2>
        <p className="sheet-text" id={textId}>
          Здесь откроется онлайн-запись YCLIENTS вашего филиала.
        </p>
        <button
          className="pill pill-accent sheet-button"
          type="button"
          ref={confirmButton}
          onClick={onClose}
        >
          Понятно
        </button>
      </div>
    </div>
  )
}
