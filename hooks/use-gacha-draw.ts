import { useCallback, useRef, useState } from "react"
import { fallbackRandomSpot } from "@/lib/fallback-random-spot"
import { fallbackRandomStation } from "@/lib/fallback-random-station"
import type { FilterOptions, GachaResult, Mode } from "@/lib/types"

// 紙の表示状態（旧 OmikujiBox 演出向けに残している返り値）。
// SkyScene 演出では未使用だが、状態機械の入出力契約は変えない方針で型を内包する。
type FoldedPaperState = "hidden" | "extracting" | "done"

type SequenceState =
  | "idle"
  | "drawing"
  | "waiting"
  | "extracting"
  | "revealing"
  | "done"

// 演出時間の固定値（ミリ秒）
const DRAWING_DURATION_MS = 500
const WAITING_MIN_DURATION_MS = 1000
const EXTRACTING_DURATION_MS = 1500
const REVEALING_DURATION_MS = 1200

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useGachaDraw(mode: Mode, filter: FilterOptions) {
  const [sequence, setSequence] = useState<SequenceState>("idle")
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
      // 1. 引き始め段階（固定 0.5s）— 箱の押下フィードバック演出。紙は箱の中に隠れたまま
      setSequence("drawing")
      await sleep(DRAWING_DURATION_MS)

      // 2. waiting: API resolve を待つ。箱は揺れ続け、紙は隠れたまま
      //    最低 WAITING_MIN_DURATION_MS は必ず待つ
      setSequence("waiting")
      await sleep(WAITING_MIN_DURATION_MS)
      while (!settled) {
        await sleep(100)
      }

      if (fetchError || !fetched) {
        throw fetchError ?? new Error("no result")
      }

      // 3. extracting: 紙が一気に箱から滑らかに出てくる（固定 1.5s）
      setSequence("extracting")
      await sleep(EXTRACTING_DURATION_MS)

      // 4. revealing: チケットへ展開（固定 1.2s）
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
      return "紙を引いています…"
    }
    if (sequence === "waiting") {
      return mode === "station" ? "探しています…" : "いい場所を探してる…"
    }
    if (sequence === "revealing") return "チケットを開いています…"
    return null
  })()

  const isBusy = sequence !== "idle" && sequence !== "done"

  const paperState: FoldedPaperState = (() => {
    // drawing / waiting 中は紙は完全に箱の中に隠れている
    if (
      sequence === "idle" ||
      sequence === "drawing" ||
      sequence === "waiting"
    ) {
      return "hidden"
    }
    if (sequence === "extracting") return "extracting"
    // revealing / done では紙を隠してチケットにバトンタッチ
    return "hidden"
  })()

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
    paperState,
    handleDraw,
    handleRetry,
    reset,
  }
}
