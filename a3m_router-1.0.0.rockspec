package = "a3m_router"
version = "1.0.0"
source = {
  url = "git+https://github.com/Das-rebel/a3m-kong-plugin.git",
  tag = "v1.0.0",
}
description = {
  summary = "Kong plugin for routing LLM requests through A3M Router",
  detailed = [[
    A Kong Gateway plugin that intercepts LLM API calls and routes them
    through A3M Router for intelligent model selection. Features include:
    - Automatic fallback on A3M failure
    - Streaming response support
    - Parallel ensemble routing
    - Debug headers for monitoring
  ]],
  homepage = "https://github.com/Das-rebel/a3m-kong-plugin",
  license = "MIT",
}
dependencies = {
  "lua >= 5.1",
  "lua-resty-http >= 0.16",
  "lua-cjson >= 2.1",
}
build = {
  type = "builtin",
  modules = {
    ["a3m_router.handler"] = "kong-plugin/a3m_router/handler.lua",
    ["a3m_router.schema"] = "kong-plugin/a3m_router/schema.lua",
    ["a3m_router.migrations"] = "kong-plugin/a3m_router/migrations.lua",
    ["a3m_router.stats"] = "kong-plugin/a3m_router/stats.lua",
  },
  install = {
    lua = {
      ["a3m_router/handler.lua"] = "/usr/local/kong/plugin/a3m_router/handler.lua",
      ["a3m_router/schema.lua"] = "/usr/local/kong/plugin/a3m_router/schema.lua",
      ["a3m_router/migrations.lua"] = "/usr/local/kong/plugin/a3m_router/migrations.lua",
      ["a3m_router/stats.lua"] = "/usr/local/kong/plugin/a3m_router/stats.lua",
    },
  },
}
