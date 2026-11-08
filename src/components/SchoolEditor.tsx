import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { DayToggles } from "./DayToggles"
import { SubjectBoard } from "./SubjectBoard"
import { TimeField } from "./TimeField"
import {
  activeDays,
  daySubject,
  createSlot,
  isValidRange,
  type SchoolPlan,
  type SchoolSlot,
  type SlotKind,
} from "../plan"
import { orderedDays, type DayId } from "../types"

function subjectSummary(slot: SchoolSlot): string {
  const names = activeDays(slot)
    .map((day) => daySubject(slot, day))
    .filter(Boolean)
  return [...new Set(names)].join("·")
}

type SchoolEditorProps = {
  school: SchoolPlan
  onChange: (school: SchoolPlan) => void
}

export function SchoolEditor({ school, onChange }: SchoolEditorProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const schoolRef = useRef(school)
  schoolRef.current = school
  const dragRef = useRef<{
    id: string
    pointerId: number
    startY: number
    dragging: boolean
    move: (event: PointerEvent) => void
    up: (event: PointerEvent) => void
  } | null>(null)

  function moveSlot(fromId: string, toId: string) {
    const current = schoolRef.current
    const slots = current.slots
    const from = slots.findIndex((slot) => slot.id === fromId)
    const to = slots.findIndex((slot) => slot.id === toId)
    if (from < 0 || to < 0 || from === to) return
    const next = [...slots]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange({ ...current, slots: next })
  }

  function stopDrag(event: PointerEvent, id: string) {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    window.removeEventListener("pointermove", drag.move)
    window.removeEventListener("pointerup", drag.up)
    window.removeEventListener("pointercancel", drag.up)
    const dragged = drag.dragging
    dragRef.current = null
    setDraggingId(null)
    if (!dragged) setOpenId((current) => (current === id ? null : id))
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, id: string) {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest(".slot-x")) return
    event.preventDefault()
    const list = event.currentTarget.closest(".slot-list")
    const move = (pointer: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || pointer.pointerId !== drag.pointerId) return
      if (!drag.dragging && Math.abs(pointer.clientY - drag.startY) > 8) {
        drag.dragging = true
        setDraggingId(drag.id)
      }
      if (!drag.dragging) return
      const cards = list?.querySelectorAll<HTMLElement>("[data-slot-id]")
      if (!cards) return
      const over = [...cards].find((card) => {
        const box = card.getBoundingClientRect()
        return pointer.clientY >= box.top && pointer.clientY <= box.bottom
      })
      if (over?.dataset.slotId) moveSlot(drag.id, over.dataset.slotId)
    }
    const up = (pointer: PointerEvent) => stopDrag(pointer, id)
    dragRef.current = { id, pointerId: event.pointerId, startY: event.clientY, dragging: false, move, up }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* 포인터 캡처가 없어도 window 이벤트로 순서를 바꿉니다. */
    }
  }

  function patchSlot(id: string, partial: Partial<SchoolSlot>) {
    onChange({
      ...school,
      slots: school.slots.map((slot) => (slot.id === id ? { ...slot, ...partial } : slot)),
    })
  }

  function add(kind: SlotKind) {
    const next = createSlot(kind, school.slots)
    onChange({ ...school, slots: [...school.slots, next] })
    setOpenId(next.id)
  }

  function paintSubject(id: string, day: DayId, subject: string) {
    onChange({
      ...school,
      slots: school.slots.map((slot) => {
        if (slot.id !== id) return slot
        const subjects = { ...(slot.subjects ?? {}) }
        const hasNamed = Object.values(subjects).some((name) => name?.trim())
        if (!hasNamed && slot.subject.trim()) {
          for (const itemDay of slot.days) subjects[itemDay] = slot.subject.trim()
        }
        if (subject) subjects[day] = subject
        else delete subjects[day]
        const days = subject && !slot.days.includes(day) ? orderedDays([...slot.days, day]) : slot.days
        return { ...slot, subjects, subject: "", days }
      }),
    })
  }

  return (
    <section className="editor-panel">
      <div className="arrival-card">
        <label className="arrival-field">
          <span>등교</span>
          <TimeField
            label="등교 시각"
            value={school.arrivalTime}
            onChange={(arrivalTime) => onChange({ ...school, arrivalTime })}
          />
        </label>
        <label className="skip-chip">
          <input
            type="checkbox"
            checked={school.skipped}
            onChange={(event) => onChange({ ...school, skipped: event.target.checked })}
          />
          학교 일정 입력 안 하기
        </label>
      </div>

      {school.skipped ? (
        <p className="editor-note">학교 일정은 시간표에서 빠지고, 방과후만 넣을 수 있습니다.</p>
      ) : (
        <>
          <div className="slot-list">
            {school.slots.map((slot) => {
              const open = openId === slot.id
              const invalid = !isValidRange(slot.startTime, slot.endTime)
              const subject = subjectSummary(slot)
              return (
                <article
                  key={slot.id}
                  data-slot-id={slot.id}
                  className={
                    [
                      "slot-card",
                      `is-${slot.kind}`,
                      open ? "is-open" : "",
                      draggingId === slot.id ? "is-dragging" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <div className="slot-summary">
                    <div
                      className="slot-hit"
                      role="button"
                      tabIndex={0}
                      aria-expanded={open}
                      onPointerDown={(event) => beginDrag(event, slot.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setOpenId(open ? null : slot.id)
                        }
                      }}
                    >
                      <span className="slot-main">
                        <span className="slot-kicker">{slot.label}</span>
                        {subject ? <span className="slot-title">{subject}</span> : null}
                      </span>
                      <span className="slot-timechip">
                        {slot.startTime}–{slot.endTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="slot-x"
                      aria-label={`${slot.label} 삭제`}
                      onClick={() => {
                        onChange({ ...school, slots: school.slots.filter((item) => item.id !== slot.id) })
                        setOpenId((current) => (current === slot.id ? null : current))
                      }}
                    >
                      ×
                    </button>
                  </div>
                  {open ? (
                    <div className="slot-panel">
                      <div className="slot-fields">
                        <span className="time-pair">
                          <span className="time-clock" aria-hidden="true">
                            🕐
                          </span>
                          <span className="time-box">
                            <TimeField
                              label="시작"
                              value={slot.startTime}
                              onChange={(startTime) => patchSlot(slot.id, { startTime })}
                            />
                            <span className="time-dash" aria-hidden="true">
                              –
                            </span>
                            <TimeField
                              label="종료"
                              value={slot.endTime}
                              onChange={(endTime) => patchSlot(slot.id, { endTime })}
                            />
                          </span>
                        </span>
                      </div>
                      {invalid ? <p className="form-error">종료 시각은 시작보다 늦어야 합니다.</p> : null}
                      <DayToggles
                        days={activeDays(slot)}
                        onChange={(days) => {
                          const subjects = { ...(slot.subjects ?? {}) }
                          for (const key of Object.keys(subjects) as DayId[]) {
                            if (!days.includes(key)) delete subjects[key]
                          }
                          patchSlot(slot.id, { days, subjects, subject: "" })
                        }}
                      />
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>

          <div className="add-row">
            <button type="button" className="add-kind is-period" onClick={() => add("period")}>
              + 교시
            </button>
            <button type="button" className="add-kind is-break" onClick={() => add("break")}>
              + 쉬는 시간
            </button>
            <button type="button" className="add-kind is-lunch" onClick={() => add("lunch")}>
              + 점심시간
            </button>
          </div>
          <SubjectBoard
            slots={school.slots}
            onPaint={paintSubject}
            onReset={() => {
              const ok = window.confirm("채운 과목만 지울까요? 교시 시간과 요일은 그대로 둡니다.")
              if (!ok) return
              onChange({
                ...school,
                slots: school.slots.map((slot) => ({ ...slot, subject: "", subjects: {} })),
              })
            }}
          />
        </>
      )}
    </section>
  )
}
