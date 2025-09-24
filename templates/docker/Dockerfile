# htmz Docker deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY proxy/package*.json ./proxy/

# Install dependencies
RUN npm install
RUN cd proxy && npm install

# Copy application files
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S htmz && \
    adduser -S htmz -u 1001

# Change ownership
RUN chown -R htmz:htmz /app
USER htmz

# Expose ports
EXPOSE 8000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start both web server and proxy
CMD ["sh", "-c", "node proxy/server.js & python3 -m http.server 8000 & wait"]