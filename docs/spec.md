# おでかけおみくじ 仕様書

## 概要

青空を飛行機が横切り、空から舞い降りる封筒を受け取って今日の行き先（駅 or 観光地）を引き当てるミニアプリ。
受け取った封筒は駅の硬券チケットや航空券風のボーディングパスに変化する。
エリア・都道府県で範囲を絞り込むこともできる。

## 解決する課題

1. 「今日どこに出かけよう？」と毎回悩んで結局家から出ないオーナーが、考える前に行き先を決められるようにする
2. 既存の旅行アプリは情報量が多すぎて選択疲れを起こす。逆に「サイコロを振る」だけのツールは無味乾燥で気分が乗らない
3. 導入前: 行き先を決めかねて出かける気力を消耗する → 導入後: 封筒が舞い降りる演出にワクワクし、決定の重荷から解放される
4. 放置すると休日の外出機会を失い、生活の彩りが減り続ける

## 機能一覧

- 駅モード / 観光地モードの切替
- 抽選範囲の絞り込み（全国 / エリア / 都道府県）
- 引くボタンで青空 + 飛行機 + 封筒のアニメーション抽選
- 結果に応じた硬券チケット（駅）・航空券（観光地）の表示
- 「もう一回引く」で再抽選

## 画面 / CLI仕様

- ヘッダー: タイトル「おでかけおみくじ」+ 説明文
- モード切替: 駅 / 観光地のセグメントコントロール
- 範囲絞り込み: エリアセレクタ + 都道府県セレクタ + リセットボタン
- メイン: `SkyScene`（青空 + 雲 + 飛行機 + 封筒 + チケット展開エリア）
- サブテキスト: 状態に応じた説明文（「封筒が舞い降りています…」等）
- フッター: もう一回引くボタン（done時のみ表示）+ クレジット

```
┌────────────────────────────────────┐
│ おでかけおみくじ                    │
│ 空から舞い降りる封筒を受け取って…   │
│                                    │
│  モード: [ 駅 ] [ 観光地 ]         │
│  範囲: [全国 ▼] [-- ▼] [×]        │
│                                    │
│  ┌────────────────────────────┐    │
│  │   🌤  ✈️ →   雲             │    │
│  │       (空のシーン)          │    │
│  │       [ 引く ]             │    │
│  └────────────────────────────┘    │
│                                    │
│  ── 結果表示時はチケットに展開 ──   │
│                                    │
│  [ もう一回引く ]                  │
│  Powered by HeartRails Express     │
└────────────────────────────────────┘
```

## モード

| モード | 結果 | チケットデザイン |
|--------|------|------------------|
| 駅     | 全国ランダムの駅 | `StationTicket` — 国鉄風の硬券 |
| 観光地 | 全国ランダムの観光地 | `BoardingPass` — 航空券風ボーディングパス |

両モードとも演出は共通（飛行機が空を横切り、封筒が舞い降りる）。違いは展開後のチケットデザインのみ。

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

| 状態 | 飛行機 | 封筒 | チケット |
|------|--------|------|---------|
| `idle` | 非表示 | 非表示 | 非表示。引くボタン表示 |
| `drawing` | 右外から左外へ横切る（0.5s） | 非表示 | 非表示 |
| `waiting` | 横切るアニメをループ。API完了待ち（≥1.0s） | 非表示 | 非表示 |
| `extracting` | 非表示 | 中央上空から下方向に落下（1.5s, easeIn） | 非表示 |
| `revealing` | 非表示 | 着地後、蓋が開く（1.2s） | フェードイン |
| `done` | 非表示 | 非表示（チケットにバトンタッチ） | 表示。「もう一回引く」ボタン表示 |

演出の合計最低時間は約 4.2 秒。API が遅延した場合は `waiting` が延長されるのみで、
封筒が落下途中で待つことがない。

状態は `lib/types.ts` の `GachaSequenceState` 型で全コンポーネント共通定義。

## データフロー

1. ページ表示時にエリア一覧を useQuery で取得（`staleTime: Infinity`）
2. エリア選択時に都道府県一覧を useQuery で取得（キャッシュ済みなら再取得なし）
3. 「引く」押下 → `fallbackRandomStation` / `fallbackRandomSpot` に FilterOptions を渡す
4. fallback 関数が areas → prefectures → lines/spots を順に叩いてランダム抽選
5. API fetch とアニメーションを並行実行し、API 完了後に封筒の落下→開封演出

## ファイル構成

```
app/
  page.tsx              # メインページ（UI描画）
  layout.tsx            # ルートレイアウト
  providers.tsx         # React Query プロバイダー
  sky-scene.tsx         # 青空シーン（雲・引くボタン・チケット展開エリア）
  vehicle-plane.tsx     # 飛行機SVG（横切るアニメ）
  envelope.tsx          # 封筒SVG（落下・開封アニメ）
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
  types.ts              # 型定義（Mode, GachaResult, GachaSequenceState, FilterOptions 等）
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

## 技術構成

- 言語: TypeScript
- ランタイム: Node.js
- フレームワーク: Next.js 16（App Router）
- React 19
- TanStack Query（エリア/都道府県のキャッシュ付き取得）
- motion（飛行機・封筒・チケットのアニメーション）
- Tailwind CSS 4 + shadcn/ui
- Biome（リンタ/フォーマッタ、セミコロンなし）
- vitest（テスト）

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

## テスト観点

vitest を使用。lib/ 配下のユーティリティ関数に対するユニットテスト。

- 正常系: 各 fetch 関数が期待通りのデータを返す / フォーマッタが期待通りの文字列を返す
- 異常系: API失敗時にリトライが走る / 全リトライ失敗時にフォールバックする
- エッジケース: 空配列が返ってきたとき / 都道府県ホワイトリスト外の値を弾く

## リポジトリ

https://github.com/fmzu/odekake-gacha
