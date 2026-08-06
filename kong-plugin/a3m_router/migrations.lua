-- A3M Router Kong Plugin - Database Migrations
-- This plugin uses declarative configuration and doesn't require database migrations

local migrations = {
  {
    name = "001_add_a3m_router_config",
    up = [[
      -- This plugin uses declarative configuration (config.yaml or DB-less mode)
      -- No database migrations required
    ]],
    down = [[
      -- No database changes to revert
    ]],
  },
}

return migrations
