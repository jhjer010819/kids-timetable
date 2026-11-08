import { toBlob, toPng } from "html-to-image"
import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { presentInterstitial } from "./ads"
import { AdGate } from "./components/AdGate"
import { BrandMark } from "./components/BrandMark"
import { TimetableSheet } from "./components/TimetableSheet"
import { kakaoKey, sendTimetableFeed, shareErrorMessage, uploadTimetableImage } from "./kakaoShare"
import { toSheetModel } from "./plan"
import { loadPlan } from "./planStorage"

const captureOptions = {
  pixelRatio: 3,
  backgroundColor: "#ffffff",
  skipFonts: true,
  cacheBust: false,
}

function fileSlug(title: string): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]/g, "")
  return cleaned || "kids-timetable"
}

function sharePageUrl(): string {
  return `${window.location.origin}/`
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function TalkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

export default function Preview() {
  const [params] = useSearchParams()
  const tab = params.get("tab") === "after" ? "after" : "school"
  const plan = loadPlan()
  const sheet = toSheetModel(plan)
  const [exporting, setExporting] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const imageUrlRef = useRef<string | null>(null)
  const exportLock = useRef(false)

  useEffect(() => {
    if (!exporting || secondsLeft <= 0) return
    const id = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000)
    return () => window.clearTimeout(id)
  }, [exporting, secondsLeft])

  useEffect(() => {
    if (!exporting || secondsLeft > 0) return
    const node = sheetRef.current
    if (!node || exportLock.current) return

    exportLock.current = true
    setSaving(true)
    node.classList.add("is-capturing")

    toPng(node, captureOptions)
      .then((dataUrl) => {
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `${fileSlug(sheet.title)}.png`
        link.click()
        setExporting(false)
      })
      .catch(() => {
        setExportError("이미지를 저장하지 못했습니다. 다시 시도해 주세요.")
        setExporting(false)
      })
      .finally(() => {
        node.classList.remove("is-capturing")
        exportLock.current = false
        setSaving(false)
      })
  }, [exporting, secondsLeft, sheet.title])

  useEffect(() => {
    if (!kakaoKey()) return
    const node = sheetRef.current
    if (!node) return
    let cancelled = false
    const id = window.setTimeout(() => {
      node.classList.add("is-capturing")
      void toBlob(node, captureOptions)
        .then((blob) => (blob ? uploadTimetableImage(blob) : Promise.reject(new Error("empty"))))
        .then((url) => {
          if (!cancelled) imageUrlRef.current = url
        })
        .catch(() => undefined)
        .finally(() => {
          if (!exportLock.current) node.classList.remove("is-capturing")
        })
    }, 500)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [])

  function askExport() {
    if (exporting || saving || sharing) return
    setExportError(null)
    setSecondsLeft(3)
    setExporting(true)
    void presentInterstitial("save-image")
  }

  function cancelExport() {
    if (saving) return
    setExporting(false)
    setSecondsLeft(3)
  }

  function shareKakao() {
    if (exporting || saving || sharing || exportLock.current) return
    setExportError(null)
    const ready = imageUrlRef.current
    const pageUrl = sharePageUrl()
    if (ready && window.Kakao?.isInitialized()) {
      try {
        sendTimetableFeed(ready, pageUrl)
      } catch (error) {
        setExportError(shareErrorMessage(error))
      }
      return
    }

    const node = sheetRef.current
    if (!node) return
    exportLock.current = true
    setSharing(true)
    node.classList.add("is-capturing")
    void toBlob(node, captureOptions)
      .then((blob) => {
        if (!blob) throw new Error("시간표 이미지를 만들지 못했습니다.")
        return uploadTimetableImage(blob)
      })
      .then((url) => {
        imageUrlRef.current = url
        sendTimetableFeed(url, pageUrl)
      })
      .catch((error: unknown) => setExportError(shareErrorMessage(error)))
      .finally(() => {
        node.classList.remove("is-capturing")
        exportLock.current = false
        setSharing(false)
      })
  }

  const busy = exporting || saving || sharing
  const editTo = `/create?tab=${tab}`

  return (
    <div className="preview-page">
      <div className="preview-frame">
        <header className="editor-bar">
          <Link className="land-brand" to="/">
            <BrandMark />
          </Link>
          <span className="editor-free">100% 무료</span>
        </header>

        <div className="editor-title">
          <h1>이번 주 시간표</h1>
          <Link className="editor-preview" to={editTo}>
            <EditIcon />
            <span>시간표 편집하기</span>
          </Link>
          <div className="title-actions">
            <button type="button" className="pv-btn is-png" disabled={busy} onClick={askExport}>
              <DownloadIcon />
              <span>PNG 저장</span>
            </button>
            <button type="button" className="pv-btn is-kakao" disabled={busy} onClick={shareKakao}>
              <TalkIcon />
              <span>{sharing ? "준비 중" : "카톡 공유"}</span>
            </button>
          </div>
        </div>

        {exportError ? <p className="export-error">{exportError}</p> : null}
        {sheet.events.length === 0 ? (
          <p className="preview-note">넣은 일정이 없습니다. 편집하기에서 학교나 방과후를 채워 주세요.</p>
        ) : null}

        <div className="preview-board">
          <div className="preview-scroll">
            <TimetableSheet
              sheetRef={sheetRef}
              title={sheet.title}
              startHour={sheet.startHour}
              endHour={sheet.endHour}
              visibleDays={sheet.visibleDays}
              events={sheet.events}
            />
          </div>
        </div>
      </div>

      <div className="preview-dock">
        <Link className="pv-btn is-edit" to={editTo}>
          <EditIcon />
          <span>수정</span>
        </Link>
        <button type="button" className="pv-btn is-kakao" disabled={busy} onClick={shareKakao}>
          <TalkIcon />
          <span>{sharing ? "준비 중" : "카톡 공유"}</span>
        </button>
        <button type="button" className="pv-btn is-png" disabled={busy} onClick={askExport}>
          <DownloadIcon />
          <span>이미지 저장</span>
        </button>
      </div>

      <AdGate open={exporting} secondsLeft={secondsLeft} busy={saving} onCancel={cancelExport} />
    </div>
  )
}
