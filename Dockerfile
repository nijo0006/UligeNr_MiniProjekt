FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=dependencies /app/backend/node_modules ./node_modules
COPY backend/ ./
COPY frontend/ /app/frontend/
COPY specs/001-hotel-operations/fixtures/room-inventory.json /app/specs/001-hotel-operations/fixtures/room-inventory.json
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]

FROM dependencies AS test
ENV NODE_ENV=test
RUN npm ci --no-audit --no-fund
COPY backend/ ./
COPY frontend/ /app/frontend/
COPY specs/001-hotel-operations/fixtures/room-inventory.json /app/specs/001-hotel-operations/fixtures/room-inventory.json
CMD ["npm", "run", "test:integration"]
