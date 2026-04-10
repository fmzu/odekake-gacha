# ダーツの旅 (/darts) 仕様書

## 概要

日本地図に向かってダーツを投げ、着弾地点に紐づく「最寄り駅」または「観光地」を
引き当てるおでかけ提案ミニアプリ。おでかけガチャの別モードとして提供する。

## 目的

- いつもの場所以外におでかけしたい日に、強制的にランダムな行き先を与える
- 地図上でダーツが飛ぶ演出により、「偶然出会う」というワクワク感を提供する

## UI 構成

```
┌────────────────────────────────────┐
│  ダーツの旅      [ガチャ][おみくじ]│
│                                    │
│  [ 🚃 最寄り駅 ] [ 📍 近くの観光地]│
│                                    │
│  ┌──────────────────────────────┐  │
│  │   🗾 日本地図（SVG）          │  │
│  │        ↓                      │  │
│  │      🎯 着弾                  │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ 🎯 ダーツを投げる ] [🔄もう一回]│
│                                    │
│  着弾地の最寄り駅 / 観光地カード   │
└────────────────────────────────────┘
```

## モード

| モード | 説明 | データ取得フロー |
|--------|------|------------------|
| 駅     | 着弾地点の最寄り駅（HeartRails Express `getStations`） | ダーツ→座標→HeartRails `/api/nearest-stations` |
| 観光地 | 日本各地の観光地 | 開幕から `fallbackRandomSpot` を使いダーツを目的地へ誘導 |

Overpass API が遅く不安定なため、観光地モードでは「ダーツを飛ばしてから検索」
ではなく「先に目的地を決めてから、その座標へダーツを飛ばす」戦略を採用する。

## データフロー（駅モード）

1. `loadJapanTopoJson()` で日本の都道府県ポリゴンを読み込み
2. 「ダーツを投げる」押下 → `generateRandomLandPoint(features)` で
   `geoContains` を使い陸地の緯度経度を生成
3. `createJapanProjection` で SVG 座標へ投影しダーツを着弾させる
4. アニメーション完了 → `fetchNearestStations(lon, lat)` で最寄り駅取得
5. 駅が見つからなければ `MAX_RETRY = 2` までリトライ
   - 1回目失敗: 別の陸地座標で投げ直し
   - 2回目失敗: `fallbackRandomStation` で確実に結果を返す（エリア→県→路線→駅）

## データフロー（観光地モード）

1. 「ダーツを投げる」押下 → `searching` 状態で「いい観光地を探してる…」表示
2. `fallbackRandomSpot()` でエリア→都道府県→観光地を取得
3. 取得した座標へダーツを飛ばし、`pendingFallbackResultRef` に結果を保持
4. アニメーション完了時に結果カードを表示

## 主要ファイル

| ファイル | 役割 |
|----------|------|
| `app/darts/page.tsx` | メインページ。状態機械と各モードの制御 |
| `app/darts/japan-map.tsx` | SVG 日本地図とダーツアニメーション |
| `app/darts/dart-icon.tsx` | ダーツ SVG アイコン |
| `app/api/nearest-stations/route.ts` | HeartRails `getStations` プロキシ |
| `lib/create-japan-projection.ts` | 共通 geoMercator 投影（中心 [137.5, 38]） |
| `lib/load-japan-topojson.ts` | TopoJSON → GeoJSON 変換 |
| `lib/generate-random-japan-point.ts` | BBox 範囲の緯度経度ランダム生成 |
| `lib/generate-random-land-point.ts` | `geoContains` で陸地判定（最大200試行） |
| `lib/fallback-random-station.ts` | 駅フォールバック（必ず結果を返す） |
| `lib/fallback-random-spot.ts` | 観光地フォールバック（必ず結果を返す） |
| `lib/fetch-nearest-stations.ts` | `/api/nearest-stations` クライアント |
| `public/maps/japan.topojson` | dataofjapan/land の日本地図データ |

## 外部 API

| API | 用途 | 備考 |
|-----|------|------|
| HeartRails Express `getStations` | 座標→最寄り駅 | 無料・キー不要 |
| HeartRails Express `getAreas/Prefectures/Lines/Stations` | フォールバック | |
| Overpass API | 観光地検索（フォールバック） | `area["name"="..."]` で都道府県絞り込み |

## 状態機械

```
idle ──▶ throwing ──▶ searching ──▶ done
              │            │
              └─[mode=spot]┘（先に検索してから投げる）
```

- `idle`: 待機
- `throwing`: ダーツ飛行中
- `searching`: API 問い合わせ中
- `done`: 結果表示中（「もう一回」で `idle` に戻らず再投擲）

## エラー処理

- 地図データ読み込み失敗 → マップ上にエラーメッセージ
- API 失敗 → カード下部に「サーバーに接続できませんでした」を表示
- 陸地点が生成できない場合 → `setError` でユーザーに通知
