# Image RUNTIME Next.js — standalone, non-root, + HEALTHCHECK.
#
# NEXT_PUBLIC_* dibangun dengan nilai placeholder (mis. "__NEXT_PUBLIC_API_BASE_URL__")
# agar dapat diganti di runtime lewat env var sungguhan — tanpa rebuild image.
# Penggantian dilakukan oleh docker-entrypoint.sh sebelum Node.js dijalankan.

# 1) deps
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) build
FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gunakan placeholder — nilai nyata diisi di runtime oleh entrypoint.
ARG NEXT_PUBLIC_API_BASE_URL=__NEXT_PUBLIC_API_BASE_URL__
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
# Widget Chatwoot — opsional; placeholder kosong diganti string kosong di runtime bila
# env tidak di-set (lihat docker-entrypoint.sh), sehingga fitur tetap mati diam.
ARG NEXT_PUBLIC_CHATWOOT_BASE_URL=__NEXT_PUBLIC_CHATWOOT_BASE_URL__
ENV NEXT_PUBLIC_CHATWOOT_BASE_URL=${NEXT_PUBLIC_CHATWOOT_BASE_URL}
ARG NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=__NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN__
ENV NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=${NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN}
RUN npm run build

# 3) runtime
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
