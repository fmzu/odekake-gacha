"use client";

import { Home, Loader2, MapPin, RefreshCw, Sparkles, Target, Train } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createJapanProjection,
  JAPAN_MAP_DEFAULT_HEIGHT,
  JAPAN_MAP_DEFAULT_WIDTH,
} from "@/lib/create-japan-projection";
import { fallbackRandomSpot } from "@/lib/fallback-random-spot";
import { fallbackRandomStation } from "@/lib/fallback-random-station";
import { fetchNearestStations } from "@/lib/fetch-nearest-stations";
import { generateRandomLandPoint } from "@/lib/generate-random-land-point";
import type { JapanPoint } from "@/lib/generate-random-japan-point";
import {
  loadJapanTopoJson,
  type JapanFeatureCollection,
} from "@/lib/load-japan-topojson";
import { pickRandom } from "@/lib/pick-random";
import { TOURISM_LABELS } from "@/lib/tourism-labels";
import type { GachaResult, Station } from "@/lib/types";
import { JapanMap } from "./japan-map";

// 1回目 + 自動リトライ2回 = 最大3回。3回目はフォールバック（絶対に結果を返す）
const MAX_RETRY = 2;
const MAP_WIDTH = JAPAN_MAP_DEFAULT_WIDTH;
const MAP_HEIGHT = JAPAN_MAP_DEFAULT_HEIGHT;

type Mode = "station" | "spot";

type DartPixel = { x: number; y: number };

type ThrowState = "idle" | "throwing" | "searching" | "done";

export default function DartsPage() {
  const projection = useMemo(
    () => createJapanProjection(MAP_WIDTH, MAP_HEIGHT),
    [],
  );

  const [mode, setMode] = useState<Mode>("station");
  const [dartPosition, setDartPosition] = useState<DartPixel | null>(null);
  const [landingPoint, setLandingPoint] = useState<JapanPoint | null>(null);
  const [result, setResult] = useState<GachaResult | null>(null);
  const [throwState, setThrowState] = useState<ThrowState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<JapanFeatureCollection | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  const retryCountRef = useRef(0);
  // フォールバック（3回目）で取得した結果を、ダーツの再アニメーション完了時に表示するため一時保持する
  const pendingFallbackResultRef = useRef<GachaResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJapanTopoJson()
      .then((data) => {
        if (!cancelled) setFeatures(data);
      })
      .catch(() => {
        if (!cancelled) setMapLoadError("地図データの読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForNextThrow = useCallback(() => {
    setDartPosition(null);
    setLandingPoint(null);
    setResult(null);
    setStatusMessage(null);
    setError(null);
  }, []);

  const throwOnce = useCallback(() => {
    if (!features) return;
    setResult(null);
    setStatusMessage(null);
    setError(null);
    setThrowState("throwing");

    // 画面内に着弾する陸地点を最大10回トライ（projection outside → null）
    try {
      for (let i = 0; i < 10; i += 1) {
        const point = generateRandomLandPoint(features);
        const projected = projection([point.lon, point.lat]);
        if (!projected) continue;
        const [x, y] = projected;
        if (x < 0 || x > MAP_WIDTH || y < 0 || y > MAP_HEIGHT) continue;
        setLandingPoint(point);
        setDartPosition({ x, y });
        return;
      }
    } catch {
      setError("陸地の座標生成に失敗しました。もう一度お試しください。");
      setThrowState("idle");
      return;
    }
    // フォールバック: 真ん中
    const center = projection([137.5, 38]) ?? [MAP_WIDTH / 2, MAP_HEIGHT / 2];
    setLandingPoint({ lon: 137.5, lat: 38 });
    setDartPosition({ x: center[0], y: center[1] });
  }, [features, projection]);

  /**
   * 観光地モード専用の開始処理。
   *
   * Overpass API が非常に遅く不安定なため、観光地モードでは最初から
   * 必ず結果を返す fallbackRandomSpot（HeartRails系API）を使う。
   *
   * フロー:
   *  1. 「いい観光地を探してる…」ローディング表示（searching）
   *  2. fallbackRandomSpot() で観光地と座標を取得
   *  3. 取得した座標を投影してダーツを飛ばす（throwing）
   *  4. pendingFallbackResultRef 経由でアニメ完了時に結果表示
   */
  const startSpotThrow = useCallback(async () => {
    setThrowState("searching");
    setStatusMessage("いい観光地を探してる…");
    try {
      const { spot, lon, lat } = await fallbackRandomSpot();
      pendingFallbackResultRef.current = spot;
      const projected = projection([lon, lat]);
      if (projected) {
        const [x, y] = projected;
        setLandingPoint({ lon, lat });
        setStatusMessage(null);
        setDartPosition({ x, y });
        setThrowState("throwing");
      } else {
        // 投影に失敗した場合でも結果は表示する（座標が画面外）
        setStatusMessage(null);
        setResult(spot);
        pendingFallbackResultRef.current = null;
        setThrowState("done");
      }
    } catch {
      setStatusMessage(null);
      setError(
        "サーバーに接続できませんでした。しばらくしてからお試しください。",
      );
      setThrowState("done");
    }
  }, [projection]);

  const handleStart = useCallback(() => {
    resetForNextThrow();
    retryCountRef.current = 0;
    pendingFallbackResultRef.current = null;
    if (mode === "spot") {
      void startSpotThrow();
      return;
    }
    throwOnce();
  }, [mode, resetForNextThrow, startSpotThrow, throwOnce]);

  /**
   * 駅モードの3回目のフォールバック実行。
   * 日本全国からランダムな駅を取得し、その座標にダーツを飛ばし直す。
   * 結果は pendingFallbackResultRef に保存して、アニメーション完了時に表示する。
   */
  const runFallback = useCallback(async () => {
    try {
      const { station, lon, lat } = await fallbackRandomStation();
      pendingFallbackResultRef.current = station;
      const projected = projection([lon, lat]);
      if (projected) {
        const [x, y] = projected;
        setLandingPoint({ lon, lat });
        // フォールバック成功時はリトライメッセージを消してからダーツを投げ直す
        setStatusMessage(null);
        // 前の着弾点を消してから新しい着弾点に差し替えることで
        // japan-map 側の key が変わり、ダーツが再アニメーションする
        setDartPosition(null);
        setTimeout(() => {
          setDartPosition({ x, y });
          setThrowState("throwing");
        }, 50);
      } else {
        // 投影に失敗した場合でも結果は表示する（座標が画面外）
        setStatusMessage(null);
        setResult(station);
        setThrowState("done");
      }
    } catch {
      setError(
        "サーバーに接続できませんでした。しばらくしてからお試しください。",
      );
      setThrowState("done");
    }
  }, [projection]);

  const handleAnimationComplete = useCallback(async () => {
    // フォールバック（3回目）で取得済みの結果がある場合は、
    // ダーツのアニメーション完了と同時にその結果を表示して終了する。
    if (pendingFallbackResultRef.current) {
      const pending = pendingFallbackResultRef.current;
      pendingFallbackResultRef.current = null;
      setStatusMessage(null);
      setResult(pending);
      setThrowState("done");
      return;
    }

    if (!landingPoint) return;
    // 観光地モードは startSpotThrow → pendingFallbackResultRef 経由で
    // 結果を表示するため、このパスには来ない想定。念のため何もしない。
    if (mode === "spot") return;

    setThrowState("searching");
    setStatusMessage(null);
    try {
      const stations: Station[] = await fetchNearestStations(
        landingPoint.lon,
        landingPoint.lat,
      );
      if (stations.length === 0) {
        if (retryCountRef.current < MAX_RETRY - 1) {
          // 1回目失敗 → 2回目へ（ランダム陸地点を再試行）
          retryCountRef.current += 1;
          setStatusMessage(
            `ポツンと一軒家もない場所に落ちた…投げ直します (${retryCountRef.current}/${MAX_RETRY})`,
          );
          setTimeout(() => {
            setDartPosition(null);
            setTimeout(() => throwOnce(), 50);
          }, 700);
          return;
        }
        if (retryCountRef.current < MAX_RETRY) {
          // 2回目失敗 → 3回目はフォールバックで絶対に結果を返す
          retryCountRef.current += 1;
          setStatusMessage(
            `それでも見つからない…次は確実な場所へ！ (${retryCountRef.current}/${MAX_RETRY})`,
          );
          await runFallback();
          return;
        }
        // ここには来ない想定
        setStatusMessage("駅が見つかりませんでした。もう一回投げてみて！");
        setThrowState("done");
        return;
      }
      const station = pickRandom(stations);
      setResult({
        type: "station",
        name: station.name,
        line: station.line,
        prefecture: station.prefecture,
      });
      setThrowState("done");
    } catch {
      setError("サーバーに接続できませんでした。しばらくしてからお試しください。");
      setThrowState("done");
    }
  }, [landingPoint, mode, runFallback, throwOnce]);

  const handleModeChange = useCallback(
    (next: Mode) => {
      setMode(next);
      resetForNextThrow();
      retryCountRef.current = 0;
      pendingFallbackResultRef.current = null;
      setThrowState("idle");
    },
    [resetForNextThrow],
  );

  const handleRetry = useCallback(() => {
    handleStart();
  }, [handleStart]);

  const isBusy =
    throwState === "throwing" || throwState === "searching" || !features;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ダーツの旅</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Home className="size-3" />
            ガチャ
          </Link>
          <Link
            href="/omikuji"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Sparkles className="size-3" />
            おみくじ
          </Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600">
        日本地図に向かってダーツを投げ、着弾した場所の周辺をお届けします。
      </p>

      {/* モード切替 */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === "station" ? "default" : "outline"}
          onClick={() => handleModeChange("station")}
          className="flex-1"
          disabled={isBusy}
        >
          <Train className="size-4" />
          最寄り駅
        </Button>
        <Button
          variant={mode === "spot" ? "default" : "outline"}
          onClick={() => handleModeChange("spot")}
          className="flex-1"
          disabled={isBusy}
        >
          <MapPin className="size-4" />
          近くの観光地
        </Button>
      </div>

      {/* 地図 */}
      <div className="mb-4 flex justify-center">
        <JapanMap
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          projection={projection}
          features={features}
          loadError={mapLoadError}
          dartPosition={dartPosition}
          isThrowing={throwState === "throwing"}
          onAnimationComplete={
            throwState === "throwing" ? handleAnimationComplete : undefined
          }
        />
      </div>

      {/* 操作ボタン */}
      <div className="mb-4 flex gap-2">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleStart}
          disabled={isBusy}
        >
          {throwState === "throwing" ? (
            <>
              <Target className="size-4 animate-pulse" />
              投擲中...
            </>
          ) : throwState === "searching" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              探しています...
            </>
          ) : (
            <>
              <Target className="size-4" />
              ダーツを投げる
            </>
          )}
        </Button>
        {throwState === "done" && (
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="size-4" />
            もう一回
          </Button>
        )}
      </div>

      {/* ステータス */}
      {statusMessage && (
        <p className="mb-3 text-center text-sm text-slate-500">{statusMessage}</p>
      )}
      {error && (
        <p className="mb-3 text-center text-sm text-destructive">{error}</p>
      )}

      {/* 結果 */}
      {result && throwState === "done" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.type === "station" ? (
                <Train className="size-5" />
              ) : (
                <MapPin className="size-5" />
              )}
              {result.type === "station" ? "着弾地の最寄り駅" : "近くの観光地"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">{result.name}</p>
            {result.type === "station" ? (
              <p className="text-sm text-muted-foreground">
                {result.prefecture} / {result.line}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {TOURISM_LABELS[result.tourism] ?? result.tourism}
              </p>
            )}
            {landingPoint && (
              <p className="text-xs text-slate-400">
                着弾座標: {landingPoint.lat.toFixed(3)}, {landingPoint.lon.toFixed(3)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Powered by HeartRails Express / OpenStreetMap (Overpass)
      </p>
    </div>
  );
}
