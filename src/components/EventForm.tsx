import { useState, type FormEvent } from "react"
import { DayPicker } from "./DayPicker"
import { toMinutes } from "../time"
import { POINT_COLORS, POINT_ICONS, RANGE_COLORS, type DayId, type EventType, type TimetableEvent } from "../types"

type Draft = {
  type: EventType
  days: DayId[]
  title: string
  color: string
  startTime: string
  endTime: string
  time: string
  icon: string
}

const INITIAL_DRAFT: Draft = {
  type: "range",
  days: ["Mon"],
  title: "",
  color: RANGE_COLORS[0],
  startTime: "15:00",
  endTime: "16:00",
  time: "15:30",
  icon: "🏫",
}

type EventFormProps = {
  onAdd: (events: TimetableEvent[]) => void
}

export function EventForm({ onAdd }: EventFormProps) {
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT)
  const [error, setError] = useState<string | null>(null)
  const palette = draft.type === "range" ? RANGE_COLORS : POINT_COLORS

  function setType(type: EventType) {
    setDraft((current) => ({
      ...current,
      type,
      color: type === "range" ? RANGE_COLORS[0] : POINT_COLORS[0],
    }))
    setError(null)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) {
      setError("제목을 입력해 주세요.")
      return
    }

    if (draft.days.length === 0) {
      setError("요일을 하나 이상 골라 주세요.")
      return
    }

    if (draft.type === "range" && toMinutes(draft.endTime) <= toMinutes(draft.startTime)) {
      setError("끝나는 시간은 시작보다 늦어야 합니다.")
      return
    }

    onAdd(
      draft.days.map((day) =>
        draft.type === "range"
          ? {
              id: crypto.randomUUID(),
              type: "range" as const,
              day,
              startTime: draft.startTime,
              endTime: draft.endTime,
              title,
              color: draft.color,
            }
          : {
              id: crypto.randomUUID(),
              type: "point" as const,
              day,
              time: draft.time,
              title,
              icon: draft.icon,
              color: draft.color,
            },
      ),
    )

    setDraft((current) => ({ ...current, title: "" }))
    setError(null)
  }

  return (
    <form className="panel form" onSubmit={onSubmit}>
      <div className="panel-head">
        <h2>일정 추가</h2>
      </div>
      <div className="segment" role="group" aria-label="일정 종류">
        <button type="button" aria-pressed={draft.type === "range"} onClick={() => setType("range")}>
          범위
        </button>
        <button type="button" aria-pressed={draft.type === "point"} onClick={() => setType("point")}>
          시점
        </button>
      </div>
      <p className="hint">
        {draft.type === "range" ? "시작과 끝이 있는 블록으로 그려집니다." : "정확한 시각에 가로 핀으로 그려집니다."}
      </p>

      <DayPicker
        label="요일"
        selected={draft.days}
        hint="여러 요일을 고르면 같은 일정이 각 요일에 들어갑니다."
        onChange={(days) => setDraft((current) => ({ ...current, days }))}
      />

      <label className="field">
        제목
        <input
          value={draft.title}
          placeholder={draft.type === "range" ? "미술 학원" : "정문 픽업"}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>

      {draft.type === "range" ? (
        <div className="time-row">
          <label className="field">
            시작
            <input
              type="time"
              value={draft.startTime}
              onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            종료
            <input
              type="time"
              value={draft.endTime}
              onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))}
              required
            />
          </label>
        </div>
      ) : (
        <>
          <label className="field">
            시각
            <input
              type="time"
              value={draft.time}
              onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
              required
            />
          </label>
          <div className="field">
            아이콘
            <div className="icon-row">
              {POINT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={draft.icon === icon ? "icon-btn is-on" : "icon-btn"}
                  aria-pressed={draft.icon === icon}
                  onClick={() => setDraft((current) => ({ ...current, icon }))}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="field">
        색
        <div className="color-row">
          <div className="swatches">
            {palette.map((color) => (
              <button
                key={color}
                type="button"
                className={draft.color === color ? "swatch is-on" : "swatch"}
                style={{ background: color }}
                aria-label={color}
                aria-pressed={draft.color === color}
                onClick={() => setDraft((current) => ({ ...current, color }))}
              />
            ))}
          </div>
          <input
            className="color-input"
            type="color"
            value={draft.color}
            aria-label="직접 고른 색"
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
          />
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn-primary submit" type="submit">
        시간표에 넣기
      </button>
    </form>
  )
}
