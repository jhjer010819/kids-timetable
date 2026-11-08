import type { ReactNode, SVGProps } from "react"
import { Link } from "react-router-dom"

const BENEFITS = [
  { icon: "zap", label: "3초 만에 생성", tone: "amber" },
  { icon: "message", label: "카톡 공유 가능", tone: "emerald" },
  { icon: "shield", label: "회원가입 없이 사용", tone: "indigo" },
] as const

const REVIEWS = [
  {
    quote: "학원 셔틀 시간 겹쳐서 매번 헷갈렸는데 한 장으로 정리하니 남편이랑 공유하기도 너무 편해요!",
    name: "김*희 님",
    grade: "초1 학부모",
  },
  {
    quote: "아이한테 말로 설명하는 것보다 프린트해서 냉장고에 붙여주니 스스로 시간 보고 움직이네요.",
    name: "박*은 님",
    grade: "초2 학부모",
  },
  {
    quote: "분 단위로 조정할 수 있는 시간표가 없어서 매번 엑셀로 만드느라 힘들었는데, 이 서비스로 해결했어요!",
    name: "이*진 님",
    grade: "초1 학부모",
  },
] as const

function Icon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
    )
  }
  if (name === "sparkles") {
    return (
      <svg {...common}>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
        <path d="M4 17v2" />
        <path d="M5 18H3" />
      </svg>
    )
  }
  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    )
  }
  if (name === "zap") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
      </svg>
    )
  }
  if (name === "message") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    )
  }
  if (name === "shield") {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
      </svg>
    )
  }
  return (
    <svg {...common} fill="currentColor" stroke="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function StartLink({ children, className }: { children: ReactNode; className: string }) {
  return (
    <Link className={className} to="/create">
      <span>{children}</span>
      <Icon name="arrow" className="land-arrow" />
    </Link>
  )
}

export default function Landing() {
  return (
    <div className="landing">
      <header className="land-bar">
        <Link className="land-brand" to="/">
          <span className="land-mark">
            <Icon name="calendar" />
          </span>
          <span>초등 시간표</span>
        </Link>
        <span className="land-free">100% 무료</span>
      </header>

      <main className="land-hero">
        <p className="land-badge">
          <Icon name="sparkles" />
          <span>초등 학부모 전용 스케줄러</span>
        </p>
        <h1>
          복잡한 학원·셔틀 일정,
          <br />
          <span className="land-gradient">한 장으로 끝.</span>
        </h1>
        <p className="land-copy">
          학교, 방과후, 학원, 셔틀 시간까지.
          <br className="land-break" /> 우리 아이의 하루를 한눈에 보이는 시간표로 깔끔하게 정리해 보세요.
        </p>
        <div className="land-cta-wrap">
          <StartLink className="land-cta">내 아이 시간표 만들기</StartLink>
        </div>
        <ul className="land-benefits">
          {BENEFITS.map((item) => (
            <li key={item.label}>
              <Icon name={item.icon} className={`land-benefit-icon is-${item.tone}`} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </main>

      <section className="land-reviews" aria-labelledby="reviews-title">
        <div className="land-reviews-inner">
          <div className="land-reviews-head">
            <span className="land-eyebrow">Real Reviews</span>
            <h2 id="reviews-title">선배 학부모님들의 솔직한 후기</h2>
            <p>복잡한 일상 속, 작은 시간표 한 장이 가져온 변화를 경험해보세요.</p>
          </div>
          <ul className="land-review-grid">
            {REVIEWS.map((review) => (
              <li key={review.name} className="land-review">
                <div>
                  <div className="land-stars" aria-label="별 5개">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Icon key={index} name="star" />
                    ))}
                  </div>
                  <p>“{review.quote}”</p>
                </div>
                <div className="land-review-foot">
                  <span>{review.name}</span>
                  <span>{review.grade}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="land-reviews-cta">
            <StartLink className="land-cta is-compact">지금 바로 시간표 만들기</StartLink>
          </div>
        </div>
      </section>

      <footer className="land-foot">© 2026 초등시간표. All rights reserved.</footer>
    </div>
  )
}
