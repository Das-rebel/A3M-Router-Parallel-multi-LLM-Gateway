"use strict";
/**
 * A3M Router - LangChain Adapter
 *
 * Drop-in replacement for ChatOpenAI from @langchain/openai.
 * Routes all LLM calls through the A3M Router for cost optimization,
 * load balancing, and intelligent provider selection.
 *
 * @example
 * ```typescript
 * import { A3MChatModel } from 'adaptive-memory-multi-model-router/langchain';
 * import { HumanMessage } from '@langchain/core/messages';
 *
 * const model = new A3MChatModel({
 *   modelName: 'auto', // or 'groq/llama-3.3-70b-versatile'
 *   temperature: 0.7,
 * });
 *
 * const response = await model.invoke([
 *   new HumanMessage("What is 2+2?")
 * ]);
 *
 * // Streaming
 * const stream = await model.stream([
 *   new HumanMessage("Tell me a story")
 * ]);
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.content as string);
 * }
 * ```
 *
 * LangChain is a PEER DEPENDENCY. Install it separately:
 *   npm install @langchain/core @langchain/openai
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.A3MChatModel = void 0;
exports.createA3MChatModel = createA3MChatModel;
exports.createAutoRoutingChatModel = createAutoRoutingChatModel;
// ============================================================
// A3M INTERNAL IMPORTS
// ============================================================
const providerConfig_js_1 = require("../providers/providerConfig.js");
const registry_1 = require("../providers/registry");
// ============================================================
// HELPER: Convert LangChain messages to OpenAI format
// ============================================================
function langchainMessagesToOpenAI(messages) {
    return messages.map((msg) => {
        const role = (msg._getType());
        let content;
        if (typeof msg.content === 'string') {
            content = msg.content;
        }
        else if (Array.isArray(msg.content)) {
            content = msg.content.map((part) => {
                if (typeof part === 'string')
                    return { type: 'text', text: part };
                if (part.type === 'text')
                    return { type: 'text', text: part.text };
                if (part.type === 'image_url')
                    return { type: 'image_url', image_url: part.image_url };
                return part;
            });
        }
        else {
            content = String(msg.content);
        }
        const result = { role, content };
        // Tool calls (from AIMessage with tool_calls)
        const aiMsg = msg;
        if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
            result.tool_calls = aiMsg.tool_calls.map((tc) => ({
                id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                type: 'function',
                function: {
                    name: tc.name,
                    arguments: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args),
                },
            }));
        }
        // Tool call ID (from ToolMessage)
        if (aiMsg.tool_call_id) {
            result.tool_call_id = aiMsg.tool_call_id;
        }
        // Name
        if (aiMsg.name) {
            result.name = aiMsg.name;
        }
        return result;
    });
}
// ============================================================
// HELPER: HTTP request with streaming support
// ============================================================
async function makeRequest(url, headers, body, timeout = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return await response.json();
    }
    finally {
        clearTimeout(timer);
    }
}
async function* makeStreamingRequest(url, headers, body, timeout = 120000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('No response body');
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const data = trimmed.slice(6);
                    if (data === '[DONE]')
                        return;
                    yield data;
                }
            }
        }
    }
    finally {
        clearTimeout(timer);
    }
}
// ============================================================
// HELPER: Parse provider/model from modelName
// ============================================================
function parseModel(modelName) {
    if (modelName.includes('/')) {
        const idx = modelName.indexOf('/');
        return {
            provider: modelName.slice(0, idx),
            model: modelName.slice(idx + 1),
        };
    }
    return { provider: modelName, model: '' };
}
// ============================================================
// HELPER: Resolve provider config from registry
// ============================================================
function resolveProvider(modelName, registry) {
    (0, providerConfig_js_1.loadConfig)();
    if (modelName === 'auto' || modelName === '') {
        // Use registry's priority-based selection
        const selected = registry.selectModel();
        if (!selected)
            return null;
        const parsed = parseModel(selected);
        const available = (0, providerConfig_js_1.getAvailableProviders)();
        const prov = available[parsed.provider];
        if (!prov)
            return null;
        return { providerDef: prov, model: parsed.model || prov.models[0], providerName: parsed.provider };
    }
    const parsed = parseModel(modelName);
    const available = (0, providerConfig_js_1.getAvailableProviders)();
    const prov = available[parsed.provider];
    if (prov) {
        return { providerDef: prov, model: parsed.model || prov.models[0], providerName: parsed.provider };
    }
    // Try matching by model name across all providers
    for (const [id, providerDef] of Object.entries(available)) {
        if (providerDef.models.includes(modelName)) {
            return { providerDef, model: modelName, providerName: id };
        }
    }
    return null;
}
// ============================================================
// HELPER: Build request URL and headers for a provider
// ============================================================
function buildRequestConfig(providerDef, apiKeyOverride, extraHeaders) {
    const apiKey = apiKeyOverride || providerDef.apiKey || '';
    switch (providerDef.format) {
        case 'anthropic':
            return {
                url: providerDef.baseUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    ...extraHeaders,
                },
            };
        case 'google':
            return {
                url: providerDef.baseUrl,
                headers: {
                    'Content-Type': 'application/json',
                    ...extraHeaders,
                },
            };
        case 'cohere':
            return {
                url: providerDef.baseUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...extraHeaders,
                },
            };
        case 'openai':
        default:
            return {
                url: providerDef.baseUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...extraHeaders,
                },
            };
    }
}
// ============================================================
// HELPER: Build request body per provider format
// ============================================================
function buildRequestBody(providerDef, model, openaiMessages, options) {
    switch (providerDef.format) {
        case 'anthropic':
            // Extract system message
            let systemPrompt = '';
            const nonSystemMessages = openaiMessages.filter((m) => {
                if (m.role === 'system') {
                    systemPrompt += (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)) + '\n';
                    return false;
                }
                return true;
            });
            return {
                model,
                max_tokens: options.maxTokens || 4096,
                system: systemPrompt.trim() || undefined,
                messages: nonSystemMessages.map((m) => ({
                    role: m.role === 'tool' ? 'user' : m.role,
                    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                })),
                temperature: options.temperature,
                top_p: options.topP,
                stop_sequences: options.stop,
                stream: options.stream || false,
            };
        case 'google': {
            const systemMsg = openaiMessages.find((m) => m.role === 'system');
            const contents = openaiMessages
                .filter((m) => m.role !== 'system')
                .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
            }));
            return {
                contents,
                systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 4096,
                    temperature: options.temperature,
                    topP: options.topP,
                    stopSequences: options.stop,
                },
            };
        }
        case 'openai':
        case 'cohere':
        default:
            return {
                model,
                messages: openaiMessages,
                temperature: options.temperature,
                max_tokens: options.maxTokens,
                top_p: options.topP,
                frequency_penalty: options.frequencyPenalty,
                presence_penalty: options.presencePenalty,
                stop: options.stop,
                tools: options.tools,
                stream: options.stream || false,
            };
    }
}
// ============================================================
// HELPER: Parse response per provider format
// ============================================================
function parseResponse(providerDef, data) {
    switch (providerDef.format) {
        case 'anthropic':
            return {
                content: data.content?.[0]?.text || '',
                toolCalls: data.content?.filter((c) => c.type === 'tool_use').map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.name, arguments: JSON.stringify(tc.input) },
                })),
                usage: {
                    input_tokens: data.usage?.input_tokens || 0,
                    output_tokens: data.usage?.output_tokens || 0,
                },
                model: data.model || '',
            };
        case 'google':
            return {
                content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
                usage: {
                    input_tokens: data.usageMetadata?.promptTokenCount || 0,
                    output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
                },
                model: data.modelVersion || '',
            };
        case 'openai':
        case 'cohere':
        default:
            return {
                content: data.choices?.[0]?.message?.content || '',
                toolCalls: data.choices?.[0]?.message?.tool_calls,
                usage: {
                    input_tokens: data.usage?.prompt_tokens || 0,
                    output_tokens: data.usage?.completion_tokens || 0,
                },
                model: data.model || '',
            };
    }
}
// ============================================================
// MAIN: A3MChatModel
// ============================================================
class A3MChatModel {
    // LangChain BaseChatModel compatibility fields
    lc_namespace = ['adaptive_memory_multi_model_router', 'langchain'];
    lc_sequential = true;
    lc_runnable = true;
    // Parsed options
    modelName;
    temperature;
    maxTokens;
    topP;
    frequencyPenalty;
    presencePenalty;
    stop;
    timeout;
    apiKey;
    baseUrl;
    format;
    extraHeaders;
    verbose;
    boundTools = [];
    // A3M Router
    registry;
    constructor(options = {}) {
        this.modelName = options.modelName || options.model || 'auto';
        this.temperature = options.temperature ?? 0.7;
        this.maxTokens = options.maxTokens ?? 4096;
        this.topP = options.topP;
        this.frequencyPenalty = options.frequencyPenalty;
        this.presencePenalty = options.presencePenalty;
        this.stop = options.stop;
        this.timeout = options.timeout ?? 60000;
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl;
        this.format = options.format;
        this.extraHeaders = options.headers;
        this.verbose = options.verbose ?? false;
        // Initialize A3M Router
        if (options.router) {
            this.registry = options.router;
        }
        else {
            this.registry = new registry_1.ProviderRegistry();
        }
    }
    // ========================================================================
    // LangChain compatibility: property getters
    // ========================================================================
    get model() {
        return this.modelName;
    }
    get identifyingParams() {
        return {
            modelName: this.modelName,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
        };
    }
    get lc_aliases() {
        return {
            model: 'modelName',
        };
    }
    // ========================================================================
    // LangChain compatibility: serialize/deserialize
    // ========================================================================
    toJSON() {
        return {
            type: 'A3MChatModel',
            kwargs: {
                modelName: this.modelName,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
            },
        };
    }
    static async deserialize(data) {
        return new A3MChatModel(data.kwargs || {});
    }
    // ========================================================================
    // Core: _generate (non-streaming)
    // ========================================================================
    async _generate(messages, options) {
        const resolved = resolveProvider(this.modelName, this.registry);
        if (!resolved) {
            throw new Error(`A3M Router: No provider available for model "${this.modelName}". ` +
                `Set API keys via environment variables (e.g., GROQ_API_KEY, OPENAI_API_KEY).`);
        }
        const { providerDef, model, providerName } = resolved;
        const requestConfig = buildRequestConfig(providerDef, this.apiKey, this.extraHeaders);
        const openaiMessages = langchainMessagesToOpenAI(messages);
        const tools = options?.tools || this.boundTools;
        const body = buildRequestBody(providerDef, model, openaiMessages, {
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            stop: this.stop,
            tools: tools.length > 0 ? tools : undefined,
            stream: false,
        });
        if (this.verbose) {
            console.log(`[A3M Router] ${providerName}/${model} -> ${requestConfig.url}`);
        }
        const data = await makeRequest(requestConfig.url, requestConfig.headers, body, this.timeout);
        const parsed = parseResponse(providerDef, data);
        // Build AIMessage-compatible response
        const generationInfo = {
            model: parsed.model,
            provider: providerName,
        };
        if (parsed.usage) {
            generationInfo.tokenUsage = {
                promptTokens: parsed.usage.input_tokens,
                completionTokens: parsed.usage.output_tokens,
                totalTokens: parsed.usage.input_tokens + parsed.usage.output_tokens,
            };
        }
        const aiMessage = {
            content: parsed.content,
            additional_kwargs: {},
            response_metadata: generationInfo,
        };
        if (parsed.toolCalls && parsed.toolCalls.length > 0) {
            aiMessage.tool_calls = parsed.toolCalls.map((tc) => ({
                id: tc.id,
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments),
            }));
            aiMessage.additional_kwargs.tool_calls = parsed.toolCalls;
        }
        return {
            generations: [{
                    text: parsed.content,
                    message: aiMessage,
                    generationInfo,
                }],
            llmOutput: generationInfo,
        };
    }
    // ========================================================================
    // Core: invoke (high-level)
    // ========================================================================
    async invoke(input, options) {
        const messages = typeof input === 'string'
            ? [{ _getType: () => 'human', content: input }]
            : input;
        const result = await this._generate(messages, options);
        return result.generations[0]?.message;
    }
    // ========================================================================
    // Core: _streamResponseChunks (streaming)
    // ========================================================================
    async *_streamResponseChunks(messages, options) {
        const resolved = resolveProvider(this.modelName, this.registry);
        if (!resolved) {
            throw new Error(`A3M Router: No provider available for model "${this.modelName}".`);
        }
        const { providerDef, model, providerName } = resolved;
        const requestConfig = buildRequestConfig(providerDef, this.apiKey, this.extraHeaders);
        const openaiMessages = langchainMessagesToOpenAI(messages);
        const tools = options?.tools || this.boundTools;
        const body = buildRequestBody(providerDef, model, openaiMessages, {
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            stop: this.stop,
            tools: tools.length > 0 ? tools : undefined,
            stream: true,
        });
        if (this.verbose) {
            console.log(`[A3M Router] streaming ${providerName}/${model} -> ${requestConfig.url}`);
        }
        const stream = makeStreamingRequest(requestConfig.url, requestConfig.headers, body, this.timeout * 2);
        for await (const chunk of stream) {
            try {
                const parsed = JSON.parse(chunk);
                // OpenAI streaming format
                const delta = parsed.choices?.[0]?.delta;
                if (delta) {
                    const content = delta.content || '';
                    const toolCalls = delta.tool_calls;
                    const messageChunk = {
                        content,
                        additional_kwargs: {},
                    };
                    if (toolCalls) {
                        messageChunk.tool_call_chunks = toolCalls.map((tc) => ({
                            id: tc.id || '',
                            name: tc.function?.name || '',
                            args: tc.function?.arguments || '',
                        }));
                    }
                    yield {
                        text: content,
                        message: messageChunk,
                        generationInfo: {
                            model: parsed.model || model,
                            provider: providerName,
                        },
                    };
                }
            }
            catch {
                // Skip malformed SSE chunks
            }
        }
    }
    // ========================================================================
    // Core: stream (high-level)
    // ========================================================================
    async *stream(input, options) {
        const messages = typeof input === 'string'
            ? [{ _getType: () => 'human', content: input }]
            : input;
        yield* this._streamResponseChunks(messages, options);
    }
    // ========================================================================
    // Tool calling support
    // ========================================================================
    bindTools(tools) {
        const clone = new A3MChatModel({
            router: this.registry,
            modelName: this.modelName,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            stop: this.stop,
            timeout: this.timeout,
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            format: this.format,
            headers: this.extraHeaders,
            verbose: this.verbose,
        });
        clone.boundTools = tools;
        return clone;
    }
    // ========================================================================
    // Structured output support
    // ========================================================================
    withStructuredOutput(schema, config) {
        // Build a wrapper that parses the response as structured JSON
        const self = this;
        const schemaDef = typeof schema === 'object' && 'schema' in schema
            ? schema.schema
            : schema;
        const toolDef = {
            type: 'function',
            function: {
                name: 'structured_output',
                description: 'Structured output',
                parameters: schemaDef,
            },
        };
        const bound = this.bindTools([toolDef]);
        return {
            async invoke(input) {
                const result = await bound.invoke(input);
                // Try to parse tool call args, fall back to content JSON parse
                if (result?.tool_calls?.[0]?.args) {
                    return result.tool_calls[0].args;
                }
                if (result?.additional_kwargs?.tool_calls?.[0]?.function?.arguments) {
                    return JSON.parse(result.additional_kwargs.tool_calls[0].function.arguments);
                }
                if (typeof result?.content === 'string') {
                    try {
                        const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/) ||
                            result.content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            return JSON.parse(jsonMatch[0].replace(/```json\n?/g, '').replace(/\n?```/g, ''));
                        }
                    }
                    catch {
                        // Fall through
                    }
                }
                throw new Error('A3M Router: Failed to parse structured output from response');
            },
        };
    }
    // ========================================================================
    // Provider management
    // ========================================================================
    /**
     * Get the list of available providers
     */
    getAvailableProviders() {
        return (0, providerConfig_js_1.getAvailableProviders)();
    }
    /**
     * Get provider status from the registry
     */
    getProviderStatus() {
        return this.registry.getStatus();
    }
    /**
     * Switch the model at runtime
     */
    withModel(modelName) {
        const clone = new A3MChatModel({
            router: this.registry,
            modelName,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            stop: this.stop,
            timeout: this.timeout,
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            format: this.format,
            headers: this.extraHeaders,
            verbose: this.verbose,
        });
        clone.boundTools = [...this.boundTools];
        return clone;
    }
    /**
     * Set temperature
     */
    withTemperature(temperature) {
        const clone = new A3MChatModel({
            router: this.registry,
            modelName: this.modelName,
            temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            stop: this.stop,
            timeout: this.timeout,
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            format: this.format,
            headers: this.extraHeaders,
            verbose: this.verbose,
        });
        clone.boundTools = [...this.boundTools];
        return clone;
    }
    // ========================================================================
    // LangChain event system compatibility
    // ========================================================================
    /** LLM type identifier for LangChain compatibility */
    _llmType() {
        return 'a3m-router';
    }
}
exports.A3MChatModel = A3MChatModel;
// ============================================================
// FACTORY HELPERS
// ============================================================
/**
 * Create an A3MChatModel pre-configured for a specific provider
 */
function createA3MChatModel(provider, options = {}) {
    return new A3MChatModel({
        ...options,
        modelName: provider,
    });
}
/**
 * Create an A3MChatModel with automatic routing
 */
function createAutoRoutingChatModel(options = {}) {
    return new A3MChatModel({
        ...options,
        modelName: 'auto',
    });
}
//# sourceMappingURL=langchainAdapter.js.map