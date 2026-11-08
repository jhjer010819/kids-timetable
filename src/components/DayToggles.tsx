import { DAY_LABEL, DAYS, orderedDays, type DayId } from "../types"

type DayTogglesProps = {
  days: DayId[]
  onChange: (days: DayId[]) => void
}

export function DayToggles({ days, onChange }: DayTogglesProps) {
  function toggle(day: DayId) {
    const enabled = days.includes(day)
    if (enabled && days.length === 1) return
    const next = enabled ? days.filter((item) => item !== day) : [...days, day]
    onChange(orderedDays(next))
  }

  return (
    <div className="mini-days" role="group" aria-label="요일 지정">
      <span className="mini-cal" aria-hidden="true">
        📅
      </span>
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          className={days.includes(day) ? "mini-day is-on" : "mini-day"}
          aria-pressed={days.includes(day)}
          onClick={() => toggle(day)}
        >
          {DAY_LABEL[day]}
        </button>
      ))}
    </div>
  )
}
