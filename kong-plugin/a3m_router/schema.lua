-- A3M Router Plugin Schema
-- Defines configuration options for the plugin

local typedefs = require "kong.db.schema.typedefs"

-- Custom validator for URL
local function is_url(url)
  if type(url) ~= "string" then
    return false, "url must be a string"
  end
  if url:match("^https?://") then
    return true
  end
  return false, "url must start with http:// or https://"
end

return {
  name = "a3m_router",
  fields = {
    { config = {
        type = "record",
        fields = {
          -- A3M Router base URL
          { a3m_base_url = {
              type = "string",
              required = true,
              default = "http://localhost:8787",
              description = "Base URL of the A3M Router server",
            }
          },
          -- Default model to use when A3M fails
          { default_model = {
              type = "string",
              default = "openai/gpt-4o-mini",
              description = "Default model to use as fallback",
            }
          },
          -- Enable parallel ensemble routing
          { parallel_ensemble = {
              type = "boolean",
              default = false,
              description = "Route to multiple models in parallel and return best response",
            }
          },
          -- Timeout for A3M Router in milliseconds
          { a3m_timeout_ms = {
              type = "number",
              default = 30000,
              description = "Timeout for A3M Router requests in milliseconds",
            }
          },
          -- Pass through original request headers
          { pass_headers = {
              type = "boolean",
              default = true,
              description = "Pass through original request headers to A3M Router",
            }
          },
          -- Add routing debug headers
          { debug_headers = {
              type = "boolean",
              default = false,
              description = "Add debug headers showing routing decisions",
            }
          },
          -- Maximum retries on A3M failure
          { max_retries = {
              type = "number",
              default = 1,
              description = "Maximum number of retries on A3M Router failure",
            }
          },
          -- Routes to exclude from interception
          { exclude_routes = {
              type = "array",
              default = {},
              description = "List of route patterns to exclude from interception",
              elements = { type = "string" },
            }
          },
          -- Log level
          { log_level = {
              type = "string",
              default = "info",
              one_of = { "debug", "info", "warn", "error" },
              description = "Logging level for plugin operations",
            }
          },
        },
      }
    },
  },
  entity_checks = {
    { custom_entity_check = {
        field = "config",
        check = function(config)
          if config.a3m_timeout_ms and config.a3m_timeout_ms < 1000 then
            return false, "a3m_timeout_ms must be at least 1000"
          end
          if config.max_retries and config.max_retries < 0 then
            return false, "max_retries must be non-negative"
          end
          return true
        end,
      }
    },
  },
}
