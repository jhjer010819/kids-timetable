import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AfterEditor } from "./components/AfterEditor"
import { SchoolEditor } from "./components/SchoolEditor"
import { defaultPlan, type AfterPlan, type SchoolPlan } from "./plan"
import { loadPlan, savePlan } from "./planStorage"

type EditorTab = "school" | "after"

export default function Editor() {
  const [params, setParams] = useSearchParams()
  const tab: EditorTab = params.get("tab") === "school" ? "school" : "after"
  const [plan, setPlan] = useState(loadPlan)

  function selectTab(next: EditorTab) {
    setParams({ tab: next }, { replace: true })
  }

  useEffect(() => {
    savePlan(plan)
  }, [plan])

  function updateSchool(school: SchoolPlan) {
    setPlan((current) => ({ ...current, school }))
  }

  function updateAfter(after: AfterPlan) {
    setPlan((current) => ({ ...current, after }))
  }

  function resetPlan() {
    const ok = window.confirm("입력한 학교와 방과후 일정을 처음 상태로 되돌릴까요?")
    if (!ok) return
    setPlan(defaultPlan())
  }

  return (
    <div className="editor-page">
      <div className="editor-frame">
        <header className="editor-bar">
          <Link className="land-brand" to="/">
            <span className="land-mark">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </span>
            <span>초등 시간표</span>
          </Link>
          <span className="editor-free">100% 무료</span>
        </header>

        <section className="step-make">
          <div className="step-lead">
            <h1>시간표 만들기</h1>
            <p>학교와 방과후 분단위 스케줄, 한 장으로 끝!</p>
          </div>

          <div className="step-work">
        <div className="mode-tabs" role="tablist" aria-label="일정 종류">
          <button
            type="button"
            role="tab"
            id="tab-school"
            aria-selected={tab === "school"}
            aria-controls="panel-school"
            className={tab === "school" ? "mode-tab is-on" : "mode-tab"}
            onClick={() => selectTab("school")}
          >
            <span aria-hidden="true">🏫</span>
            학교
          </button>
          <button
            type="button"
            role="tab"
            id="tab-after"
            aria-selected={tab === "after"}
            aria-controls="panel-after"
            className={tab === "after" ? "mode-tab is-on" : "mode-tab"}
            onClick={() => selectTab("after")}
          >
            <span aria-hidden="true">🎒</span>
            방과후
          </button>
        </div>

        <div
          role="tabpanel"
          id={tab === "school" ? "panel-school" : "panel-after"}
          aria-labelledby={tab === "school" ? "tab-school" : "tab-after"}
        >
          {tab === "school" ? (
            <SchoolEditor school={plan.school} onChange={updateSchool} />
          ) : (
            <AfterEditor after={plan.after} onChange={updateAfter} />
          )}
        </div>

        <div className="editor-dock">
          <button type="button" className="reset-plan" onClick={resetPlan}>
            기본값으로 되돌리기
          </button>
        </div>
          </div>
        </section>
      </div>

      <div className="editor-preview-dock">
        <Link className="editor-preview" to={`/preview?tab=${tab}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>시간표 미리보기</span>
        </Link>
      </div>
    </div>
  )
}
