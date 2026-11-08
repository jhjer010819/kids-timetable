import { useMemo, type CSSProperties, type RefObject } from "react"
import { BrandMark } from "./BrandMark"
import {
  boardHeight,
  eventIntersectsBoard,
  layoutPointLabels,
  yAt,
  PX_PER_MINUTE,
} from "../time"
import { DAY_LABEL, type DayId, type TimetableEvent } from "../types"

function paintCard(hex: string): CSSProperties {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return { background: "#f8fafc", borderColor: "#e2e8f0", color: "#0f172a" }
  const num = Number.parseInt(match[1], 16)
  const red = (num >> 16) & 255
  const green = (num >> 8) & 255
  const blue = num & 255
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  const mix = (amount: number) => {
    const channel = (value: number) => Math.round(value + (255 - value) * amount).toString(16).padStart(2, "0")
    return `#${channel(red)}${channel(green)}${channel(blue)}`
  }
  return {
    background: mix(luminance > 0.78 ? 0.12 : 0.7),
    borderColor: mix(luminance > 0.78 ? 0.28 : 0.42),
    color: "#0f172a",
  }
}

type TimetableSheetProps = {
  sheetRef: RefObject<HTMLDivElement | null>
  title: string
  startHour: number
  endHour: number
  visibleDays: DayId[]
  events: TimetableEvent[]
  onDelete?: (id: string) => void
}

export function TimetableSheet({
  sheetRef,
  title,
  startHour,
  endHour,
  visibleDays,
  events,
  onDelete,
}: TimetableSheetProps) {
  const height = boardHeight(startHour, endHour)
  const hours = useMemo(() => {
    const list: number[] = []
    for (let hour = startHour; hour <= endHour; hour += 1) list.push(hour)
    return list
  }, [startHour, endHour])

  const byDay = useMemo(() => {
    const map = new Map<DayId, TimetableEvent[]>()
    for (const day of visibleDays) map.set(day, [])
    for (const event of events) {
      if (eventIntersectsBoard(event, startHour, endHour)) map.get(event.day)?.push(event)
    }
    return map
  }, [events, startHour, endHour, visibleDays])

  return (
    <div className="sheet" ref={sheetRef} style={{ minWidth: 96 + visibleDays.length * 150 }}>
      <header className="sheet-head">
        <h2>{title}</h2>
        <p className="sheet-meta">
          {String(startHour).padStart(2, "0")}:00 – {String(endHour).padStart(2, "0")}:00
        </p>
      </header>

      <div
        className="grid"
        style={{
          ["--board-h" as string]: `${height}px`,
          gridTemplateColumns: `64px repeat(${visibleDays.length}, minmax(150px, 1fr))`,
        }}
      >
        <div className="time-col">
          <div className="time-spacer" />
          <div className="time-body" style={{ height }}>
            {hours.map((hour) => (
              <span key={hour} className="time-label" style={{ top: (hour - startHour) * 60 * PX_PER_MINUTE }}>
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>

        {visibleDays.map((day) => {
          const dayEvents = byDay.get(day) ?? []
          const pointLabels = layoutPointLabels(dayEvents, startHour, endHour)
          const weekend = day === "Sat" || day === "Sun"
          return (
            <section key={day} className={weekend ? "day-col weekend" : "day-col"} aria-label={DAY_LABEL[day]}>
              <h3 className="day-head">{DAY_LABEL[day]}</h3>
              <div className="day-body" style={{ height }}>
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className="hour-line"
                    style={{ top: (hour - startHour) * 60 * PX_PER_MINUTE }}
                  />
                ))}
                {hours.slice(0, -1).map((hour) => (
                  <span
                    key={`${hour}-half`}
                    className="half-line"
                    style={{ top: ((hour - startHour) * 60 + 30) * PX_PER_MINUTE }}
                  />
                ))}

                {dayEvents
                  .filter((event) => event.type === "range")
                  .map((event) => {
                    const top = Math.max(0, yAt(event.startTime, startHour))
                    const bottom = Math.min(height, yAt(event.endTime, startHour))
                    const blockHeight = bottom - top
                    if (blockHeight < 1) return null
                    const compact = blockHeight < 46
                    const tone = paintCard(event.color)
                    return (
                      <article
                        key={event.id}
                        className={compact ? "range-card is-compact" : "range-card"}
                        style={{ ...tone, top, height: blockHeight }}
                        title={`${event.title} ${event.startTime}–${event.endTime}`}
                      >
                        {onDelete ? (
                          <button
                            type="button"
                            className="icon-x only-screen"
                            aria-label={`${event.title} 삭제`}
                            onClick={() => onDelete(event.id)}
                          >
                            ×
                          </button>
                        ) : null}
                        <p className="range-title">{event.title}</p>
                        {compact ? null : (
                          <p className="range-time">
                            {event.startTime}–{event.endTime}
                          </p>
                        )}
                      </article>
                    )
                  })}

                {dayEvents
                  .filter((event) => event.type === "point")
                  .map((event) => {
                    const placement = pointLabels.get(event.id) ?? {
                      shiftY: 0,
                      align: "start" as const,
                      anchor: "above" as const,
                    }
                    return (
                      <div
                        key={event.id}
                        className="point"
                        style={{ top: yAt(event.time, startHour), zIndex: 20 + Math.round(yAt(event.time, startHour)) }}
                      >
                        <span className="point-line" style={{ background: event.color }} />
                        <span className="point-pin" style={{ background: event.color }} />
                        <div
                          className={placement.align === "end" ? "point-badge is-end" : "point-badge"}
                          style={{
                            borderColor: event.color,
                            transform:
                              placement.anchor === "above"
                                ? `translateY(calc(-100% + ${placement.shiftY}px))`
                                : `translateY(${placement.shiftY}px)`,
                          }}
                          title={`${event.time} ${event.title}`}
                        >
                          <span className="point-icon" aria-hidden="true">
                            {event.icon}
                          </span>
                          <span className="point-title">{event.title}</span>
                          <span className="point-time">{event.time}</span>
                          {onDelete ? (
                            <button
                              type="button"
                              className="icon-x only-screen"
                              aria-label={`${event.title} 삭제`}
                              onClick={() => onDelete(event.id)}
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </section>
          )
        })}
      </div>

      <footer className="sheet-foot">
        <div className="sheet-legend">
          <span className="legend">
            <i className="swatch-school" /> 학교 수업
          </span>
          <span className="legend">
            <i className="swatch-lunch" /> 점심시간
          </span>
          <span className="legend">
            <i className="swatch-after" /> 방과후/학원
          </span>
          <span className="legend">
            <i className="swatch-pin" /> 시점 일정 (등교/픽업)
          </span>
        </div>
        <div className="sheet-brand">
          <BrandMark />
        </div>
      </footer>
    </div>
  )
}
