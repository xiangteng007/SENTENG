# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files FIRST for better layer caching (CI3)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install ALL dependencies (including devDependencies for build)
# Using --legacy-peer-deps to resolve peer dependency conflicts
RUN npm install --legacy-peer-deps --production=false

# Copy source code (this layer busts cache only when code changes)
COPY src ./src

# Build the application
RUN npm run build

# Verify dist was created
RUN test -f dist/main.js && echo "✅ main.js found"

# Production stage — only production deps
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production-only deps
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run the application
CMD ["node", "dist/main.js"]
