import { DEFAULT_TITLE, SAMPLE_EVENTS } from "./sampleEvents"
import { DAYS, orderedDays, type DayId, type TimetableEvent } from "./types"

const STORAGE_KEY = "kids-timetable.v1"
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export type PersistedTimetable = {
  title: string
  startHour: number
  endHour: number
  visibleDays: DayId[]
  events: TimetableEvent[]
}

export function defaultTimetable(): PersistedTimetable {
  return {
    title: DEFAULT_TITLE,
    startHour: 7,
    endHour: 21,
    visibleDays: [...DAYS],
    events: SAMPLE_EVENTS,
  }
}

function isDay(value: unknown): value is DayId {
  return typeof value === "string" && (DAYS as readonly string[]).includes(value)
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value)
}

function isEvent(value: unknown): value is TimetableEvent {
  if (!value || typeof value !== "object") return false
  const event = value as Record<string, unknown>
  if (typeof event.id !== "string" || !isDay(event.day) || typeof event.title !== "string") return false
  if (typeof event.color !== "string" || !event.color.startsWith("#")) return false
  if (event.type === "range") return isTime(event.startTime) && isTime(event.endTime)
  if (event.type === "point") return isTime(event.time) && typeof event.icon === "string"
  return false
}

function readHour(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback
}

function readVisibleDays(value: unknown): DayId[] {
  if (!Array.isArray(value)) return [...DAYS]
  const days = orderedDays(value.filter(isDay))
  return days.length > 0 ? days : [...DAYS]
}

export function loadTimetable(): PersistedTimetable {
  const fallback = defaultTimetable()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return fallback
    const saved = parsed as Record<string, unknown>
    if (!Array.isArray(saved.events)) return fallback
    const startHour = readHour(saved.startHour, fallback.startHour)
    let endHour = readHour(saved.endHour, fallback.endHour)
    if (endHour <= startHour) endHour = Math.min(23, startHour + 1)
    const title = typeof saved.title === "string" && saved.title.trim() ? saved.title : fallback.title
    return {
      title,
      startHour,
      endHour,
      visibleDays: readVisibleDays(saved.visibleDays),
      events: saved.events.filter(isEvent),
    }
  } catch {
    return fallback
  }
}

export function saveTimetable(state: PersistedTimetable): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
