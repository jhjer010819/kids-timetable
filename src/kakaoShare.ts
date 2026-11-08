const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js"

type KakaoUpload = {
  infos?: { original?: { url?: string } }
}

type KakaoShareApi = {
  uploadImage: (settings: { file: FileList }) => Promise<KakaoUpload>
  sendDefault: (settings: {
    objectType: "feed"
    content: {
      title: string
      description: string
      imageUrl: string
      link: { mobileWebUrl: string; webUrl: string }
    }
    buttons: Array<{ title: string; link: { mobileWebUrl: string; webUrl: string } }>
  }) => void
}

type KakaoSdk = {
  init: (key: string) => void
  isInitialized: () => boolean
  Share: KakaoShareApi
}

declare global {
  interface Window {
    Kakao?: KakaoSdk
  }
}

let loading: Promise<void> | null = null

export function kakaoKey(): string {
  return (import.meta.env.VITE_KAKAO_JS_KEY ?? "").trim()
}

function loadSdk(key: string): Promise<void> {
  if (window.Kakao?.isInitialized()) return Promise.resolve()
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const finish = () => {
        if (!window.Kakao) {
          loading = null
          reject(new Error("카카오 공유 스크립트를 불러오지 못했습니다."))
          return
        }
        if (!window.Kakao.isInitialized()) window.Kakao.init(key)
        resolve()
      }
      if (window.Kakao) {
        finish()
        return
      }
      const found = document.querySelector<HTMLScriptElement>("script[data-kakao-sdk]")
      const script = found ?? document.createElement("script")
      script.async = true
      script.dataset.kakaoSdk = "true"
      script.src = SDK_SRC
      script.onload = () => finish()
      script.onerror = () => {
        loading = null
        reject(new Error("카카오 공유 스크립트를 불러오지 못했습니다."))
      }
      if (!found) document.head.appendChild(script)
    })
  }
  return loading
}

function fileList(image: Blob): FileList {
  const file = new File([image], "timetable.png", { type: "image/png" })
  const transfer = new DataTransfer()
  transfer.items.add(file)
  return transfer.files
}

export async function uploadTimetableImage(image: Blob): Promise<string> {
  const key = kakaoKey()
  if (!key) {
    throw new Error("카카오 JavaScript 키가 없습니다. VITE_KAKAO_JS_KEY를 설정한 뒤 다시 시도해 주세요.")
  }
  await loadSdk(key)
  const uploaded = await window.Kakao!.Share.uploadImage({ file: fileList(image) })
  const url = uploaded.infos?.original?.url
  if (!url) throw new Error("카카오에 시간표 이미지를 올리지 못했습니다.")
  return url
}

export function sendTimetableFeed(imageUrl: string, pageUrl: string): void {
  const link = { mobileWebUrl: pageUrl, webUrl: pageUrl }
  window.Kakao!.Share.sendDefault({
    objectType: "feed",
    content: {
      title: "이번 주 시간표",
      description: "초등 시간표로 만든 학교·방과후 일정",
      imageUrl,
      link,
    },
    buttons: [{ title: "시간표 보기", link }],
  })
}

export function shareErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  if (error && typeof error === "object" && "msg" in error) {
    const msg = (error as { msg?: unknown }).msg
    if (typeof msg === "string" && msg) return msg
  }
  return "카카오톡 공유를 열지 못했습니다. JavaScript 키와 사이트 도메인 등록을 확인해 주세요."
}
