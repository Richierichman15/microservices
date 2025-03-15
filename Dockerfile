# Stage 1: Build and dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for builds
RUN apk --no-cache add python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Stage 2: Runtime
FROM node:18-alpine

# Set environment to production
ENV NODE_ENV=production

# Create app directory and use non-root user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copy from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src /app/src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json /app/

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Set health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/api/health || exit 1

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"] 