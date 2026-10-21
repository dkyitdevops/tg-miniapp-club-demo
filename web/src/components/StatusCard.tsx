import type { ClubStatus, NextStatus } from '../data/types.ts'
import { nextStatusLine } from '../format.ts'

const RADIUS = 33
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ProgressRing({ next }: { next: NextStatus }) {
  const filled = (CIRCUMFERENCE * next.visits_done) / next.visits_required

  return (
    <svg
      className="ring"
      width="112"
      height="112"
      viewBox="0 0 80 80"
      role="progressbar"
      aria-label="Визиты до следующего статуса"
      aria-valuemin={0}
      aria-valuenow={next.visits_done}
      aria-valuemax={next.visits_required}
      aria-valuetext={`${next.visits_done} из ${next.visits_required}`}
    >
      <circle className="ring-track" cx="40" cy="40" r={RADIUS} />
      <circle
        className="ring-value"
        cx="40"
        cy="40"
        r={RADIUS}
        strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
        transform="rotate(-90 40 40)"
      />
      <text className="ring-count" x="40" y="46" textAnchor="middle">
        {next.visits_done}/{next.visits_required}
      </text>
    </svg>
  )
}

export function StatusCard({ status }: { status: ClubStatus }) {
  const { next } = status

  return (
    <div className="status">
      {next && <ProgressRing next={next} />}
      <div className="status-text">
        <p className="status-name">{status.name} статус</p>
        <p>Скидка {status.discount_percent}%</p>
        <p>{next ? nextStatusLine(next) : 'Высший статус клуба'}</p>
      </div>
    </div>
  )
}
