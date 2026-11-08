import { toJpeg, toPng } from "html-to-image"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { presentInterstitial } from "./ads"
import { AdGate } from "./components/AdGate"
import { DayPicker } from "./components/DayPicker"
import { EventForm } from "./components/EventForm"
import { TimetableSheet } from "./components/TimetableSheet"
import { DAY_LABEL, DAYS, orderedDays, type TimetableEvent } from "./types"
import { eventIntersectsBoard, eventStartMinutes } from "./time"
import { defaultTimetable, loadTimetable, saveTimetable, type PersistedTimetable } from "./storage"

type ImageFormat = "png" | "jpg"

function fileSlug(title: string): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]/g, "")
  return cleaned || "kids-timetable"
}

function HourSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: number
  options: number[]
  onChange: (hour: number) => void
}) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {options.map((hour) => (
          <option key={hour} value={hour}>
            {String(hour).padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </label>
  )
}

export default function App() {
  const [doc, setDoc] = useState<PersistedTimetable>(loadTimetable)
  const [exportFormat, setExportFormat] = useState<ImageFormat | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const formatRef = useRef<ImageFormat | null>(null)
  const exportLock = useRef(false)

  useEffect(() => {
    saveTimetable(doc)
  }, [doc])

  useEffect(() => {
    if (!exportFormat || secondsLeft <= 0) return
    const id = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000)
    return () => window.clearTimeout(id)
  }, [exportFormat, secondsLeft])

  useEffect(() => {
    if (!exportFormat || secondsLeft > 0) return
    const format = formatRef.current
    const node = sheetRef.current
    if (!format || !node || exportLock.current) return

    exportLock.current = true
    setExporting(true)
    node.classList.add("is-capturing")

    const options = {
      pixelRatio: 3,
      backgroundColor: "#FFFFFF",
      skipFonts: true,
      cacheBust: false,
    }
    const task = format === "png" ? toPng(node, options) : toJpeg(node, { ...options, quality: 0.95 })

    task
      .then((dataUrl) => {
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `${fileSlug(doc.title)}.${format === "png" ? "png" : "jpg"}`
        link.click()
        setExportFormat(null)
      })
      .catch(() => {
        setExportError("이미지를 저장하지 못했습니다. 다시 시도해 주세요.")
        setExportFormat(null)
      })
      .finally(() => {
        node.classList.remove("is-capturing")
        exportLock.current = false
        setExporting(false)
      })
  }, [exportFormat, secondsLeft, doc.title])

  function askExport(format: ImageFormat) {
    if (exportFormat || exporting) return
    setExportError(null)
    formatRef.current = format
    setSecondsLeft(3)
    setExportFormat(format)
    void presentInterstitial("save-image")
  }

  function cancelExport() {
    if (exporting) return
    formatRef.current = null
    setExportFormat(null)
    setSecondsLeft(3)
  }

  function addEvents(events: TimetableEvent[]) {
    setDoc((current) => ({ ...current, events: [...current.events, ...events] }))
  }

  function deleteEvent(id: string) {
    setDoc((current) => ({ ...current, events: current.events.filter((event) => event.id !== id) }))
  }

  const visibleDays = orderedDays(doc.visibleDays ?? DAYS)

  const listed = [...doc.events].sort((a, b) => {
    const dayGap = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    return dayGap === 0 ? eventStartMinutes(a) - eventStartMinutes(b) : dayGap
  })

  const startOptions = [6, 7, 8, 9, 10]
  const endOptions = [16, 17, 18, 19, 20, 21, 22].filter((hour) => hour > doc.startHour)

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <Link className="brand brand-link" to="/">
            초등 시간표
          </Link>
          <p className="lede">범위 일정은 색 블록으로, 시점 일정은 그 시각의 가로 핀으로 나옵니다.</p>
        </div>
        <div className="export-actions">
          <button type="button" className="btn-primary" onClick={() => askExport("png")} disabled={Boolean(exportFormat)}>
            PNG 저장
          </button>
          <button type="button" className="btn-ghost" onClick={() => askExport("jpg")} disabled={Boolean(exportFormat)}>
            JPG 저장
          </button>
          {exportError ? <p className="export-error">{exportError}</p> : null}
        </div>
      </header>

      <aside className="sidebar">
        <section className="panel">
          <label className="field">
            시간표 제목
            <input value={doc.title} onChange={(event) => setDoc((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <div className="time-row">
            <HourSelect
              label="시작 시각"
              value={doc.startHour}
              options={startOptions}
              onChange={(startHour) =>
                setDoc((current) => ({
                  ...current,
                  startHour,
                  endHour: current.endHour > startHour ? current.endHour : Math.min(22, startHour + 8),
                }))
              }
            />
            <HourSelect
              label="끝 시각"
              value={doc.endHour}
              options={endOptions}
              onChange={(endHour) => setDoc((current) => ({ ...current, endHour }))}
            />
          </div>
          <DayPicker
            label="표시할 요일"
            presets
            selected={visibleDays}
            onChange={(visibleDays) => setDoc((current) => ({ ...current, visibleDays }))}
          />
        </section>

        <EventForm onAdd={addEvents} />

        <section className="panel list-panel">
          <div className="panel-head">
            <h2>등록된 일정</h2>
            <button type="button" className="text-btn" onClick={() => setDoc(defaultTimetable())}>
              예시로 되돌리기
            </button>
          </div>
          <ul className="event-list">
            {listed.map((event) => {
              const outside = !eventIntersectsBoard(event, doc.startHour, doc.endHour)
              const hiddenDay = !visibleDays.includes(event.day)
              const when = event.type === "point" ? event.time : `${event.startTime}–${event.endTime}`
              return (
                <li key={event.id} className="event-row">
                  <span className="event-mark" style={{ background: event.color }}>
                    {event.type === "point" ? event.icon : ""}
                  </span>
                  <span>
                    <strong>
                      {DAY_LABEL[event.day]} {when}
                    </strong>
                    <em>{event.title}</em>
                    {outside ? <small>표시 시간 밖</small> : null}
                    {hiddenDay ? <small>표시 요일 밖</small> : null}
                  </span>
                  <button type="button" className="text-btn" onClick={() => deleteEvent(event.id)}>
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </aside>

      <main className="stage">
        <TimetableSheet
          sheetRef={sheetRef}
          title={doc.title || "이번 주 시간표"}
          startHour={doc.startHour}
          endHour={doc.endHour}
          visibleDays={visibleDays}
          events={doc.events}
          onDelete={deleteEvent}
        />
      </main>

      <AdGate open={Boolean(exportFormat)} secondsLeft={secondsLeft} busy={exporting} onCancel={cancelExport} />
    </div>
  )
}
