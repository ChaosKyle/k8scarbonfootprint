# Multi-stage build for security and efficiency
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Add security: Create non-root user
RUN addgroup -g 1001 -S grafana && \
    adduser -S grafana -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies with security audit
RUN npm ci --only=production && \
    npm audit --audit-level=moderate

# Copy source code
COPY src/ ./src/
COPY plugin.json ./
COPY tsconfig.json ./

# Build frontend
RUN npm run build

# Go backend builder
FROM golang:1.21-alpine AS backend-builder

# Security: Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates git

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && \
    go mod verify

# Copy source code
COPY pkg/ ./pkg/

# Build with security flags
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o k8scarbonfootprint \
    ./pkg

# Final stage - minimal runtime image
FROM alpine:3.18

# Security: Install ca-certificates and create non-root user
RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 1001 -S grafana && \
    adduser -S grafana -u 1001 -G grafana

# Set working directory
WORKDIR /var/lib/grafana/plugins/k8scarbonfootprint

# Copy built artifacts
COPY --from=frontend-builder --chown=grafana:grafana /app/dist ./
COPY --from=backend-builder --chown=grafana:grafana /app/k8scarbonfootprint ./
COPY --chown=grafana:grafana plugin.json ./

# Security: Set proper permissions
RUN chmod +x k8scarbonfootprint && \
    chown -R grafana:grafana /var/lib/grafana/plugins/k8scarbonfootprint

# Switch to non-root user
USER grafana

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ./k8scarbonfootprint --help || exit 1

# Expose plugin port (if needed)
EXPOSE 8080

# Run the plugin
ENTRYPOINT ["./k8scarbonfootprint"]