# ===============================
# Build Stage
# ===============================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# ===============================
# Production Stage
# ===============================
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta
ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts 
COPY docker-entrypoint.sh .

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]