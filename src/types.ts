export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

export type DayId = (typeof DAYS)[number]

export const WEEKDAYS: DayId[] = ["Mon", "Tue", "Wed", "Thu", "Fri"]

export function orderedDays(selected: readonly DayId[]): DayId[] {
  return DAYS.filter((day) => selected.includes(day))
}

export const DAY_LABEL: Record<DayId, string> = {
  Mon: "월",
  Tue: "화",
  Wed: "수",
  Thu: "목",
  Fri: "금",
  Sat: "토",
  Sun: "일",
}

export type RangeEvent = {
  id: string
  type: "range"
  day: DayId
  startTime: string
  endTime: string
  title: string
  color: string
}

export type PointEvent = {
  id: string
  type: "point"
  day: DayId
  time: string
  title: string
  icon: string
  color: string
}

export type TimetableEvent = RangeEvent | PointEvent

export type EventType = TimetableEvent["type"]

export const RANGE_COLORS = ["#daf5d6", "#e4d9ff", "#ffe3b8", "#ffd6e4", "#d7c8ff", "#c8f0c4"]
export const POINT_COLORS = ["#f0346e", "#7e61ed", "#f7a722", "#72d562", "#6749de"]
export const POINT_ICONS = ["🏫", "🚌", "⏰", "💊", "📍", "🍽️", "📚", "⚽"]
