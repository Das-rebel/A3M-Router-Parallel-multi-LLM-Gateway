-- A3M Router Kong Plugin - Performance Metrics
-- Tracks routing statistics for monitoring

local kong = kong
local ngx = ngx
local now = ngx.now
local cjson = require "cjson"

local StatsCollector = {}

-- In-memory stats (in production, use shared dict or external storage)
local stats = {
  total_requests = 0,
  successful_routes = 0,
  fallback_count = 0,
  average_latency_ms = 0,
  model_usage = {},
  errors = {},
}

local stats_mt = {
  __index = function(t, k)
    return rawget(t, k) or 0
  end,
}

setmetatable(stats.model_usage, stats_mt)
setmetatable(stats.errors, stats_mt)

-- Get current stats
function StatsCollector.get()
  return {
    total_requests = stats.total_requests,
    successful_routes = stats.successful_routes,
    fallback_count = stats.fallback_count,
    success_rate = stats.total_requests > 0
      and string.format("%.2f%%", (stats.successful_routes / stats.total_requests) * 100)
      or "0%",
    average_latency_ms = string.format("%.2f", stats.average_latency_ms),
    model_usage = stats.model_usage,
    errors = stats.errors,
  }
end

-- Record a routing decision
function StatsCollector.record(opts)
  opts = opts or {}

  stats.total_requests = stats.total_requests + 1

  if opts.routed_model then
    stats.successful_routes = stats.successful_routes + 1
    stats.model_usage[opts.routed_model] = (stats.model_usage[opts.routed_model] or 0) + 1
  end

  if opts.fallback then
    stats.fallback_count = stats.fallback_count + 1
  end

  if opts.latency_ms then
    local n = stats.successful_routes
    stats.average_latency_ms = ((stats.average_latency_ms * (n - 1)) + opts.latency_ms) / n
  end

  if opts.error then
    stats.errors[opts.error] = (stats.errors[opts.error] or 0) + 1
  end
end

-- Reset stats (for testing)
function StatsCollector.reset()
  stats.total_requests = 0
  stats.successful_routes = 0
  stats.fallback_count = 0
  stats.average_latency_ms = 0
  stats.model_usage = {}
  stats.errors = {}
end

-- Get stats as JSON string
function StatsCollector.json()
  return cjson.encode(StatsCollector.get())
end

return StatsCollector
