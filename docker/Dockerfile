# syntax=docker/dockerfile:1
#
# Multi-stage build for the ruakh SvelteKit app (adapter-node).
# The final image ships ONLY the compiled server, runtime deps, and the
# migration SQL — no source, no .svelte-kit/, no build tooling.

# Stage 1 — install all dependencies (incl. dev) needed to build
# ##############################################################
FROM node:22-alpine AS deps
WORKDIR /app
# Only the manifest + lockfile, so this layer caches across source changes.
# --ignore-scripts skips the `prepare` (svelte-kit sync) hook here; the Vite
# plugin runs sync automatically during the build stage instead.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts


# Stage 2 — build the app, then prune to production dependencies
# ##############################################################
FROM node:22-alpine AS builder
WORKDIR /app
# Production build: Vite compiles Svelte with dev:false, enabling minification,
# dead-code elimination, CSS extraction/minification and hydration optimisation.
ENV NODE_ENV=production
# Placeholder to satisfy SvelteKit's build-time analyse pass, which imports the
# server DB module (it throws if DATABASE_URL is unset). postgres-js connects
# lazily so nothing is dialled at build, and $env/dynamic/private is read at
# RUNTIME — the real value comes from the env file, never baked into the image.
ENV DATABASE_URL="postgres://build:build@localhost:5432/build"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Drop devDependencies so only runtime packages ship in the final image.
RUN npm prune --omit=dev


# Stage 3 — minimal production runtime
# ##############################################################
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# adapter-node output (bundles static/ into build/client), pruned runtime deps,
# and the migration assets — nothing else.
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --chown=node:node docker/migrate.mjs ./migrate.mjs

# Run as the unprivileged user that ships with the node image.
USER node
EXPOSE 3000

# Apply any pending migrations (idempotent; retries until Postgres is ready),
# then start the server. Run exactly one instance — the reminder scheduler is
# in-process (see README).
CMD ["sh", "-c", "node migrate.mjs && node build"]
