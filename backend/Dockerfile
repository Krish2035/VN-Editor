# Stage 1: Build & Compile TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install system dependencies (FFmpeg + FFprobe + fonts)
RUN apk add --no-cache ffmpeg ttf-dejavu ttf-droid

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p /app/uploads /app/exports /app/data /app/uploads/tmp && \
    chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]

