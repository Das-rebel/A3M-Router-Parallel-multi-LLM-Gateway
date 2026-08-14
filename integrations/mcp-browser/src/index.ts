/**
 * A3M Router MCP Server for Browser Automation
 * 
 * Exposes A3M's intelligent LLM routing as MCP tools for AI agents.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { A3MRouter } from 'adaptive-memory-multi-model-router';

// Initialize A3M Router
const router = new A3MRouter({
  model: 'auto',
  stealth: true,
  parallelEnsemble: 3,
  browserOptimized: true,
  providers: ['openai', 'anthropic', 'google', 'groq'],
});

// Create MCP server
const server = new Server(
  {
    name: 'a3m-browser',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools = [
  {
    name: 'route_for_browser_task',
    description: 'Route a browser automation task to the optimal LLM provider. Best for: web scraping, form filling, content extraction, page analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The browser automation task to route',
        },
        context: {
          type: 'string',
          enum: ['web_scraping', 'form_filling', 'form_analysis', 'content_generation', 'decision_making'],
          description: 'Type of browser task',
          default: 'web_scraping',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'extract_form_data',
    description: 'Extract structured data from a web page HTML.',
    inputSchema: {
      type: 'object',
      properties: {
        page_html: {
          type: 'string',
          description: 'The HTML content of the page',
        },
        schema: {
          type: 'object',
          description: 'JSON schema describing what to extract',
        },
      },
      required: ['page_html', 'schema'],
    },
  },
  {
    name: 'fill_form_intelligently',
    description: 'Determine the best value to fill a form field with, based on user profile.',
    inputSchema: {
      type: 'object',
      properties: {
        field_name: {
          type: 'string',
          description: 'Name of the form field',
        },
        field_type: {
          type: 'string',
          description: 'Type of field (text, email, phone, etc.)',
        },
        user_profile: {
          type: 'object',
          description: 'User profile data to fill from',
        },
      },
      required: ['field_name', 'field_type', 'user_profile'],
    },
  },
  {
    name: 'get_stealth_routing',
    description: 'Get routing configuration optimized for stealth (minimizing bot detection).',
    inputSchema: {
      type: 'object',
      properties: {
        minimize_detection: {
          type: 'boolean',
          description: 'Enable stealth mode',
          default: true,
        },
      },
    },
  },
  {
    name: 'get_cost_stats',
    description: 'Get cost statistics for routing decisions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'route_for_browser_task': {
        const { task, context = 'web_scraping' } = args as {
          task: string;
          context?: string;
        };
        
        const result = await router.route({
          task,
          context: context as any,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                content: result.content,
                provider: result.provider,
                model: result.model,
                cost: result.cost,
              }, null, 2),
            },
          ],
        };
      }

      case 'extract_form_data': {
        const { page_html, schema } = args as {
          page_html: string;
          schema: any;
        };
        
        const result = await router.route({
          task: `Extract structured data from this HTML matching the schema: ${JSON.stringify(schema)}`,
          context: 'data_extraction',
        });
        
        return {
          content: [
            {
              type: 'text',
              text: result.content,
            },
          ],
        };
      }

      case 'fill_form_intelligently': {
        const { field_name, field_type, user_profile } = args as {
          field_name: string;
          field_type: string;
          user_profile: any;
        };
        
        // Map field types to profile keys
        const fieldMappings: Record<string, string> = {
          'first name': 'firstName',
          'last name': 'lastName',
          'email': 'email',
          'phone': 'phone',
          'name': 'fullName',
        };
        
        const profileKey = fieldMappings[field_name.toLowerCase()] || field_name.toLowerCase();
        let value = user_profile[profileKey];
        
        if (!value) {
          // Try common variations
          const variations = [
            field_name.replace(/\s+/g, ''),
            field_name.replace(/\s+/g, '_'),
            field_name.toLowerCase(),
          ];
          for (const v of variations) {
            if (user_profile[v]) {
              value = user_profile[v];
              break;
            }
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                field: field_name,
                suggested_value: value || '',
                provider: 'profile_lookup',
              }, null, 2),
            },
          ],
        };
      }

      case 'get_stealth_routing': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                stealth: true,
                proxy_rotation: true,
                humanize_timing: true,
                randomize_user_agent: true,
                recommended_providers: ['anthropic', 'google'],
                avoid_providers: ['openai-gpt4'], // Rate limited sites
              }, null, 2),
            },
          ],
        };
      }

      case 'get_cost_stats': {
        const stats = router.getStats();
        const cost = router.getCost();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total_requests: stats.totalRequests,
                total_cost: cost.total,
                average_cost_per_request: cost.total / (stats.totalRequests || 1),
                by_provider: cost.byProvider,
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('A3M Browser MCP Server running on stdio');
}

main().catch(console.error);
