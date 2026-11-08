import { DAY_LABEL, DAYS, WEEKDAYS, orderedDays, type DayId } from "../types"

type DayPickerProps = {
  label: string
  selected: DayId[]
  onChange: (days: DayId[]) => void
  hint?: string
  presets?: boolean
}

export function DayPicker({ label, selected, onChange, hint, presets = false }: DayPickerProps) {
  function toggle(day: DayId) {
    const enabled = selected.includes(day)
    if (enabled && selected.length === 1) return
    const next = enabled ? selected.filter((item) => item !== day) : [...selected, day]
    onChange(orderedDays(next))
  }

  return (
    <div className="field">
      <span className="field-label-row">
        <span>{label}</span>
        {presets ? (
          <span className="day-presets">
            <button type="button" className="text-btn" onClick={() => onChange([...WEEKDAYS])}>
              평일
            </button>
            <button type="button" className="text-btn" onClick={() => onChange([...DAYS])}>
              전체
            </button>
          </span>
        ) : null}
      </span>
      <div className="day-picks" role="group" aria-label={label}>
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={selected.includes(day) ? "day-pick is-on" : "day-pick"}
            aria-pressed={selected.includes(day)}
            onClick={() => toggle(day)}
          >
            {DAY_LABEL[day]}
          </button>
        ))}
      </div>
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}
