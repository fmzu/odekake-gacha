import { useCallback, useRef, useState } from "react"
import { fallbackRandomSpot } from "@/lib/fallback-random-spot"
import { fallbackRandomStation } from "@/lib/fallback-random-station"
import type {
  FilterOptions,
  GachaResult,
  GachaSequenceState,
  Mode,
} from "@/lib/types"

// 演出時間の固定値（ミリ秒）
const DRAWING_DURATION_MS = 500
const WAITING_MIN_DURATION_MS = 1000
const EXTRACTING_DURATION_MS = 1500
const REVEALING_DURATION_MS = 1200

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useGachaDraw(mode: Mode, filter: FilterOptions) {
  const [sequence, setSequence] = useState<GachaSequenceState>("idle")
  const [result, setResult] = useState<GachaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runningRef = useRef(false)

  const handleDraw = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setResult(null)
    setError(null)

    // API fetch をボタンタップと同時に裏で開始
    const fetchPromise: Promise<GachaResult> =
      mode === "station"
        ? fallbackRandomStation(filter).then(({ station }) => station)
        : fallbackRandomSpot(filter).then(({ spot }) => spot)

    // fetch の結果を settled ラップで監視する（API 遅延検知用）
    let fetched: GachaResult | null = null
    let fetchError: unknown = null
    let settled = false
    const trackedFetch = fetchPromise.then(
      (r) => {
        fetched = r
        settled = true
        return r
      },
      (err) => {
        fetchError = err
        settled = true
        throw err
      },
    )
    // unhandled rejection を防ぐ
    trackedFetch.catch(() => {})

    try {
      // 1. 引き始め段階（固定 0.5s）— 飛行機が空を横切る演出開始
      setSequence("drawing")
      await sleep(DRAWING_DURATION_MS)

      // 2. waiting: API resolve を待つ。飛行機がループしながら空を横切り続ける
      //    最低 WAITING_MIN_DURATION_MS は必ず待つ
      setSequence("waiting")
      await sleep(WAITING_MIN_DURATION_MS)
      while (!settled) {
        await sleep(100)
      }

      if (fetchError || !fetched) {
        throw fetchError ?? new Error("no result")
      }

      // 3. extracting: 封筒が空から舞い降りてくる（固定 1.5s）
      setSequence("extracting")
      await sleep(EXTRACTING_DURATION_MS)

      // 4. revealing: 封筒が開きチケットへ展開（固定 1.2s）
      setResult(fetched)
      setSequence("revealing")
      await sleep(REVEALING_DURATION_MS)

      // 5. 完了
      setSequence("done")
    } catch {
      setError(
        "サーバーに接続できませんでした。しばらくしてからお試しください。",
      )
      setSequence("idle")
    } finally {
      runningRef.current = false
    }
  }, [mode, filter])

  const handleRetry = useCallback(() => {
    void handleDraw()
  }, [handleDraw])

  const subText = (() => {
    if (sequence === "drawing" || sequence === "extracting") {
      return "封筒が舞い降りています…"
    }
    if (sequence === "waiting") {
      return mode === "station" ? "探しています…" : "いい場所を探してる…"
    }
    if (sequence === "revealing") return "チケットを開いています…"
    return null
  })()

  const isBusy = sequence !== "idle" && sequence !== "done"

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setSequence("idle")
  }, [])

  return {
    sequence,
    result,
    error,
    isBusy,
    subText,
    handleDraw,
    handleRetry,
    reset,
  }
}
