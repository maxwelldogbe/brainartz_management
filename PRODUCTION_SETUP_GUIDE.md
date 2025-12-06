# Production Setup Guide

## 🎯 Overview
Your Django-React application is now configured for production deployment. This guide explains what was configured and how to proceed.

## ✅ What Was Configured

### 1. Django Settings (`core/core/settings.py`)
- ✓ **STATICFILES_DIRS**: Now includes `frontend/dist` to collect React build files
- ✓ **WhiteNoise**: Already configured to serve static files efficiently
- ✓ **CORS**: Already configured for development/production
- ✓ **Static files storage**: Using CompressedManifestStaticFilesStorage

### 2. Django URLs (`core/core/urls.py`)
- ✓ **API routes**: All existing routes preserved (`/api/`, `/auth/`, `/admin/`)
- ✓ **Media files**: Properly configured to serve uploaded files
- ✓ **React catch-all**: Added route to serve React's index.html for all non-API routes
- ✓ **React Router support**: Enables client-side routing to work properly

### 3. React Configuration (Unchanged)
- ✓ **Vite proxy**: Development proxy still works (localhost:5173 → localhost:8000)
- ✓ **Axios configuration**: Uses relative paths in production, proxy in development
- ✓ **Environment variables**: `.env.development` for dev, production will use empty baseURL

### 4. Scripts Created
- ✓ **prepare_for_build.py**: Validates configuration before building
- ✓ **check_setup.py**: Verifies build is ready for deployment

---

## 🚀 Step-by-Step Production Build Process

### **Step 1: Verify Configuration**
```bash
python prepare_for_build.py
```
This checks that everything is properly configured before building.

### **Step 2: Build React Application**
```bash
cd frontend
npm run build
cd ..
```
This creates the production-optimized React build in `frontend/dist/`.

### **Step 3: Collect Static Files**
```bash
cd core
python manage.py collectstatic --noinput
cd ..
```
This copies all static files (including React build) to `core/staticfiles/`.

### **Step 4: Verify Build**
```bash
python check_setup.py
```
This verifies that the build completed successfully and everything is ready.

### **Step 5: Test Locally**
```bash
cd core
python manage.py runserver
```
Then visit `http://localhost:8000` - you should see your React app served by Django!

---

## 🔧 Development Workflow (Unchanged)

Your development workflow remains the same:

### Running Django Dev Server
```bash
cd core
python manage.py runserver
# Runs on http://localhost:8000
```

### Running React Dev Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
# API calls proxy to localhost:8000
```

---

## 🌐 Production Deployment

### For VPS/Server Deployment

#### 1. Set Environment Variables
Create/update `core/.env` for production:
```env
DJANGO_SECRET_KEY='your-secure-secret-key-here'
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database (recommended: PostgreSQL)
DATABASE_URL=postgres://user:password@localhost:5432/dbname

# Email configuration
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# SMS Configuration
TELECONIC_API_KEY=your_api_key_here
TELECONIC_SENDER_ID=BrainArtz

# Redis (for WebSockets in production)
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### 2. Install Dependencies
```bash
cd core
pip install -r requirements.txt
```

#### 3. Run Migrations
```bash
python manage.py migrate
```

#### 4. Create Superuser
```bash
python manage.py createsuperuser
```

#### 5. Build and Collect Static Files
```bash
cd ../frontend
npm run build
cd ../core
python manage.py collectstatic --noinput
```

#### 6. Run with Gunicorn
```bash
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Using Nginx (Recommended)

Create `/etc/nginx/sites-available/brainartz`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /static/ {
        alias /path/to/brainartz_management/core/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /path/to/brainartz_management/core/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/brainartz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Using Systemd Service

Create `/etc/systemd/system/brainartz.service`:
```ini
[Unit]
Description=BrainArtz Management System
After=network.target

[Service]
Type=notify
User=your-user
Group=www-data
WorkingDirectory=/path/to/brainartz_management/core
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 3
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start brainartz
sudo systemctl enable brainartz
sudo systemctl status brainartz
```

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in production environment
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use a strong, random `SECRET_KEY`
- [ ] Switch to PostgreSQL database
- [ ] Set up proper email backend (SMTP)
- [ ] Configure environment variables securely
- [ ] Run migrations on production database
- [ ] Create superuser account
- [ ] Build React (`npm run build`)
- [ ] Collect static files (`collectstatic`)
- [ ] Set up HTTPS with SSL certificates (Let's Encrypt)
- [ ] Configure firewall (allow 80, 443, SSH only)
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Test all functionality in production environment

---

## 🔍 Troubleshooting

### React Routes Return 404
**Problem**: Direct navigation to React routes (e.g., `/portal/dashboard`) returns 404.
**Solution**: The catch-all route in `urls.py` should handle this. Verify:
1. React build exists: `ls frontend/dist/index.html`
2. URL configuration includes catch-all route
3. Run `python check_setup.py`

### Static Files Not Loading
**Problem**: CSS/JS files return 404 errors.
**Solution**:
1. Run `python manage.py collectstatic --noinput`
2. Check `STATIC_ROOT` and `STATICFILES_DIRS` in settings
3. Verify WhiteNoise is in MIDDLEWARE

### API Calls Failing
**Problem**: Frontend can't reach Django API.
**Solution**:
1. Check browser console for CORS errors
2. Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
3. Ensure API routes are before catch-all route in `urls.py`

### WebSocket Connection Issues
**Problem**: Real-time notifications not working.
**Solution**:
1. Install Redis: `sudo apt install redis-server`
2. Configure `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Ensure Nginx/proxy supports WebSocket upgrades

---

## 📊 Monitoring & Maintenance

### Log Files
- Django logs: Check your logging configuration
- Nginx access: `/var/log/nginx/access.log`
- Nginx errors: `/var/log/nginx/error.log`
- Systemd service: `journalctl -u brainartz -f`

### Performance Optimization
- Enable Gzip compression in Nginx
- Use CDN for static files (optional)
- Configure database connection pooling
- Set up caching (Redis/Memcached)
- Monitor server resources (CPU, RAM, disk)

---

## 🆘 Support

If you encounter issues:
1. Run `python check_setup.py` to diagnose problems
2. Check Django logs for errors
3. Verify all environment variables are set
4. Test with `DEBUG=True` locally first
5. Check firewall and security group settings

---

## 📚 Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [WhiteNoise Documentation](http://whitenoise.evans.io/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt SSL](https://letsencrypt.org/)

---

**Note**: This configuration maintains full backward compatibility with your development workflow. You can continue developing with separate Django and React servers as before.
