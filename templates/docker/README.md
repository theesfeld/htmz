# Deploy htmz with Docker

Deploy your htmz application using Docker containers with secure environment variable support.

## Quick Start

### 1. Copy deployment files

Copy these files to your htmz project root:

```bash
cp templates/docker/Dockerfile ./
cp templates/docker/docker-compose.yml ./
cp templates/docker/nginx.conf ./
```

### 2. Create .env file

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

### 3. Build and run

```bash
docker-compose up -d
```

Your app will be available at:
- **Web app**: http://localhost:8000
- **Proxy server**: http://localhost:3001
- **With nginx**: http://localhost (port 80)

## Environment Variables

Environment variables are loaded from your `.env` file:

```bash
# .env
GITHUB_API=https://api.github.com
GITHUB_TOKEN=your_actual_token_here
API_KEY=your_api_key_here
NODE_ENV=production
```

## Deployment Options

### Basic Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### With Nginx Reverse Proxy

```bash
# Include nginx service
docker-compose --profile with-nginx up -d
```

Benefits:
- Single port (80) entry point
- Load balancing
- SSL termination support
- Security headers
- Static file caching

### With Monitoring

```bash
# Include Prometheus and Grafana
docker-compose --profile monitoring up -d
```

Access:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

## Production Setup

### 1. SSL/HTTPS

Add SSL certificates to nginx:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of config
}
```

### 2. Scaling

Scale the application:

```bash
docker-compose up -d --scale htmz-app=3
```

### 3. Persistent Logs

Add volume for logs:

```yaml
volumes:
  - ./logs:/app/logs
```

## Health Checks

The container includes health checks:

```bash
# Check health
docker-compose ps

# Manual health check
curl http://localhost:3001/health
```

## Environment-Specific Configs

### Development
```yaml
environment:
  - NODE_ENV=development
  - DEBUG=true
```

### Production
```yaml
environment:
  - NODE_ENV=production
  - DEBUG=false
```

## Security Considerations

1. **Non-root user**: Container runs as user `htmz` (UID 1001)
2. **Security headers**: Added via nginx
3. **Health checks**: Built-in monitoring
4. **Environment variables**: Securely loaded from `.env`

## Kubernetes Deployment

Convert to Kubernetes:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/latest/download/kompose-linux-amd64 -o kompose
chmod +x kompose && sudo mv kompose /usr/local/bin

# Convert docker-compose to k8s
kompose convert

# Deploy
kubectl apply -f .
```

## Cloud Deployment

### AWS ECS

1. Build and push to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t htmz-app .
docker tag htmz-app:latest <account>.dkr.ecr.us-east-1.amazonaws.com/htmz-app:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/htmz-app:latest
```

2. Create ECS task definition and service

### Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/htmz-app
gcloud run deploy --image gcr.io/PROJECT-ID/htmz-app --platform managed
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Permission denied**: Check file ownership
3. **Environment variables not loading**: Verify .env file syntax

### Debug Commands

```bash
# View logs
docker-compose logs htmz-app

# Enter container
docker-compose exec htmz-app sh

# Test proxy
curl http://localhost:3001/health
```