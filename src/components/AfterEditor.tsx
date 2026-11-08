import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { DayToggles } from "./DayToggles"
import { TimeField } from "./TimeField"
import { addMinutes } from "../time"
import { DAY_LABEL, WEEKDAYS, orderedDays, type DayId } from "../types"
import {
  AFTER_CATEGORIES,
  createAfterItem,
  isValidRange,
  type AfterItem,
  type AfterPlan,
} from "../plan"

const AFTER_TONE: Record<AfterItem["category"], string> = {
  학원: "academy",
  휴식: "rest",
  픽업: "pickup",
  이동: "transit",
  방과후: "program",
  돌봄: "care",
  늘봄: "neulbom",
  기타: "other",
}

function daySummary(days: readonly DayId[]): string {
  const ordered = orderedDays(days)
  const weekdays = ordered.length === WEEKDAYS.length && WEEKDAYS.every((day, index) => day === ordered[index])
  if (weekdays) return "매일"
  return ordered.map((day) => DAY_LABEL[day]).join(",")
}

type AfterEditorProps = {
  after: AfterPlan
  onChange: (after: AfterPlan) => void
}

export function AfterEditor({ after, onChange }: AfterEditorProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const afterRef = useRef(after)
  afterRef.current = after
  const dragRef = useRef<{
    id: string
    pointerId: number
    startY: number
    dragging: boolean
    move: (event: PointerEvent) => void
    up: (event: PointerEvent) => void
  } | null>(null)

  function moveItemById(fromId: string, toId: string) {
    const current = afterRef.current
    const items = current.items
    const from = items.findIndex((item) => item.id === fromId)
    const to = items.findIndex((item) => item.id === toId)
    if (from < 0 || to < 0 || from === to) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange({ ...current, items: next })
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
      if (over?.dataset.slotId) moveItemById(drag.id, over.dataset.slotId)
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

  function patch(id: string, partial: Partial<AfterItem>) {
    onChange({
      ...after,
      items: after.items.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    })
  }

  function add() {
    const next = createAfterItem()
    onChange({ ...after, items: [...after.items, next] })
    setOpenId(next.id)
  }

  return (
    <section className="editor-panel">
      <div className="arrival-card">
        <span className="arrival-label">방과후</span>
        <label className="skip-chip">
          <input
            type="checkbox"
            checked={after.skipped}
            onChange={(event) => onChange({ ...after, skipped: event.target.checked })}
          />
          방과후 일정 입력 안 하기
        </label>
      </div>
      {after.skipped ? (
        <p className="editor-note">방과후 일정은 시간표에서 빠집니다.</p>
      ) : (
        <>
          {after.items.length === 0 ? <p className="editor-empty">아직 방과후 일정이 없습니다.</p> : null}

          <div className="slot-list">
            {after.items.map((item) => {
              const open = openId === item.id
              const pickup = item.category === "픽업"
              const invalid = !pickup && !isValidRange(item.startTime, item.endTime)
              const title = item.name.trim() || item.category
              const timeLabel = pickup ? item.startTime : `${item.startTime}–${item.endTime}`
              return (
                <article
                  key={item.id}
                  data-slot-id={item.id}
                  className={
                    [
                      "slot-card",
                      "is-after",
                      `is-${AFTER_TONE[item.category]}`,
                      open ? "is-open" : "",
                      draggingId === item.id ? "is-dragging" : "",
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
                      onPointerDown={(event) => beginDrag(event, item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setOpenId(open ? null : item.id)
                        }
                      }}
                    >
                      <span className="slot-kicker-col">
                        <span className="slot-kicker">{item.startTime}</span>
                        <span className="slot-kicker-days">{daySummary(item.days)}</span>
                      </span>
                      <span className="slot-copy">
                        <span className={item.name.trim() ? "slot-title" : "slot-title is-empty"}>{title}</span>
                        <span className="slot-sub">{timeLabel}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="slot-x"
                      aria-label={`${title} 삭제`}
                      onClick={() => {
                        onChange({ ...after, items: after.items.filter((row) => row.id !== item.id) })
                        setOpenId((current) => (current === item.id ? null : current))
                      }}
                    >
                      ×
                    </button>
                  </div>
                  {open ? (
                    <div className="slot-panel">
                      <div className="slot-fields">
                        <select
                          className="slot-kind"
                          aria-label="분류"
                          value={item.category}
                          onChange={(event) => {
                            const category = event.target.value as AfterItem["category"]
                            if (category === "학원") {
                              patch(item.id, { category, endTime: addMinutes(item.startTime, 60) })
                              return
                            }
                            patch(item.id, { category })
                          }}
                        >
                          {AFTER_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <input
                          className="slot-subject"
                          aria-label="이름"
                          placeholder="이름"
                          value={item.name}
                          onChange={(event) => patch(item.id, { name: event.target.value })}
                        />
                        <span className="time-pair">
                          <span className="time-clock" aria-hidden="true">
                            🕐
                          </span>
                          <span className="time-box">
                            <TimeField
                              label={pickup ? "시간" : "시작"}
                              value={item.startTime}
                              onChange={(startTime) => patch(item.id, { startTime })}
                            />
                            {pickup ? null : (
                              <>
                                <span className="time-dash" aria-hidden="true">
                                  –
                                </span>
                                <TimeField
                                  label="종료"
                                  value={item.endTime}
                                  onChange={(endTime) => patch(item.id, { endTime })}
                                />
                              </>
                            )}
                          </span>
                        </span>
                      </div>
                      {invalid ? <p className="form-error">종료 시각은 시작보다 늦어야 합니다.</p> : null}
                      <DayToggles days={item.days} onChange={(days) => patch(item.id, { days })} />
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>

          <div className="add-row">
            <button type="button" className="add-kind is-after" onClick={add}>
              + 일정 추가
            </button>
          </div>
        </>
      )}
    </section>
  )
}
