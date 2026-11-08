import { useEffect, useState } from "react"
import { parseTimeInput } from "../time"

type TimeFieldProps = {
  value: string
  onChange: (value: string) => void
  label: string
}

export function TimeField({ value, onChange, label }: TimeFieldProps) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(value)
  }, [focused, value])

  function commit(raw: string) {
    const next = parseTimeInput(raw)
    if (!next) {
      setDraft(value)
      return
    }
    setDraft(next)
    if (next !== value) onChange(next)
  }

  return (
    <input
      className="slot-time"
      type="text"
      inputMode="numeric"
      enterKeyHint="done"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label={label}
      value={focused ? draft : value}
      onFocus={(event) => {
        setFocused(true)
        setDraft(value)
        event.currentTarget.select()
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        setFocused(false)
        commit(event.currentTarget.value)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
    />
  )
}
