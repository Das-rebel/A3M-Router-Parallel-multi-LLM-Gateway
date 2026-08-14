# A3M Router 🔀 — 成本最优的LLMRouter & 并行执行

**💰 $0.0768/1Kリクエスト · 80+プロバイダー · メモリ付きルーティング**

[English](./README.md) | [中文](./README_zh.md) | [日本語](./README_ja.md)

## 主要メトリクス

| メトリクス | A3M Router | Sqwish | Azure (Microsoft) | GPT-5 (OpenAI) | RouteLLM (Berkeley) |
|------------|:----------:|:------:|:------------------:|:---------------:|:-------------------:|
| **コスト** | **$0.0768** | $0.18 | $0.22 | $10.02 | $0.27 |

> メモリ機能付きLLMRouter、独立評価で検証済み

## 独自機能：並列マルチLLM実行

従来のRouterは1つずつモデルを試します（シーケンシャルフォールバック）。A3Mは**複数プロバイダーを並列実行**し、信頼度スコアリングで最良の結果選択します。

```
従来: モデルA ❌ → モデルB ❌ → モデルC ✅  (3倍レイテンシ)
A3M:  モデルA ║ モデルB ║ モデルC → スコアリングで最良を選択 ✅  (1倍レイテンシ)
```

## 対応中国LLM

| プロバイダー | モデル | 強み |
|------------|--------|------|
| **DeepSeek** | V3, Coder, Reasoner | コード+推論、オープンウェイト |
| **Kimi (Moonshot)** | Kimi-1.5 | 128Kコンテキスト，中国語最強 |
| **Zhipu AI (GLM)** | GLM-4, GLM-4V | 中国語+バイリンガル |
| **Qwen (Alibaba)** | Qwen2, Qwen2.5-Coder | 汎用+コード |
| **Yi (01.AI)** | Yi-1.5, 34B | バイリンガル+長コンテキスト |
| **MiniMax** | abab6.5 | 1Mコンテキスト |

## コア機能

- 🔀 **並列マルチLLM実行** — 複数プロバイダー同時実行、信頼度投票
- 💰 **最安値** — $0.0768/1Kリクエスト
- 🧠 **メモリ付きルーティング** — エピソードック記憶でセッション越えコンテキスト保存
- 🔄 **セマンティックキャッシュ** — 30%+ヒット率コスト節約
- 🛡️ **予算強制** — クエリごとコスト追跡，超過防止
- ⚡ **高速起動** — <100ms、19.5KB、ML依存なし
- 🌐 **80+プロバイダー** — OpenAI, Anthropic, DeepSeek, Groq, NVIDIA等

## クイックスタート

```bash
npm install adaptive-memory-multi-model-router
npx a3m-router route "Pythonでソート関数を書いて"
```

```javascript
import { createRouter } from 'adaptive-memory-multi-model-router';

const router = createRouter({ /* APIキー自動検出 */ });
const result = await router.route('量子コンピューティングを説明して');
console.log(result.response);    // AI応答
console.log(result.provider);    // 使用プロバイダー
console.log(result.cost);        // 実際のコスト
```

## メモリ機能

```javascript
const router = createRouter({
  memory: { enabled: true }  // 会話コンテキスト自動保存
});

// 1回目の会話
await router.route('私の名前は太郎です');    // 記憶：ユーザー名＝太郎
// 2回目の会話
await router.route('私の名前は？');           // 応答：太郎です！
```

## ベンチマーク結果

| Router | コスト/1K | オープンソース |
|----------|:--------:|:------------:|
| **A3M Router** | **$0.0768** | ✅ |
| Sqwish | $0.18 | ❌ |
| Azure-Model-Router | $0.22 | ❌ |
| GPT-5 | $10.02 | ❌ |
| RouteLLM | $0.27 | ✅ |

詳細 [BENCHMARK.md](./docs/BENCHMARK.md)

## リンク

- 📖 [ドキュメント](https://das-rebel.github.io/a3m-router/)
- 🚀 [クイックスタート](https://das-rebel.github.io/a3m-router/quick-start)
- 🤖 [APIリファレンス](https://das-rebel.github.io/a3m-router/api)
- 💬 [ディスカッション](https://github.com/Das-rebel/a3m-router/discussions)

## ライセンス

MIT
