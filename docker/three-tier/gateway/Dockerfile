FROM node:22-alpine
WORKDIR /app
COPY docker/three-tier/gateway/server.mjs ./docker/three-tier/gateway/server.mjs
COPY packages/tenant-routing/index.mjs ./packages/tenant-routing/index.mjs
USER node
EXPOSE 4100
CMD ["node", "docker/three-tier/gateway/server.mjs"]
