"use client"

import { MapPin, RefreshCw, Train, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
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
import { FoldedPaper } from "./folded-paper"
import { OmikujiBox } from "./omikuji-box"
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
    paperState,
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
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#3a1d0a]">
          おでかけおみくじ
        </h1>
      </div>

      <p className="mb-2 text-sm text-slate-600">
        御神籤箱から紙を引いて、今日の行き先を占いましょう。
      </p>

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
            className="h-7 min-w-[5rem] flex-1 border-[#d4c5a0] bg-[#fdf6e3]/60 text-xs text-[#3a1d0a]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
            className="h-7 min-w-[5rem] flex-1 border-[#d4c5a0] bg-[#fdf6e3]/60 text-xs text-[#3a1d0a]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>--</SelectItem>
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

      {/* 箱 ↔ チケットを同じスペースで差し替える */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#fdf6e3] to-[#f0e4c2] py-4">
        <AnimatePresence mode="wait">
          {sequence !== "revealing" && sequence !== "done" ? (
            <motion.div
              key="box"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <OmikujiBox state={sequence} onDrawClick={handleDraw}>
                <FoldedPaper state={paperState} />
              </OmikujiBox>

              {/* サブテキスト */}
              <p className="min-h-[1.25rem] text-center text-xs text-[#8a6d3b]">
                {subText ?? ""}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="ticket"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[340px] items-center justify-center px-4"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* エラー */}
      {error && (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      )}

      {/* もう一回 */}
      {sequence === "done" && (
        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={handleRetry}>
            <RefreshCw className="size-4" />
            もう一回引く
          </Button>
        </div>
      )}

      {/* モード切替（画面下部） */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-[#3a1d0a]">
          モード
        </label>
        <div className="flex gap-2">
          <Button
            variant={mode === "station" ? "default" : "outline"}
            onClick={() => handleModeChange("station")}
            className="flex-1"
            disabled={isBusy}
          >
            <Train className="size-4" />駅
          </Button>
          <Button
            variant={mode === "spot" ? "default" : "outline"}
            onClick={() => handleModeChange("spot")}
            className="flex-1"
            disabled={isBusy}
          >
            <MapPin className="size-4" />
            観光地
          </Button>
        </div>
      </div>

      {/* フッター */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Powered by HeartRails Express
      </p>
    </div>
  )
}
