# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Debug: verify dist was created (main.js should be at dist/main.js)
RUN echo "=== Dist contents ===" && ls -la dist/ && echo "=== main.js check ===" && test -f dist/main.js && echo "main.js found!"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run the application (NestJS compiles to dist/main.js)
CMD ["node", "dist/main.js"]
