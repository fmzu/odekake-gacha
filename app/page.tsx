"use client"

import { MapPin, RefreshCw, Train, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFilterState } from "@/hooks/use-filter-state"
import { useGachaDraw } from "@/hooks/use-gacha-draw"
import { FILTER_ALL } from "@/lib/constants"
import type { FilterOptions, Mode } from "@/lib/types"
import { BoardingPass } from "./boarding-pass"
import { SkyScene } from "./sky-scene"
import { StationTicket } from "./station-ticket"

export default function OmikujiPage() {
  const [mode, setMode] = useState<Mode>("station")

  const {
    areas,
    prefectures,
    selectedArea,
    selectedPrefecture,
    handleAreaChange,
    handlePrefectureChange,
    resetFilter,
    isFilterActive,
  } = useFilterState()

  const filter = useMemo<FilterOptions>(
    () => ({ area: selectedArea, prefecture: selectedPrefecture }),
    [selectedArea, selectedPrefecture],
  )

  const {
    sequence,
    result,
    error,
    isBusy,
    subText,
    handleDraw,
    handleRetry,
    reset,
  } = useGachaDraw(mode, filter)

  const handleModeChange = (next: Mode) => {
    if (isBusy) return
    setMode(next)
    reset()
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#3a1d0a]">
          おでかけおみくじ
        </h1>
      </div>

      <p className="mb-5 text-sm text-slate-600">
        空から舞い降りる封筒を受け取って、今日の行き先を占いましょう。
      </p>

      {/* モード切替 */}
      <div className="mb-5">
        <div className="flex gap-1 rounded-lg border border-[#d4c5a0] bg-[#fdf6e3]/60 p-1">
          <button
            type="button"
            onClick={() => handleModeChange("station")}
            disabled={isBusy}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === "station"
                ? "bg-[#fffdf8] text-[#3a1d0a] shadow-sm"
                : "text-[#8a6d3b] hover:text-[#3a1d0a]"
            } disabled:opacity-50`}
          >
            <Train className="size-3.5" />駅
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("spot")}
            disabled={isBusy}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === "spot"
                ? "bg-[#fffdf8] text-[#3a1d0a] shadow-sm"
                : "text-[#8a6d3b] hover:text-[#3a1d0a]"
            } disabled:opacity-50`}
          >
            <MapPin className="size-3.5" />
            観光地
          </button>
        </div>
      </div>

      {/* 範囲絞り込み */}
      <div className="mb-3 flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-[#8a6d3b]">
          範囲
        </span>

        <Select
          value={selectedArea ?? FILTER_ALL}
          onValueChange={handleAreaChange}
          disabled={isBusy}
        >
          <SelectTrigger
            size="sm"
            className="h-7 min-w-[5rem] flex-1 border-[#d4c5a0] bg-[#fdf6e3]/60 text-sm text-[#3a1d0a]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            side="bottom"
            position="popper"
            className="bg-[#fdf6e3] border-[#d4c5a0]"
          >
            <SelectItem value={FILTER_ALL}>全国</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedPrefecture ?? FILTER_ALL}
          onValueChange={handlePrefectureChange}
          disabled={isBusy || !selectedArea}
        >
          <SelectTrigger
            size="sm"
            className="h-7 min-w-[5rem] flex-1 border-[#d4c5a0] bg-[#fdf6e3]/60 text-sm text-[#3a1d0a]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            side="bottom"
            position="popper"
            className="bg-[#fdf6e3] border-[#d4c5a0]"
          >
            <SelectItem value={FILTER_ALL}>都道府県</SelectItem>
            {prefectures.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFilterActive && (
          <button
            type="button"
            onClick={resetFilter}
            disabled={isBusy}
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[#d4c5a0] bg-[#fdf6e3]/60 text-[#8a6d3b] hover:bg-[#f0e4c2] disabled:opacity-50"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* 抽選シーン（空 + 乗り物 + 封筒 + チケット） */}
      <div className="relative">
        <SkyScene state={sequence} onDrawClick={handleDraw}>
          {mode === "station" ? (
            <StationTicket
              state="revealed"
              result={result?.type === "station" ? result : null}
            />
          ) : (
            <BoardingPass
              state="revealed"
              result={result?.type === "spot" ? result : null}
            />
          )}
        </SkyScene>

        {/* サブテキスト */}
        {subText && (
          <p className="mt-2 text-center text-xs text-[#8a6d3b]">{subText}</p>
        )}
      </div>

      {/* エラー */}
      {error && (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      )}

      {/* もう一回 */}
      {sequence === "done" && (
        <div className="mt-2">
          <Button
            variant="outline"
            className="w-full border-[#d4c5a0] text-[#3a1d0a]"
            onClick={handleRetry}
          >
            <RefreshCw className="size-4" />
            もう一回引く
          </Button>
        </div>
      )}

      {/* フッター */}
      <p className="mt-8 text-center text-xs text-[#d4c5a0]">
        Powered by HeartRails Express
      </p>
    </div>
  )
}
