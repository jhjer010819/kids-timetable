import {
  defaultPlan,
  isAfterCategory,
  isDayId,
  isSlotKind,
  type AfterItem,
  type AfterPlan,
  type EditorPlan,
  type SchoolPlan,
  type SchoolSlot,
} from "./plan"
import { orderedDays, type DayId } from "./types"

const STORAGE_KEY = "kids-timetable.plan.v2"
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function isTime(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value)
}

function readDays(value: unknown) {
  if (!Array.isArray(value)) return orderedDays([])
  const days = orderedDays(value.filter(isDayId))
  return days.length > 0 ? days : orderedDays(["Mon", "Tue", "Wed", "Thu", "Fri"])
}

function readSubjects(value: unknown, days: DayId[], legacy: string): Partial<Record<DayId, string>> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const subjects: Partial<Record<DayId, string>> = {}
    for (const [key, name] of Object.entries(value as Record<string, unknown>)) {
      if (!isDayId(key) || typeof name !== "string" || !name.trim()) continue
      subjects[key] = name.trim()
    }
    return subjects
  }
  if (!legacy) return {}
  return Object.fromEntries(days.map((day) => [day, legacy]))
}

function readSlot(value: unknown): SchoolSlot | null {
  if (!value || typeof value !== "object") return null
  const slot = value as Record<string, unknown>
  if (typeof slot.id !== "string" || !isSlotKind(slot.kind)) return null
  if (!isTime(slot.startTime) || !isTime(slot.endTime)) return null
  const days = readDays(slot.days)
  const legacy = typeof slot.subject === "string" ? slot.subject.trim() : ""
  const subjects = readSubjects(slot.subjects, days, legacy)
  const named = orderedDays(Object.keys(subjects).filter(isDayId))
  return {
    id: slot.id,
    kind: slot.kind,
    label: typeof slot.label === "string" && slot.label.trim() ? slot.label : "교시",
    startTime: slot.startTime,
    endTime: slot.endTime,
    subject: "",
    subjects,
    days: orderedDays([...days, ...named]),
  }
}

function readAfterItem(value: unknown): AfterItem | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>
  if (typeof item.id !== "string" || !isAfterCategory(item.category)) return null
  if (!isTime(item.startTime) || !isTime(item.endTime)) return null
  return {
    id: item.id,
    category: item.category,
    name: typeof item.name === "string" ? item.name : "",
    startTime: item.startTime,
    endTime: item.endTime,
    days: readDays(item.days),
  }
}

function readSchool(value: unknown, fallback: SchoolPlan): SchoolPlan {
  if (!value || typeof value !== "object") return fallback
  const school = value as Record<string, unknown>
  const slots = Array.isArray(school.slots) ? school.slots.map(readSlot).filter((slot) => slot !== null) : fallback.slots
  return {
    skipped: school.skipped === true,
    arrivalTime: isTime(school.arrivalTime) ? school.arrivalTime : fallback.arrivalTime,
    slots,
  }
}

function readAfter(value: unknown, fallback: AfterPlan): AfterPlan {
  if (!value || typeof value !== "object") return fallback
  const after = value as Record<string, unknown>
  const items = Array.isArray(after.items) ? after.items.map(readAfterItem).filter((item) => item !== null) : fallback.items
  return {
    skipped: after.skipped === true,
    items,
  }
}

export function loadPlan(): EditorPlan {
  const fallback = defaultPlan()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return fallback
    const saved = parsed as Record<string, unknown>
    return {
      school: readSchool(saved.school, fallback.school),
      after: readAfter(saved.after, fallback.after),
    }
  } catch {
    return fallback
  }
}

export function savePlan(plan: EditorPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
}
