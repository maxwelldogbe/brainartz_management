#!/usr/bin/env python3
"""
Prepare Django + Vite React for Production Build

This script prepares the project structure for production deployment:
1. Creates necessary directories
2. Cleans old build artifacts
3. Validates configuration
4. Provides build instructions
"""

import os
import shutil
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent
CORE_DIR = PROJECT_ROOT / 'core'
FRONTEND_DIR = PROJECT_ROOT / 'frontend'
TEMPLATES_DIR = PROJECT_ROOT / 'templates'
STATICFILES_DIR = CORE_DIR / 'staticfiles'
DIST_DIR = FRONTEND_DIR / 'dist'

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    # Create templates directory
    TEMPLATES_DIR.mkdir(exist_ok=True)
    print(f"  ✓ Created: {TEMPLATES_DIR}")
    
    # Create placeholder index.html in templates
    placeholder_html = TEMPLATES_DIR / 'index.html'
    if not placeholder_html.exists():
        placeholder_html.write_text("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BrainArtz Management</title>
</head>
<body>
    <div id="root">
        <h1>Build React App First</h1>
        <p>Run: cd frontend && npm run build</p>
    </div>
</body>
</html>""")
        print(f"  ✓ Created placeholder: {placeholder_html}")

def clean_build_artifacts():
    """Clean old build artifacts"""
    print("\n🧹 Cleaning old build artifacts...")
    
    # Clean Django staticfiles
    if STATICFILES_DIR.exists():
        shutil.rmtree(STATICFILES_DIR)
        print(f"  ✓ Removed: {STATICFILES_DIR}")
    
    # Clean React dist
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
        print(f"  ✓ Removed: {DIST_DIR}")

def validate_configuration():
    """Validate project configuration"""
    print("\n✅ Validating configuration...")
    
    issues = []
    
    # Check frontend setup
    if not FRONTEND_DIR.exists():
        issues.append("❌ Frontend directory not found")
    else:
        print("  ✓ Frontend directory exists")
        
        package_json = FRONTEND_DIR / 'package.json'
        if not package_json.exists():
            issues.append("❌ package.json not found")
        else:
            print("  ✓ package.json exists")
        
        vite_config = FRONTEND_DIR / 'vite.config.js'
        if not vite_config.exists():
            issues.append("❌ vite.config.js not found")
        else:
            print("  ✓ vite.config.js exists")
    
    # Check Django setup
    if not CORE_DIR.exists():
        issues.append("❌ Core directory not found")
    else:
        print("  ✓ Core directory exists")
        
        settings = CORE_DIR / 'core' / 'settings.py'
        if not settings.exists():
            issues.append("❌ settings.py not found")
        else:
            print("  ✓ settings.py exists")
        
        urls = CORE_DIR / 'core' / 'urls.py'
        if not urls.exists():
            issues.append("❌ urls.py not found")
        else:
            print("  ✓ urls.py exists")
    
    return issues

def print_build_instructions():
    """Print step-by-step build instructions"""
    print("\n" + "="*60)
    print("🚀 PRODUCTION BUILD INSTRUCTIONS")
    print("="*60)
    print("""
1. Build React Frontend:
   cd frontend
   npm install
   npm run build
   cd ..

2. Collect Django Static Files:
   cd core
   python manage.py collectstatic --noinput
   cd ..

3. Run Django Server:
   cd core
   python manage.py runserver
   
4. Test Production Build:
   Open: http://localhost:8000
   
   ✓ React app should load
   ✓ Static files (CSS/JS) should work
   ✓ API calls should use /api/ paths
   ✓ No CORS errors (same origin)

IMPORTANT NOTES:
- Frontend builds to: frontend/dist/
- Assets go to: frontend/dist/assets/
- Django serves from: staticfiles/ (after collectstatic)
- No CORS needed (same origin deployment)
- Dev workflow unchanged (Vite dev server + Django)

TROUBLESHOOTING:
- If CSS/JS not loading: Check browser console for 404s
- If MIME type errors: Ensure WhiteNoise is configured
- If API errors: Check axios baseURL is empty string
- If routing issues: Verify catch-all excludes /assets/

For detailed configuration, see:
- core/core/settings.py (STATICFILES_DIRS, WHITENOISE)
- core/core/urls.py (catch-all route)
- frontend/vite.config.js (base: '/')
- frontend/src/utils/axios.js (baseURL)
""")
    print("="*60)

def main():
    """Main execution"""
    print("\n🔧 BrainArtz Production Setup\n")
    
    # Step 1: Create directories
    create_directories()
    
    # Step 2: Clean artifacts
    clean_build_artifacts()
    
    # Step 3: Validate
    issues = validate_configuration()
    
    if issues:
        print("\n⚠️  Configuration Issues:")
        for issue in issues:
            print(f"  {issue}")
        print("\nPlease fix these issues before building.")
        return 1
    
    # Step 4: Print instructions
    print_build_instructions()
    
    print("✨ Setup complete! Follow the build instructions above.\n")
    return 0

if __name__ == '__main__':
    exit(main())
