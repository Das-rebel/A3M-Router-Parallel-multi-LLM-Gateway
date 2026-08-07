/**
 * A3M Router AgentKit Adapter - Example Usage
 * 
 * Run: npx ts-node examples/agentkit-example.ts
 */

import { createAgentKitAdapter, A3MAdapterConfig } from '../src';

// Example 1: Basic chat
async function basicChat() {
  console.log('=== Example 1: Basic Chat ===');
  
  const adapter = createAgentKitAdapter({
    baseUrl: 'http://localhost:8787',
    model: 'auto',
    temperature: 0.7,
  });

  const response = await adapter.chat([
    { role: 'user', content: 'What is 2+2?' },
  ]);

  console.log('Response:', response.content);
  console.log('Provider:', response.provider);
  console.log('Model:', response.model);
  console.log('Tier:', response.tier);
  console.log();
}

// Example 2: Streaming
async function streamingChat() {
  console.log('=== Example 2: Streaming ===');
  
  const adapter = createAgentKitAdapter({
    baseUrl: 'http://localhost:8787',
    model: 'auto',
  });

  process.stdout.write('Stream: ');
  for await (const chunk of adapter.stream([
    { role: 'user', content: 'Count to 5' },
  ])) {
    process.stdout.write(chunk.content);
  }
  console.log('\n');
}

// Example 3: With tools
async function toolChat() {
  console.log('=== Example 3: With Tools ===');
  
  const calculatorTool = {
    name: 'calculator',
    description: 'Evaluate a mathematical expression',
    parameters: {
      type: 'object',
      properties: {
        expression: { 
          type: 'string', 
          description: 'The math expression to evaluate' 
        },
      },
      required: ['expression'],
    },
  };

  const weatherTool = {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { 
          type: 'string', 
          description: 'City name' 
        },
      },
      required: ['location'],
    },
  };

  const adapter = createAgentKitAdapter({
    baseUrl: 'http://localhost:8787',
    model: 'auto',
    temperature: 0.7,
    tools: [calculatorTool, weatherTool],
  });

  const response = await adapter.chat(
    [
      { 
        role: 'user', 
        content: 'What is the weather in San Francisco and what is 50 * 23?' 
      },
    ],
    [calculatorTool, weatherTool]
  );

  console.log('Response:', response.content);
  console.log('Provider:', response.provider);
  console.log('Tool Calls:', response.toolCalls);
  console.log();
}

// Example 4: Parallel ensemble
async function ensembleChat() {
  console.log('=== Example 4: Parallel Ensemble ===');
  
  const adapter = createAgentKitAdapter({
    baseUrl: 'http://localhost:8787',
    model: 'auto',
    parallelEnsemble: 3,  // Call 3 providers, pick best
  });

  const response = await adapter.chat([
    { role: 'user', content: 'Explain quantum entanglement in one sentence' },
  ]);

  console.log('Best provider:', response.provider);
  console.log('Response:', response.content);
  console.log('All candidates:', response.candidates);
  console.log();
}

// Main
async function main() {
  try {
    await basicChat();
    await streamingChat();
    await toolChat();
    await ensembleChat();
    console.log('All examples completed!');
  } catch (error) {
    console.error('Error:', error);
    console.log('\nMake sure A3M Router is running: npx a3m-router serve');
  }
}

main();
