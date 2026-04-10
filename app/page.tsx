"use client";

import { MapPin, RefreshCw, Train } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fallbackRandomSpot } from "@/lib/fallback-random-spot";
import { fallbackRandomStation } from "@/lib/fallback-random-station";
import type { GachaResult } from "@/lib/types";
import { BoardingPass } from "./boarding-pass";
import { FoldedPaper, type FoldedPaperState } from "./folded-paper";
import { OmikujiBox } from "./omikuji-box";
import { StationTicket } from "./station-ticket";

type Mode = "station" | "spot";
type SequenceState =
  | "idle"
  | "drawing"
  | "waiting"
  | "extracting"
  | "revealing"
  | "done";

// 演出時間の固定値（ミリ秒）
const DRAWING_DURATION_MS = 500;
const WAITING_MIN_DURATION_MS = 1000;
const EXTRACTING_DURATION_MS = 1500;
const REVEALING_DURATION_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function OmikujiPage() {
  const [mode, setMode] = useState<Mode>("station");
  const [sequence, setSequence] = useState<SequenceState>("idle");
  const [result, setResult] = useState<GachaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const handleModeChange = useCallback((next: Mode) => {
    if (runningRef.current) return;
    setMode(next);
    setResult(null);
    setError(null);
    setSequence("idle");
  }, []);

  const handleDraw = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setResult(null);
    setError(null);

    // API fetch をボタンタップと同時に裏で開始
    const fetchPromise: Promise<GachaResult> =
      mode === "station"
        ? fallbackRandomStation().then(({ station }) => station)
        : fallbackRandomSpot().then(({ spot }) => spot);

    // fetch の結果を settled ラップで監視する（API 遅延検知用）
    let fetched: GachaResult | null = null;
    let fetchError: unknown = null;
    let settled = false;
    const trackedFetch = fetchPromise.then(
      (r) => {
        fetched = r;
        settled = true;
        return r;
      },
      (err) => {
        fetchError = err;
        settled = true;
        throw err;
      },
    );
    // unhandled rejection を防ぐ
    trackedFetch.catch(() => {});

    try {
      // 1. 引き始め段階（固定 0.5s）— 箱の押下フィードバック演出。紙は箱の中に隠れたまま
      setSequence("drawing");
      await sleep(DRAWING_DURATION_MS);

      // 2. waiting: API resolve を待つ。箱は揺れ続け、紙は隠れたまま
      //    最低 WAITING_MIN_DURATION_MS は必ず待つ
      setSequence("waiting");
      await sleep(WAITING_MIN_DURATION_MS);
      while (!settled) {
        await sleep(100);
      }

      if (fetchError || !fetched) {
        throw fetchError ?? new Error("no result");
      }

      // 3. extracting: 紙が一気に箱から滑らかに出てくる（固定 1.5s）
      setSequence("extracting");
      await sleep(EXTRACTING_DURATION_MS);

      // 4. revealing: チケットへ展開（固定 1.2s）
      setResult(fetched);
      setSequence("revealing");
      await sleep(REVEALING_DURATION_MS);

      // 5. 完了
      setSequence("done");
    } catch {
      setError(
        "サーバーに接続できませんでした。しばらくしてからお試しください。",
      );
      setSequence("idle");
    } finally {
      runningRef.current = false;
    }
  }, [mode]);

  const handleRetry = useCallback(() => {
    void handleDraw();
  }, [handleDraw]);

  const subText = (() => {
    if (sequence === "drawing" || sequence === "extracting") {
      return "紙を引いています…";
    }
    if (sequence === "waiting") {
      return mode === "station" ? "探しています…" : "いい場所を探してる…";
    }
    if (sequence === "revealing") return "チケットを開いています…";
    return null;
  })();

  const isBusy = sequence !== "idle" && sequence !== "done";

  const paperState: FoldedPaperState = (() => {
    // drawing / waiting 中は紙は完全に箱の中に隠れている
    if (
      sequence === "idle" ||
      sequence === "drawing" ||
      sequence === "waiting"
    ) {
      return "hidden";
    }
    if (sequence === "extracting") return "extracting";
    // revealing / done では紙を隠してチケットにバトンタッチ
    return "hidden";
  })();

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
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRetry}
          >
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
            <Train className="size-4" />
            駅
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
  );
}
