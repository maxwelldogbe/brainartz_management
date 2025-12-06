# Quick Start - Production Build Commands

## 🚀 When You're Ready to Build for Production

Run these commands in order:

### 1️⃣ Verify Configuration
```bash
python prepare_for_build.py
```
✓ Checks that everything is configured correctly

### 2️⃣ Build React
```bash
cd frontend
npm run build
cd ..
```
✓ Creates production build in `frontend/dist/`

### 3️⃣ Collect Static Files
```bash
cd core
python manage.py collectstatic --noinput
cd ..
```
✓ Copies all static files to `core/staticfiles/`

### 4️⃣ Verify Build
```bash
python check_setup.py
```
✓ Confirms everything is ready

### 5️⃣ Test Locally
```bash
cd core
python manage.py runserver
```
✓ Visit http://localhost:8000 to test

---

## 🔄 For Production Server Deployment

```bash
cd core
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

---

## 💻 Development Mode (Unchanged)

### Django Dev Server
```bash
cd core
python manage.py runserver
```

### React Dev Server
```bash
cd frontend
npm run dev
```

---

## 📝 What Changed?

### Modified Files:
1. **core/core/settings.py**
   - Added `STATICFILES_DIRS` to include React build
   
2. **core/core/urls.py**
   - Added catch-all route to serve React for non-API routes

### New Files:
1. **prepare_for_build.py** - Pre-build verification script
2. **check_setup.py** - Post-build verification script
3. **PRODUCTION_SETUP_GUIDE.md** - Complete deployment guide
4. **QUICK_START.md** - This file

---

## ⚠️ Important Notes

- **Don't run build yet** - Configuration is done, build when ready
- **Development unchanged** - Your dev workflow still works the same
- **No templates needed** - Django serves React's static files directly
- **API routes preserved** - All `/api/`, `/auth/`, `/admin/` routes work
- **React Router works** - Catch-all route handles client-side routing

---

## 🎯 What This Setup Does

1. **React Build** → `frontend/dist/`
2. **Collectstatic** → Copies to `core/staticfiles/`
3. **Django** → Serves everything from one server:
   - API endpoints: `/api/*`, `/auth/*`, `/admin/*`
   - Static files: `/static/*` (includes React JS/CSS)
   - Media files: `/media/*` (uploads)
   - React app: Everything else → serves `index.html`

---

## 🔍 Troubleshooting

**If something doesn't work:**
```bash
python check_setup.py
```

**Common issues:**
- Forgot to build: `cd frontend && npm run build`
- Forgot collectstatic: `cd core && python manage.py collectstatic`
- Static files 404: Check `STATICFILES_DIRS` in settings.py

---

## 📚 Full Documentation

See **PRODUCTION_SETUP_GUIDE.md** for:
- Nginx configuration
- Systemd service setup
- SSL/HTTPS configuration
- Environment variables for production
- Complete deployment checklist
