# ---- Base ----
    FROM node:20-alpine AS base
    WORKDIR /app
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # ---- Dependencies ----
    FROM base AS deps
    COPY package.json package-lock.json ./
    RUN npm ci
    
    # ---- Build ----
    FROM base AS builder
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN npm run build
    
    # ---- Run ----
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # Create non-root user for security
    RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
    
    # Copy only the standalone output + static assets
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    COPY --from=builder /app/public ./public
    
    RUN mkdir -p /app/.next/cache && chown -R nextjs:nextjs /app
    
    USER nextjs
    EXPOSE 3000
    CMD ["node", "server.js"]
    