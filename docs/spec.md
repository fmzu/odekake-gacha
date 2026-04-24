# おでかけおみくじ 仕様書

## 概要

御神籤箱から紙を引いて行き先（駅 or 観光地）を引き当てるミニアプリ。
引いた紙は駅の硬券チケットや航空券風のボーディングパスに変化する。
エリア・都道府県で範囲を絞り込むこともできる。

## 目的

- 「行き先を決める」行為をエンタメ化する
- 大吉/凶のようなランク要素を排除し、行き先に格差が生まれないようにする
- API 取得の待ち時間を演出の一部として自然に隠す

## URL

- `/` — メインページ（おでかけおみくじ）

## UI 構成

```
┌────────────────────────────────────┐
│ おでかけおみくじ                    │
│                                    │
│  御神籤箱から紙を引いて…           │
│                                    │
│  範囲: [全国 ▼] [-- ▼] [×]        │
│                                    │
│  ┌────────────────────────────┐    │
│  │      御神籤箱（SVG）        │    │
│  │        [ 引く ]            │    │
│  └────────────────────────────┘    │
│                                    │
│  ── 結果表示時は箱→チケットに ──   │
│                                    │
│  [ もう一回引く ]                  │
│                                    │
│  モード: [ 駅 ] [ 観光地 ]         │
│                                    │
│  Powered by HeartRails Express     │
└────────────────────────────────────┘
```

## モード

| モード | 結果 | チケットデザイン |
|--------|------|------------------|
| 駅     | 全国ランダムの駅 | `StationTicket` — 国鉄風の硬券 |
| 観光地 | 全国ランダムの観光地 | `BoardingPass` — 航空券風ボーディングパス |

## 範囲絞り込み

3段階で任意に行き先の範囲を制限できる。

| 設定 | 動作 |
|------|------|
| 全国（デフォルト） | 日本全国からランダム抽選 |
| エリア指定（関東等） | そのエリア内の都道府県からランダム |
| 都道府県指定 | その県に固定 |

- エリア選択後に都道府県セレクタが有効化
- `×` ボタンで全国に戻せる
- 抽選中はセレクタ無効化

## 状態機械

```
idle ─▶ drawing ─▶ waiting ─▶ extracting ─▶ revealing ─▶ done
 ▲      (0.5s)    (≥1.0s)     (1.5s)         (1.2s)      │
 └──────────────── もう一回 ──────────────────────────────┘
```

| 状態 | 表示 | 期間 |
|------|------|------|
| `idle` | 箱静止 | - |
| `drawing` | 箱が押下フィードバックで軽く凹む | 固定 500ms |
| `waiting` | 箱が揺れ続ける。紙は箱の中に隠れたまま | 1000ms + API 完了待ち |
| `extracting` | 紙が穴から滑らかに出てくる | 固定 1500ms |
| `revealing` | 紙がチケットに展開（AnimatePresence） | 固定 1200ms |
| `done` | チケット表示 +「もう一回引く」ボタン | - |

演出の合計最低時間は約 4.2 秒。API が遅延した場合は `waiting` が延長されるのみで、
紙が半分出かけの状態で待つことがない。

## データフロー

1. ページ表示時にエリア一覧を useQuery で取得（`staleTime: Infinity`）
2. エリア選択時に都道府県一覧を useQuery で取得（キャッシュ済みなら再取得なし）
3. 「引く」押下 → `fallbackRandomStation` / `fallbackRandomSpot` に FilterOptions を渡す
4. fallback 関数が areas → prefectures → lines/spots を順に叩いてランダム抽選
5. API fetch とアニメーションを並行実行し、API 完了後に紙の取り出し演出

## ファイル構成

```
app/
  page.tsx              # メインページ（UI描画）
  layout.tsx            # ルートレイアウト
  providers.tsx         # React Query プロバイダー
  omikuji-box.tsx       # 御神籤箱 SVG + 揺れ演出
  folded-paper.tsx      # 箱の穴から出る紙 SVG
  station-ticket.tsx    # 駅用硬券チケット
  boarding-pass.tsx     # 観光地用ボーディングパス
  api/
    areas/route.ts      # HeartRails エリア一覧
    prefectures/route.ts # HeartRails 都道府県一覧
    lines/route.ts      # HeartRails 路線一覧
    stations/route.ts   # HeartRails 駅一覧
    spots/route.ts      # Overpass API 観光地検索

hooks/
  use-filter-state.ts   # エリア/都道府県フィルタの状態管理 + useQuery
  use-gacha-draw.ts     # おみくじ演出シーケンス制御

lib/
  types.ts              # 型定義（Mode, GachaResult, FilterOptions 等）
  constants.ts          # FILTER_ALL 定数
  pick-random.ts        # 配列からランダム選択
  retry-with-attempts.ts # 汎用リトライロジック
  fetch-from-api.ts     # 共通 fetch ラッパー
  fetch-areas.ts        # エリア取得
  fetch-prefectures.ts  # 都道府県取得
  fetch-lines.ts        # 路線取得
  fetch-stations.ts     # 駅取得
  fetch-spots.ts        # 観光地取得
  fallback-random-station.ts # 駅フォールバック（必ず結果を返す）
  fallback-random-spot.ts    # 観光地フォールバック（必ず結果を返す）
  prefectures.ts        # 47都道府県ホワイトリスト
  format-ticket-date.ts # チケット日付フォーマッタ
  generate-ticket-number.ts # 4桁チケット番号生成
  tourism-labels.ts     # 観光種別ラベル

components/ui/
  button.tsx            # shadcn/ui Button
  select.tsx            # shadcn/ui Select
```

## 切符デザイン

### StationTicket（駅モード）

- 国鉄風の縦長硬券
- 行き先の駅名をセリフ体で強調
- 破線の切り取り線・下部に磁気ストライプ風の帯
- 路線名・都道府県・発行日・4桁の番号

### BoardingPass（観光地モード）

- 航空券風の本券＋半券分割レイアウト
- `BOARDING PASS` ヘッダ
- `DESTINATION` 欄に観光地名、`REGION` 欄に都道府県
- 観光地カテゴリ（attraction/museum/viewpoint 等）・発行日・4桁番号

## 外部 API

| API | 用途 | 料金 | キー |
|-----|------|------|------|
| HeartRails Express | エリア・都道府県・路線・駅データ | 無料 | 不要 |
| Overpass API (OSM) | 観光地検索 | 無料 | 不要 |

観光地の都道府県情報は Overpass API の `area["name"="${prefecture}"]->.a` による
OSM 行政境界検索に基づく。spots API では都道府県ホワイトリストによるバリデーションで
クエリインジェクションを防止している。

## エラー処理

- API 失敗時は `sequence` を `idle` に戻し「サーバーに接続できませんでした」を表示
- モード切替・フィルタ操作は抽選中は無効化
- `fallbackRandomStation` / `fallbackRandomSpot` は最大5回リトライし必ず結果を返す

## テスト

vitest を使用。lib/ 配下のユーティリティ関数に対するユニットテスト（7ファイル・23テスト）。

## 技術スタック

- Next.js 16 (App Router)
- React 19
- TanStack Query（エリア/都道府県のキャッシュ付き取得）
- motion（おみくじ箱・紙・チケットのアニメーション）
- Tailwind CSS 4 + shadcn/ui
- Biome（リンタ/フォーマッタ、セミコロンなし）
- vitest（テスト）
