import { addMinutes, toMinutes } from "./time"
import { DAYS, WEEKDAYS, orderedDays, type DayId, type TimetableEvent } from "./types"

export type SlotKind = "period" | "break" | "lunch"

export type SchoolSlot = {
  id: string
  kind: SlotKind
  label: string
  startTime: string
  endTime: string
  subject: string
  subjects: Partial<Record<DayId, string>>
  days: DayId[]
}

export const SUBJECT_PRESETS = [
  "국어",
  "수학",
  "사회",
  "창체",
  "과학",
  "영어",
  "실과",
  "음악",
  "미술",
  "체육",
  "동아리",
  "안전",
  "통합교과",
] as const

export const GRADE_SUBJECTS = [
  {
    id: "grade-1",
    label: "1학년 통합교과",
    names: ["학교", "사람들", "우리나라", "탐험", "하루", "약속", "상상", "이야기"],
  },
  {
    id: "grade-2",
    label: "2학년 통합교과",
    names: ["나", "자연", "마을", "세계", "계절", "인물", "물건", "기억"],
  },
] as const

/** Soft tints from the same lavender, pink, green, and warm family. Dark text stays readable. */
const SUBJECT_COLORS: Record<string, string> = {
  국어: "#f6c2d4",
  수학: "#d4cffc",
  창체: "#ffe3b3",
  사회: "#f8d0bc",
  과학: "#c8edc4",
  도덕: "#e6d4fb",
  영어: "#cdd6fb",
  음악: "#f7c6e4",
  미술: "#ffd4b8",
  체육: "#bfe8c8",
  실과: "#f3dcc4",
  "바른 생활": "#f4d0e6",
  "슬기로운 생활": "#d5e4fb",
  "즐거운 생활": "#e4f0bc",
  안전: "#ffd0cc",
  동아리: "#e7c8f6",
  통합교과: "#d9e7c8",
  학교: "#f8d4c8",
  사람들: "#f3c4d8",
  우리나라: "#f6e0b8",
  탐험: "#c8e4f6",
  하루: "#f7e6c4",
  약속: "#e4d4f8",
  상상: "#f8d0e4",
  이야기: "#d4f0e0",
  나: "#f6c8c4",
  자연: "#c8ecc8",
  마을: "#ffe0c4",
  세계: "#d0d8fb",
  계절: "#e8f0b8",
  인물: "#f4cce0",
  물건: "#e8d4c4",
  기억: "#dcc8f4",
}

const SUBJECT_FALLBACK = Object.values(SUBJECT_COLORS)

export function subjectColor(name: string): string {
  const known = SUBJECT_COLORS[name]
  if (known) return known
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return SUBJECT_FALLBACK[hash % SUBJECT_FALLBACK.length]
}

export type SchoolPlan = {
  skipped: boolean
  arrivalTime: string
  slots: SchoolSlot[]
}

export const AFTER_CATEGORIES = ["학원", "휴식", "픽업", "이동", "방과후", "돌봄", "늘봄", "기타"] as const
export type AfterCategory = (typeof AFTER_CATEGORIES)[number]

export const AFTER_ICON: Record<AfterCategory, string> = {
  학원: "✏️",
  휴식: "☕",
  픽업: "🚌",
  이동: "🚶",
  방과후: "🎒",
  돌봄: "🏠",
  늘봄: "🌱",
  기타: "📌",
}

export type AfterItem = {
  id: string
  category: AfterCategory
  name: string
  startTime: string
  endTime: string
  days: DayId[]
}

export type AfterPlan = {
  skipped: boolean
  items: AfterItem[]
}

export type EditorPlan = {
  school: SchoolPlan
  after: AfterPlan
}

export const SLOT_TONE: Record<SlotKind, { block: string; text: string }> = {
  period: { block: "#72d562", text: "#241c3a" },
  break: { block: "#b9a4ff", text: "#241c3a" },
  lunch: { block: "#f7a722", text: "#241c3a" },
}

const AFTER_COLOR: Record<AfterCategory, string> = {
  학원: "#7e61ed",
  휴식: "#b9a4ff",
  픽업: "#f0346e",
  이동: "#38bdf8",
  방과후: "#72d562",
  돌봄: "#f7a722",
  늘봄: "#b9a4ff",
  기타: "#6749de",
}

export function afterColor(category: AfterCategory): string {
  return AFTER_COLOR[category]
}

function slot(
  id: string,
  kind: SlotKind,
  label: string,
  startTime: string,
  endTime: string,
): SchoolSlot {
  return { id, kind, label, startTime, endTime, subject: "", subjects: {}, days: [...WEEKDAYS] }
}

export function defaultPlan(): EditorPlan {
  return {
    school: {
      skipped: false,
      arrivalTime: "08:40",
      slots: [
        slot("slot-1", "period", "1교시", "08:50", "09:30"),
        slot("slot-2", "period", "2교시", "09:40", "10:20"),
        slot("slot-3", "break", "쉬는 시간", "10:20", "10:30"),
        slot("slot-4", "period", "3교시", "10:40", "11:10"),
        slot("slot-5", "lunch", "점심시간", "11:20", "12:10"),
        slot("slot-6", "period", "4교시", "12:10", "12:40"),
      ],
    },
    after: {
      skipped: false,
      items: [
        {
          id: "after-1",
          category: "픽업",
          name: "정문 픽업",
          startTime: "14:00",
          endTime: "14:00",
          days: [...WEEKDAYS],
        },
        {
          id: "after-2",
          category: "학원",
          name: "태권도",
          startTime: "14:00",
          endTime: "15:00",
          days: [...WEEKDAYS],
        },
        {
          id: "after-3",
          category: "학원",
          name: "미술",
          startTime: "15:00",
          endTime: "16:00",
          days: ["Tue", "Thu"],
        },
      ],
    },
  }
}

export function daySubject(item: SchoolSlot, day: DayId): string {
  const named = item.subjects?.[day]?.trim() ?? ""
  if (named) return named
  const hasMap = !!item.subjects && Object.values(item.subjects).some((name) => name?.trim())
  if (!hasMap && item.subject?.trim() && item.days.includes(day)) return item.subject.trim()
  return ""
}

/** Days the period actually runs, including a day that already has a subject. */
export function activeDays(item: SchoolSlot): DayId[] {
  const named = Object.keys(item.subjects ?? {}).filter(isDayId)
  return orderedDays([...item.days, ...named])
}

export function slotTitle(item: SchoolSlot, day: DayId): string {
  return daySubject(item, day) || item.label.trim() || "교시"
}

export function slotColor(item: SchoolSlot, day?: DayId): string {
  if (item.kind === "period" && day) {
    const name = daySubject(item, day)
    if (name) return subjectColor(name)
  }
  return SLOT_TONE[item.kind].block
}

export function createSlot(kind: SlotKind, slots: SchoolSlot[]): SchoolSlot {
  const last = slots[slots.length - 1]
  const startTime = last?.endTime || "09:00"
  const duration = kind === "break" ? 10 : kind === "lunch" ? 50 : 40
  const periodCount = slots.filter((item) => item.kind === "period").length + 1
  const label = kind === "period" ? `${periodCount}교시` : kind === "lunch" ? "점심시간" : "쉬는 시간"
  return slot(crypto.randomUUID(), kind, label, startTime, addMinutes(startTime, duration))
}

export function createAfterItem(): AfterItem {
  return {
    id: crypto.randomUUID(),
    category: "학원",
    name: "",
    startTime: "15:00",
    endTime: "16:00",
    days: [...WEEKDAYS],
  }
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction
  if (next < 0 || next >= items.length) return items
  const copy = [...items]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

export function isValidRange(startTime: string, endTime: string): boolean {
  return toMinutes(endTime) > toMinutes(startTime)
}

export type SheetModel = {
  title: string
  events: TimetableEvent[]
  visibleDays: DayId[]
  startHour: number
  endHour: number
}

export function toSheetModel(plan: EditorPlan): SheetModel {
  const events: TimetableEvent[] = []
  const days = new Set<DayId>()

  if (!plan.school.skipped) {
    const schoolDays = new Set<DayId>()
    for (const item of plan.school.slots) {
      if (!isValidRange(item.startTime, item.endTime)) continue
      for (const day of activeDays(item)) {
        schoolDays.add(day)
        days.add(day)
        events.push({
          id: `${item.id}-${day}`,
          type: "range",
          day,
          startTime: item.startTime,
          endTime: item.endTime,
          title: slotTitle(item, day),
          color: slotColor(item, day),
        })
      }
    }
    const arrivalDays = schoolDays.size > 0 ? orderedDays([...schoolDays]) : [...WEEKDAYS]
    for (const day of arrivalDays) {
      days.add(day)
      events.push({
        id: `arrival-${day}`,
        type: "point",
        day,
        time: plan.school.arrivalTime,
        title: "등교",
        icon: "🏫",
        color: "#f0346e",
      })
    }
  }

  if (!plan.after.skipped) {
    for (const item of plan.after.items) {
      const title = item.name.trim() || item.category
      for (const day of orderedDays(item.days)) {
        days.add(day)
        if (item.category === "픽업") {
          events.push({
            id: `${item.id}-${day}`,
            type: "point",
            day,
            time: item.startTime,
            title,
            icon: "🚌",
            color: AFTER_COLOR.픽업,
          })
          continue
        }
        if (!isValidRange(item.startTime, item.endTime)) continue
        events.push({
          id: `${item.id}-${day}`,
          type: "range",
          day,
          startTime: item.startTime,
          endTime: item.endTime,
          title,
          color: AFTER_COLOR[item.category],
        })
      }
    }
  }

  const visibleDays = orderedDays([...days])
  const shownDays = visibleDays.length > 0 ? visibleDays : [...WEEKDAYS]
  let min = 8 * 60
  let max = 16 * 60
  if (events.length > 0) {
    min = 24 * 60
    max = 0
    for (const event of events) {
      if (event.type === "point") {
        const time = toMinutes(event.time)
        min = Math.min(min, time)
        max = Math.max(max, time)
      } else {
        min = Math.min(min, toMinutes(event.startTime))
        max = Math.max(max, toMinutes(event.endTime))
      }
    }
  }
  let startHour = Math.max(0, Math.floor(min / 60))
  let endHour = Math.min(23, Math.max(startHour + 1, Math.ceil(max / 60)))
  if (endHour === startHour) endHour = Math.min(23, startHour + 1)

  return {
    title: "이번 주 시간표",
    events,
    visibleDays: shownDays,
    startHour,
    endHour,
  }
}

export function isAfterCategory(value: unknown): value is AfterCategory {
  return typeof value === "string" && (AFTER_CATEGORIES as readonly string[]).includes(value)
}

export function isSlotKind(value: unknown): value is SlotKind {
  return value === "period" || value === "break" || value === "lunch"
}

export function isDayId(value: unknown): value is DayId {
  return typeof value === "string" && (DAYS as readonly string[]).includes(value)
}
