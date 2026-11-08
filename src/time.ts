import type { PointEvent, RangeEvent, TimetableEvent } from "./types"

export const PX_PER_MINUTE = 2
const NEAR_MINUTES = 20
const BADGE_BLOCK = 52

export function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

export function addMinutes(value: string, amount: number): string {
  const total = Math.max(0, Math.min(23 * 60 + 59, toMinutes(value) + amount))
  const hour = Math.floor(total / 60)
  const minute = total % 60
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function parseTimeInput(raw: string): string | null {
  const compact = raw.trim().toLowerCase().replace(/\s+/g, "")
  if (!compact) return null
  let meridiem: "am" | "pm" | null = null
  let body = compact
  if (/(오전|am)$/.test(body)) {
    meridiem = "am"
    body = body.replace(/(오전|am)$/, "")
  } else if (/(오후|pm)$/.test(body)) {
    meridiem = "pm"
    body = body.replace(/(오후|pm)$/, "")
  }
  body = body.replace(/[^\d:]/g, "")
  if (!body) return null

  let hour = 0
  let minute = 0
  if (body.includes(":")) {
    const [hourText, minuteText, extra] = body.split(":")
    if (extra !== undefined || !hourText || minuteText === undefined || minuteText.length === 0) return null
    hour = Number(hourText)
    minute = Number(minuteText)
  } else if (body.length <= 2) {
    hour = Number(body)
    minute = 0
  } else if (body.length === 3) {
    hour = Number(body.slice(0, 1))
    minute = Number(body.slice(1))
  } else if (body.length === 4) {
    hour = Number(body.slice(0, 2))
    minute = Number(body.slice(2))
  } else {
    return null
  }

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) return null
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    if (meridiem === "am") hour = hour === 12 ? 0 : hour
    else hour = hour === 12 ? 12 : hour + 12
  }
  if (hour > 23) return null
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function boardHeight(startHour: number, endHour: number): number {
  return (endHour - startHour) * 60 * PX_PER_MINUTE
}

export function yAt(time: string, startHour: number): number {
  return (toMinutes(time) - startHour * 60) * PX_PER_MINUTE
}

export function eventStartMinutes(event: TimetableEvent): number {
  return toMinutes(event.type === "point" ? event.time : event.startTime)
}

export function eventIntersectsBoard(
  event: TimetableEvent,
  startHour: number,
  endHour: number,
): boolean {
  const open = startHour * 60
  const close = endHour * 60
  if (event.type === "point") {
    const time = toMinutes(event.time)
    return time >= open && time <= close
  }
  return toMinutes(event.endTime) > open && toMinutes(event.startTime) < close
}

export type LabelPlacement = {
  shiftY: number
  align: "start" | "end"
  /** above: badge bottom sits on the time line. below: badge top sits on the line. */
  anchor: "above" | "below"
}

function rangesOf(events: TimetableEvent[]): RangeEvent[] {
  return events.filter((event): event is RangeEvent => event.type === "range")
}

function preferredPlacement(point: PointEvent, dayEvents: TimetableEvent[]): LabelPlacement {
  const time = toMinutes(point.time)
  const ranges = rangesOf(dayEvents)
  const containing = ranges.find((range) => {
    const start = toMinutes(range.startTime)
    const end = toMinutes(range.endTime)
    return time >= start && time <= end
  })

  if (containing) {
    const start = toMinutes(containing.startTime)
    const end = toMinutes(containing.endTime)
    const fromStart = time - start
    const fromEnd = end - time
    if (fromStart <= fromEnd && fromStart <= NEAR_MINUTES) {
      return { shiftY: -(fromStart * PX_PER_MINUTE), align: "start", anchor: "above" }
    }
    if (fromEnd <= NEAR_MINUTES) {
      return { shiftY: fromEnd * PX_PER_MINUTE, align: "start", anchor: "below" }
    }
    return { shiftY: 0, align: "end", anchor: "above" }
  }

  const nearEnd = ranges.some((range) => {
    const gap = time - toMinutes(range.endTime)
    return gap >= 0 && gap <= NEAR_MINUTES
  })
  const nearStart = ranges.some((range) => {
    const gap = toMinutes(range.startTime) - time
    return gap > 0 && gap <= NEAR_MINUTES
  })
  if (nearEnd && !nearStart) return { shiftY: 0, align: "start", anchor: "below" }
  return { shiftY: 0, align: "start", anchor: "above" }
}

function badgeTop(item: { y: number; shiftY: number; anchor: "above" | "below" }): number {
  return item.anchor === "above" ? item.y - BADGE_BLOCK + item.shiftY : item.y + item.shiftY
}

export function layoutPointLabels(
  dayEvents: TimetableEvent[],
  startHour: number,
  endHour: number,
): Map<string, LabelPlacement> {
  const placed = dayEvents
    .filter((event): event is PointEvent => event.type === "point")
    .map((point) => ({
      id: point.id,
      y: yAt(point.time, startHour),
      ...preferredPlacement(point, dayEvents),
    }))
    .sort((a, b) => badgeTop(a) - badgeTop(b))

  for (let index = 1; index < placed.length; index += 1) {
    const previous = placed[index - 1]
    const current = placed[index]
    const previousBottom = badgeTop(previous) + BADGE_BLOCK
    const top = badgeTop(current)
    if (top < previousBottom + 4) current.shiftY += previousBottom + 4 - top
  }

  const height = boardHeight(startHour, endHour)
  const map = new Map<string, LabelPlacement>()
  for (const item of placed) {
    const minTop = 2
    const maxTop = Math.max(minTop, height - BADGE_BLOCK)
    const top = Math.min(maxTop, Math.max(minTop, badgeTop(item)))
    const shiftY = item.anchor === "above" ? top - (item.y - BADGE_BLOCK) : top - item.y
    map.set(item.id, { shiftY, align: item.align, anchor: item.anchor })
  }
  return map
}

export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace("#", "")
  const full = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  const num = Number.parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

export function isDark(hex: string): boolean {
  const rgb = parseHex(hex)
  if (!rgb) return false
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 < 0.62
}
