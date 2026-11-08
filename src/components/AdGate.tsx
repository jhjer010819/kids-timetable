type AdGateProps = {
  open: boolean
  secondsLeft: number
  busy: boolean
  onCancel: () => void
}

export function AdGate({ open, secondsLeft, busy, onCancel }: AdGateProps) {
  if (!open) return null

  return (
    <div className="ad-backdrop">
      <div className="ad-card" role="dialog" aria-modal="true" aria-labelledby="ad-title" data-ad-slot="save-image">
        <p className="ad-kicker">AD</p>
        <h2 id="ad-title">이미지를 저장하는 중</h2>
        <p className="ad-copy">저장 전에 전면 광고가 한 번 표시됩니다.</p>
        <div className="ad-unit" aria-hidden="true">
          <span>AdMob / AdSense</span>
        </div>
        <div className="ad-progress" aria-hidden="true">
          <span style={{ width: `${((3 - secondsLeft) / 3) * 100}%` }} />
        </div>
        <p className="ad-count">{busy || secondsLeft === 0 ? "시간표를 파일로 만들고 있습니다." : `${secondsLeft}초 후 저장됩니다.`}</p>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
          취소
        </button>
      </div>
    </div>
  )
}
