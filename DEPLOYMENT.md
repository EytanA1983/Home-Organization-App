# פריסה - Production

מדריך לפריסת המערכת ב-Production עם Docker Swarm / Kubernetes.

## 🏗️ ארכיטקטורת Production

```
┌─────────────────────────────────────────────────────────┐
│                    Ingress (HTTPS)                       │
│              Let's Encrypt (cert-manager)                │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│   Frontend   │  │    Backend   │  │   WebSocket  │
│   (CDN)      │  │   (FastAPI)  │  │   (WS)       │
└──────────────┘  └───────┬───────┘  └──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│  PostgreSQL  │  │    Redis     │  │ Celery Worker│
│  (RDS/Managed)│  │ (Elasticache)│  │  + Beat      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 🚀 אפשרויות פריסה

### 1. Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml eli-maor

# Scale services
docker service scale eli-maor_backend=3
docker service scale eli-maor_worker=2
```

### 2. Kubernetes

ראה קבצים ב-`k8s/`:
- `deployment.yaml` - Deployments לכל services
- `service.yaml` - Services ו-Ingress
- `configmap.yaml` - Configuration
- `secrets.yaml` - Secrets (לא ב-git!)

## 🌐 הקצאת דומיין והגדרת TLS

### 1. הקצאת דומיין

#### רכישת דומיין
- רכוש דומיין מ-registrar (לדוגמה: Namecheap, GoDaddy, Cloudflare)
- דוגמה: `eli-maor.com`

#### הגדרת DNS Records

**אם משתמשים ב-Cloudflare:**
```
Type    Name    Content              TTL
A       @       YOUR_SERVER_IP        Auto
A       www     YOUR_SERVER_IP        Auto
A       api     YOUR_SERVER_IP        Auto
```

**אם משתמשים ב-DNS רגיל:**
```
A Record:     @ → YOUR_SERVER_IP
A Record:     www → YOUR_SERVER_IP
A Record:     api → YOUR_SERVER_IP (או CNAME ל-@)
```

### 2. הגדרת TLS - Let's Encrypt עם Nginx

#### התקנת Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### קבלת תעודות SSL

```bash
# תעודה לדומיין הראשי
sudo certbot --nginx -d eli-maor.com -d www.eli-maor.com

# תעודה ל-subdomain (API)
sudo certbot --nginx -d api.eli-maor.com
```

#### עדכון Nginx Configuration

```nginx
# /etc/nginx/sites-available/eli-maor.com
server {
    listen 80;
    server_name eli-maor.com www.eli-maor.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eli-maor.com www.eli-maor.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/eli-maor.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eli-maor.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Subdomain
server {
    listen 443 ssl http2;
    server_name api.eli-maor.com;

    ssl_certificate /etc/letsencrypt/live/api.eli-maor.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.eli-maor.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### חידוש אוטומטי של תעודות

```bash
# בדיקת חידוש אוטומטי
sudo certbot renew --dry-run

# הוספת cron job לחידוש אוטומטי
sudo crontab -e
# הוסף:
0 0,12 * * * certbot renew --quiet
```

### 3. הגדרת TLS - Cloudflare (אפשרות נוספת)

#### הגדרת Cloudflare

1. **הוספת דומיין ל-Cloudflare**
   - היכנס ל-Cloudflare Dashboard
   - הוסף את הדומיין שלך
   - עדכן את ה-Name Servers ב-registrar

2. **הגדרת SSL/TLS**
   ```
   SSL/TLS → Overview → Full (strict)
   ```

3. **הגדרת DNS Records**
   ```
   Type    Name    Content              Proxy Status
   A       @       YOUR_SERVER_IP        Proxied
   A       www     YOUR_SERVER_IP        Proxied
   A       api     YOUR_SERVER_IP        Proxied
   ```

4. **הגדרת Origin Certificate (אופציונלי)**
   ```bash
   # הורד Origin Certificate מ-Cloudflare Dashboard
   # SSL/TLS → Origin Server → Create Certificate
   
   # העתק ל-server
   sudo mkdir -p /etc/ssl/cloudflare
   sudo cp origin.pem /etc/ssl/cloudflare/
   sudo cp private.key /etc/ssl/cloudflare/
   ```

#### Nginx עם Cloudflare

```nginx
server {
    listen 443 ssl http2;
    server_name eli-maor.com www.eli-maor.com;

    # Cloudflare Origin Certificate (או Let's Encrypt)
    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/private.key;

    # Cloudflare Real IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    # ... שאר ההגדרות כמו קודם
}
```

### 4. Kubernetes - cert-manager

```yaml
# cert-manager installation
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Certificate Issuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@eli-maor.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx

# Ingress עם TLS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: eli-maor-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - eli-maor.com
    - www.eli-maor.com
    secretName: eli-maor-tls
  rules:
  - host: eli-maor.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

## 🗄️ Database

### AWS RDS / Managed PostgreSQL

```yaml
# RDS Configuration
Engine: PostgreSQL 16
Instance: db.t3.medium (min)
Storage: 100GB (auto-scaling)
Backup: Daily, 7 days retention
Multi-AZ: Enabled (production)
```

### Connection String
```
DATABASE_URL=postgresql+psycopg2://user:password@rds-endpoint:5432/eli_maor
```

## 🔴 Redis

### AWS ElastiCache

```yaml
# ElastiCache Configuration
Engine: Redis 7
Node Type: cache.t3.micro (dev) / cache.t3.medium (prod)
Cluster Mode: Disabled (single node)
Backup: Daily snapshots
```

### Connection String
```
REDIS_URL=redis://elasticache-endpoint:6379/0
```

## ⚙️ Celery Beat - High Availability

### Multiple Instances

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-beat
spec:
  replicas: 2  # Multiple instances for HA
  template:
    spec:
      containers:
      - name: beat
        command: ["celery", "-A", "app.workers.celery_app.celery", "beat", "--loglevel=info"]
```

**הערה**: Celery Beat עם מספר מופעים דורש Redis lock mechanism.

## 📦 Frontend - CDN

### Vercel / Netlify

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Vercel
vercel --prod

# Or Netlify
netlify deploy --prod
```

### Environment Variables
```
VITE_API_URL=https://api.yourdomain.com
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## 🔄 CI/CD - GitHub Actions

ראה `.github/workflows/deploy.yml` לפרטים מלאים.

### Pipeline:
1. **Lint** - black, isort, flake8
2. **Test** - pytest עם coverage
3. **Build** - Docker images
4. **Push** - ל-ECR/Docker Hub
5. **Deploy** - ל-Kubernetes/Swarm

## 📊 Monitoring

### Health Checks

```yaml
# Kubernetes Liveness Probe
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

# Readiness Probe
readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Logging

- **Backend**: stdout/stderr → CloudWatch / ELK
- **Celery**: File logs → S3 / CloudWatch
- **Frontend**: Error tracking → Sentry

## 🔐 Security

1. **Secrets Management**: Kubernetes Secrets / AWS Secrets Manager
2. **Network**: VPC isolation, Security Groups
3. **WAF**: CloudFront / AWS WAF
4. **Rate Limiting**: Nginx / API Gateway
5. **CORS**: מוגבל ל-domains מורשים בלבד

## 📈 Scaling

### Auto-scaling

```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🚨 Disaster Recovery

1. **Database Backups**: Daily automated backups
2. **Redis Persistence**: AOF enabled
3. **Application State**: Stateless design
4. **Multi-Region**: אפשרי עם Route53 failover

## 📝 Checklist לפני פריסה

- [ ] Environment variables מוגדרים
- [ ] Secrets מוגדרים ב-Kubernetes/AWS
- [ ] Database migrations רצו
- [ ] SSL certificates מוגדרים
- [ ] Health checks עובדים
- [ ] Monitoring מוגדר
- [ ] Logging מוגדר
- [ ] Backup strategy מוגדרת
- [ ] Scaling policies מוגדרות
- [ ] Security groups מוגדרים
