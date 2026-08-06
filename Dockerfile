# A3M Router Kong Plugin - Testing Dockerfile
# Builds Kong Gateway with the A3M Router plugin installed

FROM kong:3.4

# Install build dependencies
USER root
RUN apt-get update && apt-get install -y \
    git \
    curl \
    luarocks \
    lua5.1 \
    liblua5.1-0-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for plugin
WORKDIR /usr/local/kong/plugin

# Copy plugin files
COPY kong-plugin/ /usr/local/kong/plugin/a3m_router/

# Set permissions
RUN chown -R kong:kong /usr/local/kong/plugin/a3m_router

# Install OpenResty HTTP library for plugin
RUN luarocks install lua-resty-http || true

# Install Kong plugin (development mode)
USER kong

# Register plugin in Kong's declarative config
# This would typically be done via kong.yml or database

EXPOSE 8000 8443 8001 8444

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

CMD ["kong", "docker-start"]
