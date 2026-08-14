/**
 * A3M Router Language Model for Vercel AI SDK (v3)
 *
 * Implements the LanguageModelV1 interface from @ai-sdk/provider
 */
/**
 * Convert Vercel AI SDK prompt format to OpenAI format for A3M
 */
function convertMessages(prompt) {
    const result = [];
    // Handle string prompts
    if (typeof prompt === 'string') {
        return [{ role: 'user', content: prompt }];
    }
    // messages is an array of prompt parts
    for (const part of prompt) {
        if (part.role === 'system') {
            result.push({ role: 'system', content: part.content });
        }
        else if (part.role === 'user') {
            if (typeof part.content === 'string') {
                result.push({ role: 'user', content: part.content });
            }
            else if (Array.isArray(part.content)) {
                const textContent = part.content
                    .filter((p) => p.type === 'text')
                    .map(p => p.text)
                    .join('\n');
                result.push({ role: 'user', content: textContent });
            }
        }
        else if (part.role === 'assistant') {
            if (typeof part.content === 'string') {
                result.push({ role: 'assistant', content: part.content });
            }
            else if (Array.isArray(part.content)) {
                const textContent = part.content
                    .filter((p) => p.type === 'text')
                    .map(p => p.text)
                    .join('\n');
                result.push({ role: 'assistant', content: textContent });
            }
        }
    }
    return result;
}
/**
 * Create an A3M Router Language Model for Vercel AI SDK
 */
export function createA3MLanguageModel(config = {}) {
    const baseURL = config.baseURL || 'http://localhost:8787';
    const apiKey = config.apiKey || 'not-needed';
    const model = {
        specificationVersion: 'v1',
        provider: 'a3m',
        modelId: 'auto',
        defaultObjectGenerationMode: undefined,
        async doGenerate(options) {
            const messages = convertMessages(options.prompt);
            // Extract system prompt if present
            const systemMessages = messages.filter(m => m.role === 'system');
            const nonSystemMessages = messages.filter(m => m.role !== 'system');
            const system = systemMessages.map(m => m.content).join('\n');
            // Build the request body for A3M
            const requestBody = {
                model: 'auto',
                messages: nonSystemMessages.length > 0 ? nonSystemMessages : [{ role: 'user', content: ' ' }],
            };
            if (system) {
                requestBody.system = system;
            }
            if (options.temperature !== undefined) {
                requestBody.temperature = options.temperature;
            }
            if (options.maxTokens !== undefined) {
                requestBody.max_tokens = options.maxTokens;
            }
            if (options.topP !== undefined) {
                requestBody.top_p = options.topP;
            }
            if (options.stopSequences !== undefined) {
                requestBody.stop = options.stopSequences;
            }
            if (config.parallelEnsemble) {
                requestBody.parallel = config.parallelCount || 3;
            }
            if (config.stealth) {
                requestBody.stealth = true;
            }
            try {
                // Call A3M Router
                const response = await fetch(`${baseURL}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(requestBody),
                });
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`A3M Router error: ${response.status} ${error}`);
                }
                const data = await response.json();
                const choice = data.choices[0];
                return {
                    text: choice.message.content || undefined,
                    toolCalls: choice.message.tool_calls?.map(tc => ({
                        toolCallType: 'function',
                        toolCallId: tc.id,
                        toolName: tc.function.name,
                        args: tc.function.arguments,
                    })),
                    finishReason: choice.finish_reason || 'stop',
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0,
                    },
                    rawCall: {
                        rawPrompt: messages,
                        rawSettings: requestBody,
                    },
                    providerMetadata: data._meta ? {
                        a3m: {
                            provider: data._meta.provider,
                            cost: data._meta.cost,
                        },
                    } : undefined,
                };
            }
            catch (error) {
                throw new Error(`A3M Router generation failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        doStream(options) {
            const messages = convertMessages(options.prompt);
            // Extract system prompt if present
            const systemMessages = messages.filter(m => m.role === 'system');
            const nonSystemMessages = messages.filter(m => m.role !== 'system');
            const system = systemMessages.map(m => m.content).join('\n');
            const requestBody = {
                model: 'auto',
                messages: nonSystemMessages.length > 0 ? nonSystemMessages : [{ role: 'user', content: ' ' }],
                stream: true,
            };
            if (system) {
                requestBody.system = system;
            }
            if (options.temperature !== undefined) {
                requestBody.temperature = options.temperature;
            }
            if (options.maxTokens !== undefined) {
                requestBody.max_tokens = options.maxTokens;
            }
            if (config.parallelEnsemble) {
                requestBody.parallel = config.parallelCount || 3;
            }
            if (config.stealth) {
                requestBody.stealth = true;
            }
            let attemptCount = 0;
            const maxAttempts = 3;
            const doStream = async () => {
                attemptCount++;
                try {
                    const response = await fetch(`${baseURL}/v1/chat/completions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify(requestBody),
                    });
                    if (!response.ok) {
                        const error = await response.text();
                        throw new Error(`A3M Router streaming error: ${response.status} ${error}`);
                    }
                    if (!response.body) {
                        throw new Error('A3M Router: no response body');
                    }
                    const stream = new ReadableStream({
                        async start(controller) {
                            const reader = response.body.getReader();
                            const decoder = new TextDecoder();
                            let buffer = '';
                            try {
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) {
                                        controller.close();
                                        break;
                                    }
                                    buffer += decoder.decode(value, { stream: true });
                                    const lines = buffer.split('\n');
                                    buffer = lines.pop() || '';
                                    for (const line of lines) {
                                        if (line.startsWith('data: ')) {
                                            const data = line.slice(6);
                                            if (data === '[DONE]') {
                                                controller.close();
                                                return;
                                            }
                                            try {
                                                const parsed = JSON.parse(data);
                                                // Handle chat completion chunks
                                                if (parsed.choices?.[0]?.delta?.content) {
                                                    const chunk = parsed.choices[0].delta.content;
                                                    controller.enqueue({
                                                        type: 'text-delta',
                                                        textDelta: chunk,
                                                    });
                                                }
                                                // Handle tool call start
                                                if (parsed.choices?.[0]?.delta?.tool_calls?.[0]) {
                                                    const toolCall = parsed.choices[0].delta.tool_calls[0];
                                                    if (toolCall.id) {
                                                        controller.enqueue({
                                                            type: 'tool-call',
                                                            toolCallType: 'function',
                                                            toolCallId: toolCall.id,
                                                            toolName: toolCall.function?.name || '',
                                                            args: toolCall.function?.arguments || '',
                                                        });
                                                    }
                                                }
                                                // Handle tool call delta
                                                if (parsed.choices?.[0]?.delta?.tool_calls?.[0]?.function?.arguments) {
                                                    const argsDelta = parsed.choices[0].delta.tool_calls[0].function.arguments;
                                                    if (argsDelta) {
                                                        controller.enqueue({
                                                            type: 'tool-call-delta',
                                                            toolCallType: 'function',
                                                            toolCallId: parsed.choices[0].delta.tool_calls[0].id,
                                                            toolName: parsed.choices[0].delta.tool_calls[0].function?.name || '',
                                                            argsTextDelta: argsDelta,
                                                        });
                                                    }
                                                }
                                                // Handle finish
                                                if (parsed.choices?.[0]?.finish_reason) {
                                                    controller.enqueue({
                                                        type: 'finish',
                                                        finishReason: parsed.choices[0].finish_reason,
                                                        usage: {
                                                            promptTokens: parsed.usage?.prompt_tokens || 0,
                                                            completionTokens: parsed.usage?.completion_tokens || 0,
                                                        },
                                                    });
                                                }
                                            }
                                            catch {
                                                // Skip malformed JSON
                                            }
                                        }
                                    }
                                }
                            }
                            catch (streamError) {
                                controller.error(streamError);
                            }
                        },
                    });
                    return {
                        stream,
                        rawCall: {
                            rawPrompt: messages,
                            rawSettings: requestBody,
                        },
                    };
                }
                catch (error) {
                    if (attemptCount < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
                        return doStream();
                    }
                    throw error;
                }
            };
            return new Promise((resolve, reject) => {
                doStream()
                    .then(resolve)
                    .catch(reject);
            });
        },
    };
    return model;
}
//# sourceMappingURL=a3m-language-model.js.map