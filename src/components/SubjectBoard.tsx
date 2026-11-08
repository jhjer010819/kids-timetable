import { useState, type CSSProperties } from "react"
import {
  GRADE_SUBJECTS,
  SUBJECT_PRESETS,
  activeDays,
  daySubject,
  subjectColor,
  type SchoolSlot,
} from "../plan"
import { DAY_LABEL, WEEKDAYS, orderedDays, type DayId } from "../types"

const ERASE = "__erase__"

function SubjectChip({
  name,
  brush,
  onChoose,
}: {
  name: string
  brush: string | null
  onChoose: (name: string) => void
}) {
  return (
    <button
      type="button"
      className={brush === name ? "subject-chip is-on" : "subject-chip"}
      style={{ background: subjectColor(name) }}
      aria-pressed={brush === name}
      onClick={() => onChoose(name)}
    >
      <span className="subject-dot" aria-hidden="true" />
      {name}
    </button>
  )
}

type SubjectBoardProps = {
  slots: SchoolSlot[]
  onPaint: (id: string, day: DayId, subject: string) => void
  onReset: () => void
}

export function SubjectBoard({ slots, onPaint, onReset }: SubjectBoardProps) {
  const [plain, setPlain] = useState(true)
  const [brush, setBrush] = useState<string | null>(null)
  const [custom, setCustom] = useState("")
  const [openGrades, setOpenGrades] = useState<Record<string, boolean>>({})
  const periods = slots.filter((slot) => slot.kind === "period")
  const hasSubjects = slots.some(
    (slot) => slot.subject.trim() || Object.values(slot.subjects ?? {}).some((name) => name?.trim()),
  )
  const days = orderedDays([...WEEKDAYS, ...periods.flatMap((slot) => activeDays(slot))])

  function chooseCustom() {
    const name = custom.trim()
    if (!name) return
    setBrush(name)
  }

  function paint(slot: SchoolSlot, day: DayId) {
    if (!brush) return
    const current = daySubject(slot, day)
    if (brush === ERASE || current === brush) onPaint(slot.id, day, "")
    else onPaint(slot.id, day, brush)
  }

  const open = !plain

  return (
    <div className={open ? "subject-board is-open" : "subject-board"}>
      <div
        className="subject-toggle"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("label")) return
          setPlain(false)
        }}
      >
        <span className="subject-toggle-title">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 7v14" />
            <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
          </svg>
          과목 채우기
        </span>
        <label className="skip-chip subject-plain">
          <input type="checkbox" checked={plain} onChange={(event) => setPlain(event.target.checked)} />
          과목 없이 시간표만 사용하기
        </label>
      </div>
      {open ? (
        <div className="subject-panel">
          <div className="subject-tools">
            <p className="subject-hint">과목을 선택하고 넣을 곳을 고르세요</p>
            <button type="button" className="subject-reset" onClick={onReset} disabled={!hasSubjects}>
              과목 입력 초기화
            </button>
          </div>
          <div className="subject-chips" role="group" aria-label="과목">
            {SUBJECT_PRESETS.map((name) => (
              <SubjectChip key={name} name={name} brush={brush} onChoose={setBrush} />
            ))}
            <button
              type="button"
              className={brush === ERASE ? "subject-chip is-erase is-on" : "subject-chip is-erase"}
              aria-pressed={brush === ERASE}
              onClick={() => setBrush(ERASE)}
            >
              지우기
            </button>
          </div>
          <div className="subject-grades">
            {GRADE_SUBJECTS.map((grade) => {
              const expanded = openGrades[grade.id] === true
              return (
                <div key={grade.id} className="subject-grade">
                  <button
                    type="button"
                    className="subject-grade-toggle"
                    aria-expanded={expanded}
                    onClick={() => setOpenGrades((current) => ({ ...current, [grade.id]: !expanded }))}
                  >
                    {grade.label}
                  </button>
                  {expanded ? (
                    <div className="subject-chips" role="group" aria-label={grade.label}>
                      {grade.names.map((name) => (
                        <SubjectChip key={name} name={name} brush={brush} onChoose={setBrush} />
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
          <form
            className="subject-custom"
            onSubmit={(event) => {
              event.preventDefault()
              chooseCustom()
            }}
          >
            <input
              aria-label="다른 과목"
              placeholder="다른 과목"
              maxLength={12}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              onBlur={chooseCustom}
            />
          </form>
          {periods.length === 0 ? (
            <p className="subject-hint">교시를 추가하면 그 칸에 과목을 넣을 수 있습니다.</p>
          ) : (
            <div className="subject-grid" style={{ "--day-count": days.length } as CSSProperties}>
              <div className="subject-row">
                <span />
                {days.map((day) => (
                  <span key={day} className="subject-head">
                    {DAY_LABEL[day]}
                  </span>
                ))}
              </div>
              {periods.map((slot) => (
                <div key={slot.id} className="subject-row">
                  <span className="subject-period">{slot.label}</span>
                  {days.map((day) => {
                    const name = daySubject(slot, day)
                    return (
                      <button
                        key={day}
                        type="button"
                        className={name ? "subject-cell is-filled" : "subject-cell"}
                        style={name ? { background: subjectColor(name) } : undefined}
                        aria-label={`${slot.label} ${DAY_LABEL[day]} ${name || "비어 있음"}`}
                        onClick={() => paint(slot, day)}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
