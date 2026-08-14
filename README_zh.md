# A3M Router 🔀 — 最便宜的LLM路由 & 并行执行

**💰 $0.0768/1K请求 · 80+提供商 · 带记忆路由**

[English](./README.md) | [日本語](./README_ja.md) | [中文](./README_zh.md)

## 核心指标

| 指标 | A3M Router | Sqwish | Azure (微软) | GPT-5 (OpenAI) | RouteLLM (伯克利) |
|------|:-----------:|:------:|:------------:|:--------------:|:-----------------:|
| **成本** | **$0.0768** | $0.18 | $0.22 | $10.02 | $0.27 |

> 带记忆功能的LLM路由器，独立评估验证

## 独特优势：并行多LLM执行

传统路由器逐个尝试模型（串行回退）。A3M **并行运行多个提供商**，用置信度评分选择最佳结果。

```
传统路由:  模型A ❌ → 模型B ❌ → 模型C ✅  (3次延迟)
A3M路由:  模型A ║ 模型B ║ 模型C → 评分选最佳 ✅  (1次延迟)
```

## 支持的中国LLM

| 提供商 | 模型 | 优势 |
|--------|------|------|
| **DeepSeek** | V3, Coder, Reasoner | 代码+推理，开源权重 |
| **Kimi (月之暗面)** | Kimi-1.5 | 128K上下文，中文最强 |
| **智谱AI (GLM)** | GLM-4, GLM-4V | 中文+双语 |
| **通义千问 (Qwen)** | Qwen2, Qwen2.5-Coder | 通用+代码 |
| **零一 (Yi)** | Yi-1.5, 34B | 双语+长上下文 |
| **MiniMax** | abab6.5 | 1M上下文 |

## 核心功能

- 🔀 **并行多LLM执行** — 同时运行多个提供商，置信度投票选最佳
- 💰 **最便宜** — $0.0768/1K请求
- 🧠 **带记忆的路由** — 情景记忆跨会话保存，越用越懂你
- 🔄 **语义缓存** — 30%+命中率，节省成本
- 🛡️ **预算强制** — 每查询成本追踪，防止超支
- ⚡ **快速启动** — <100ms，19.5KB，零ML依赖
- 🌐 **47家提供商** — OpenAI, Anthropic, DeepSeek, Groq, NVIDIA等

## 快速开始

```bash
npm install adaptive-memory-multi-model-router
npx a3m-router route "用Python写一个排序函数"
```

```javascript
import { createRouter } from 'adaptive-memory-multi-model-router';

const router = createRouter({ /* 自动检测API密钥 */ });
const result = await router.route('解释量子计算');
console.log(result.response);    // AI回复
console.log(result.provider);    // 使用的提供商
console.log(result.cost);        // 实际成本
```

## 记忆功能

```javascript
const router = createRouter({
  memory: { enabled: true }  // 自动保存对话上下文
});

// 第一次对话
await router.route('我叫小明');           // 记住：用户叫小明
// 第二次对话
await router.route('我叫什么？');         // 回复：你叫小明！
```

## 基准测试结果

| 路由器 | 成本/1K | 开源 |
|--------|:-------:|:----:|
| **A3M Router** | **$0.0768** | ✅ |
| Sqwish | $0.18 | ❌ |
| Azure-Model-Router | $0.22 | ❌ |
| GPT-5 | $10.02 | ❌ |
| RouteLLM | $0.27 | ✅ |

详见 [BENCHMARK.md](./docs/BENCHMARK.md)

## 链接

- 📖 [文档](https://das-rebel.github.io/a3m-router/)
- 🚀 [快速开始](https://das-rebel.github.io/a3m-router/quick-start)
- 🤖 [API参考](https://das-rebel.github.io/a3m-router/api)
- 💬 [讨论区](https://github.com/Das-rebel/a3m-router/discussions)

## 许可

MIT
