-- A3M Router Kong Plugin Handler
-- Intercepts LLM API calls and routes them through A3M Router

local http = require "resty.http"
local kong = kong
local ngx = ngx
local var = ngx.var
local re_match = ngx.re.match
local now = ngx.now
local timer_at = ngx.timer.at
local log = kong.log
local err = kong.err

local A3MRouterHandler = {}

A3MRouterHandler.PRIORITY = 1000
A3MRouterHandler.VERSION = "1.0.0"

-- LLM API paths to intercept
local LLM_PATTERNS = {
  "^/v1/chat/completions$",
  "^/v1/completions$",
  "^/v1/embeddings$",
  "^/v1/images/generations$",
  "^/v1/audio/transcriptions$",
}

-- Check if request path matches LLM patterns
local function is_llm_request(path, exclude_routes)
  -- Check exclusions first
  if exclude_routes then
    for _, pattern in ipairs(exclude_routes) do
      local m, err = re_match(path, pattern, "i")
      if err then
        log.warn("Invalid exclude route pattern: ", pattern, " error: ", err)
      elseif m then
        return false, "excluded"
      end
    end
  end

  -- Check LLM patterns
  for _, pattern in ipairs(LLM_PATTERNS) do
    local m, err = re_match(path, pattern, "i")
    if err then
      log.warn("Invalid LLM pattern: ", pattern, " error: ", err)
    elseif m then
      return true, "matched"
    end
  end

  return false, "not_matched"
end

-- Parse JSON body safely
local function parse_body(body)
  if not body or body == "" then
    return nil, "empty body"
  end
  local ok, data = pcall(kong.service.request.get_body)
  if not ok then
    return nil, "failed to get body"
  end
  return data
end

-- Make HTTP request to A3M Router
local function call_a3m_router(config, method, path, headers, body, timeout_ms)
  local httpc = http.new()
  httpc:set_timeout(timeout_ms or config.a3m_timeout_ms or 30000)

  local full_url = config.a3m_base_url .. path

  local request_headers = {}
  if config.pass_headers then
    for k, v in pairs(headers) do
      if k:lower():find("^content-type$") or k:lower():find("^authorization$") or k:lower():find("^openai%-") then
        request_headers[k] = v
      end
    end
  end
  request_headers["Content-Type"] = headers["Content-Type"] or "application/json"
  request_headers["x-a3m-source"] = "kong-plugin"

  local start_time = now()
  local res, err = httpc:request_uri(full_url, {
    method = method,
    headers = request_headers,
    body = body,
    keepalive = true,
  })
  local latency_ms = (now() - start_time) * 1000

  if not res then
    return nil, err, latency_ms
  end

  return res, nil, latency_ms
end

-- Handle streaming response from A3M Router
local function handle_streaming_response(res, config, start_time)
  local headers = setmetatable({}, { __index = res.headers })
  local latency_ms = (now() - start_time) * 1000

  kong.service.response.set_headers(headers)
  kong.service.response.set_header("x-a3m-routed", "true")
  kong.service.response.set_header("x-a3m-latency-ms", string.format("%.2f", latency_ms))

  if config.debug_headers then
    kong.service.response.set_header("x-a3m-debug", "streaming_response")
  end

  kong.response.exit(res.status, res.body, headers)
end

-- Handle non-streaming response from A3M Router
local function handle_response(res, config, start_time)
  local latency_ms = (now() - start_time) * 1000
  local router_model = "unknown"

  -- Try to extract model from response
  if res.body then
    local ok, json = pcall(cjson.decode, res.body)
    if ok and json and json.model then
      router_model = json.model
    end
  end

  local response_headers = setmetatable({}, { __index = res.headers })
  response_headers["x-a3m-routed"] = "true"
  response_headers["x-a3m-routed-model"] = router_model
  response_headers["x-a3m-latency-ms"] = string.format("%.2f", latency_ms)

  if config.debug_headers then
    response_headers["x-a3m-debug"] = "direct_response"
    response_headers["x-a3m-source-url"] = config.a3m_base_url
  end

  kong.service.response.set_headers(response_headers)
  kong.response.exit(res.status, res.body, response_headers)
end

-- Handle fallback to original provider
local function handle_fallback(config, reason, attempt)
  log.warn("A3M Router failed (attempt ", attempt, "): ", reason)
  log.info("Falling back to original provider")

  local response_headers = {
    ["x-a3m-fallback"] = "true",
    ["x-a3m-fallback-reason"] = reason,
    ["x-a3m-attempt"] = tostring(attempt),
  }

  if config.debug_headers then
    response_headers["x-a3m-debug"] = "fallback_triggered"
  end

  kong.service.response.set_headers(response_headers)

  -- Let the request pass through to the original upstream
  return kong.service.cluster()
end

-- A3MRouterHandler:access phase
function A3MRouterHandler:access(config)
  config = config or {}
  local request_path = var.request_uri or "/"

  -- Remove query string for matching
  local path = request_path:gsub("%?.*", "")

  local is_llm, match_reason = is_llm_request(path, config.exclude_routes)

  if not is_llm then
    log.debug("Not an LLM request, passing through: ", path, " (", match_reason, ")")
    return
  end

  log.info("Intercepting LLM request: ", path)

  local method = var.request_method
  local headers = kong.request.get_headers()
  local body = kong.service.request.get_body()
  local start_time = now()

  -- Get body as string for forwarding
  local body_str = nil
  if body then
    local ok, body_str_err = pcall(cjson.encode, body)
    if not ok then
      body_str = kong.service.request.get_raw_body()
    else
      body_str = body_str_err
    end
  else
    body_str = kong.service.request.get_raw_body()
  end

  local timeout_ms = config.a3m_timeout_ms or 30000
  local max_retries = config.max_retries or 1
  local attempt = 0

  while attempt < max_retries + 1 do
    attempt = attempt + 1

    log.debug("A3M Router attempt ", attempt, " of ", max_retries + 1)

    local res, err, latency_ms = call_a3m_router(
      config,
      method,
      path,
      headers,
      body_str,
      timeout_ms
    )

    if err then
      log.warn("A3M Router request failed: ", err)

      if attempt > max_retries then
        return handle_fallback(config, err, attempt)
      end

    elseif res.status == 200 or res.status == 201 then
      -- Check if streaming
      local content_type = res.headers and res.headers["content-type"] or ""
      if content_type:find("text/event-stream") or content_type:find("stream") then
        return handle_streaming_response(res, config, start_time)
      else
        return handle_response(res, config, start_time)
      end

    elseif res.status >= 500 then
      log.warn("A3M Router returned status ", res.status)

      if attempt > max_retries then
        return handle_fallback(config, "A3M returned " .. res.status, attempt)
      end

    else
      -- 400, 401, 404, etc - don't retry, just fail
      log.error("A3M Router returned error status: ", res.status)
      return handle_fallback(config, "A3M status " .. res.status, attempt)
    end
  end
end

-- Buffered body reader for streaming
local function read_body_chunk_reader(chunk, policy)
  if not chunk then
    return nil
  end
  if policy == "drop" then
    return nil
  end
  return chunk
end

-- A3MRouterHandler:header_filter phase - add response headers
function A3MRouterHandler:header_filter(config)
  config = config or {}

  -- Add plugin identification header
  kong.response.set_header("Server", "A3M-Router-Kong/1.0.0")

  -- If not already set by A3M, add plugin header
  if not kong.response.get_header("x-a3m-routed") then
    kong.response.set_header("x-a3m-plugin", "true")
  end
end

-- A3MRouterHandler:log phase - log routing decisions
function A3MRouterHandler:log(config)
  config = config or {}
  local log_level = config.log_level or "info"

  local routed_model = kong.response.get_header("x-a3m-routed-model")
  local latency = kong.response.get_header("x-a3m-latency-ms")
  local fallback = kong.response.get_header("x-a3m-fallback")

  if fallback then
    log.warn("[A3M Router] Fallback triggered - reason: ",
             kong.response.get_header("x-a3m-fallback-reason"))
  elseif routed_model then
    log.info("[A3M Router] Routed to: ", routed_model,
             " latency: ", latency, "ms")
  end
end

return A3MRouterHandler
