"use client";

import { useQuery } from "@tanstack/react-query";
import { Dices, Loader2, MapPin, RefreshCw, Train } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StationResult = {
  type: "station";
  name: string;
  line: string;
  prefecture: string;
};

type SpotResult = {
  type: "spot";
  name: string;
  tourism: string;
  lat: number;
  lon: number;
};

type GachaResult = StationResult | SpotResult;

type Station = {
  name: string;
  prefecture: string;
  line: string;
  x: number;
  y: number;
  postal: string;
  prev: string;
  next: string;
};

type Spot = {
  name: string;
  tourism: string;
  lat: number;
  lon: number;
};

const TOURISM_LABELS: Record<string, string> = {
  attraction: "観光スポット",
  museum: "博物館/美術館",
  viewpoint: "展望スポット",
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchAreas(): Promise<string[]> {
  const res = await fetch("/api/areas");
  const data = await res.json();
  return data.areas as string[];
}

async function fetchPrefectures(area: string): Promise<string[]> {
  const res = await fetch(
    `/api/prefectures?area=${encodeURIComponent(area)}`,
  );
  const data = await res.json();
  return data.prefectures as string[];
}

async function fetchLines(prefecture: string): Promise<string[]> {
  const res = await fetch(
    `/api/lines?prefecture=${encodeURIComponent(prefecture)}`,
  );
  const data = await res.json();
  return data.lines as string[];
}

async function fetchStations(line: string): Promise<Station[]> {
  const res = await fetch(
    `/api/stations?line=${encodeURIComponent(line)}`,
  );
  const data = await res.json();
  return data.stations as Station[];
}

async function fetchSpots(prefecture: string): Promise<Spot[]> {
  const res = await fetch(
    `/api/spots?prefecture=${encodeURIComponent(prefecture)}`,
  );
  const data = await res.json();
  return data.spots as Spot[];
}

export default function OdekakeGachaPage() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<
    "station" | "spot"
  >("station");
  const [result, setResult] = useState<GachaResult | null>(null);
  const [cachedStations, setCachedStations] = useState<Station[] | null>(null);
  const [cachedSpots, setCachedSpots] = useState<Spot[] | null>(null);
  const [isGachaing, setIsGachaing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areasQuery = useQuery({
    queryKey: ["odekake-gacha", "areas"],
    queryFn: fetchAreas,
  });

  const prefecturesQuery = useQuery({
    queryKey: ["odekake-gacha", "prefectures", selectedArea],
    queryFn: () => fetchPrefectures(selectedArea!),
    enabled: !!selectedArea,
  });

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    setSelectedPrefecture(null);
    setResult(null);
    setCachedStations(null);
    setCachedSpots(null);
    setError(null);
  };

  const handlePrefectureChange = (prefecture: string) => {
    setSelectedPrefecture(prefecture);
    setResult(null);
    setCachedStations(null);
    setCachedSpots(null);
    setError(null);
  };

  const handleCategoryChange = (category: "station" | "spot") => {
    setSelectedCategory(category);
    setResult(null);
    setError(null);
  };


  const handleGacha = useCallback(async () => {
    if (!selectedPrefecture) return;
    setResult(null);
    setError(null);
    setIsGachaing(true);

    try {
      if (selectedCategory === "station") {
        const lines = await fetchLines(selectedPrefecture);
        if (lines.length === 0) {
          setError("路線が見つかりませんでした。別のエリアを試してみてください。");
          setIsGachaing(false);
          return;
        }
        const randomLine = pickRandom(lines);
        const allStations = await fetchStations(randomLine);
        const stations = allStations.filter(
          (s) => s.prefecture === selectedPrefecture,
        );
        if (stations.length === 0) {
          setError("駅が見つかりませんでした。もう一度お試しください。");
          setIsGachaing(false);
          return;
        }
        setCachedStations(stations);
        const station = pickRandom(stations);
        setResult({
          type: "station",
          name: station.name,
          line: randomLine,
          prefecture: station.prefecture,
        });
      } else {
        const spots = await fetchSpots(selectedPrefecture);
        if (spots.length === 0) {
          setError("観光地が見つかりませんでした。別のエリアを試してみてください。");
          setIsGachaing(false);
          return;
        }
        setCachedSpots(spots);
        const spot = pickRandom(spots);
        setResult({
          type: "spot",
          name: spot.name,
          tourism: spot.tourism,
          lat: spot.lat,
          lon: spot.lon,
        });
      }
    } catch {
      setError("サーバーに接続できませんでした。しばらくしてからお試しください。");
    }
    setIsGachaing(false);
  }, [selectedPrefecture, selectedCategory]);

  const handleRetry = useCallback(() => {
    if (selectedCategory === "station") {
      handleGacha();
    } else if (cachedSpots && cachedSpots.length > 0) {
      const spot = pickRandom(cachedSpots);
      setResult({
        type: "spot",
        name: spot.name,
        tourism: spot.tourism,
        lat: spot.lat,
        lon: spot.lon,
      });
    }
  }, [selectedCategory, cachedSpots, handleGacha]);

  const canGacha = !!selectedPrefecture && !isGachaing;
  const hasCache =
    (selectedCategory === "station" && cachedStations && cachedStations.length > 0) ||
    (selectedCategory === "spot" && cachedSpots && cachedSpots.length > 0);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        おでかけガチャ
      </h1>

      <div className="space-y-4">
        {/* エリア選択 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">エリア</label>
          <Select
            value={selectedArea ?? undefined}
            onValueChange={handleAreaChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="エリアを選択" />
            </SelectTrigger>
            <SelectContent>
              {areasQuery.data?.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 都道府県選択 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">都道府県</label>
          <Select
            value={selectedPrefecture ?? undefined}
            onValueChange={handlePrefectureChange}
            disabled={!selectedArea}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  selectedArea ? "都道府県を選択" : "エリアを先に選択"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {prefecturesQuery.data?.map((pref) => (
                <SelectItem key={pref} value={pref}>
                  {pref}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* カテゴリ選択 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">カテゴリ</label>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "station" ? "default" : "outline"}
              onClick={() => handleCategoryChange("station")}
              className="flex-1"
            >
              <Train className="size-4" />
              駅
            </Button>
            <Button
              variant={selectedCategory === "spot" ? "default" : "outline"}
              onClick={() => handleCategoryChange("spot")}
              className="flex-1"
            >
              <MapPin className="size-4" />
              観光地
            </Button>
          </div>
        </div>

        {/* ガチャボタン */}
        <Button
          size="lg"
          className="w-full"
          disabled={!canGacha}
          onClick={handleGacha}
        >
          {isGachaing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              抽選中...
            </>
          ) : (
            <>
              <Dices className="size-4" />
              ガチャ！
            </>
          )}
        </Button>

        {/* エラー表示 */}
        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        {/* 結果表示 */}
        {result && !isGachaing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.type === "station" ? (
                  <Train className="size-5" />
                ) : (
                  <MapPin className="size-5" />
                )}
                {result.type === "station" ? "駅" : "観光地"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">{result.name}</p>
              {result.type === "station" ? (
                <p className="text-sm text-muted-foreground">
                  {result.line}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {TOURISM_LABELS[result.tourism] ?? result.tourism}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* もう一回ボタン */}
        {result && !isGachaing && hasCache && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRetry}
          >
            <RefreshCw className="size-4" />
            もう一回！
          </Button>
        )}
      </div>

      {/* フッター */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Powered by HeartRails Express
      </p>
    </div>
  );
}
