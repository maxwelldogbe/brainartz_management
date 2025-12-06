#!/usr/bin/env python3
"""
Check Vite + Django Production Setup

Validates that the production configuration is correct:
- Vite configuration
- Django settings
- Build output structure
- Static file routing
"""

import os
import json
from pathlib import Path
import re

# Project paths
PROJECT_ROOT = Path(__file__).parent
CORE_DIR = PROJECT_ROOT / 'core'
FRONTEND_DIR = PROJECT_ROOT / 'frontend'
DIST_DIR = FRONTEND_DIR / 'dist'

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def check_vite_config():
    """Check Vite configuration"""
    print(f"\n{Colors.BLUE}📦 Checking Vite Configuration...{Colors.END}")
    
    vite_config = FRONTEND_DIR / 'vite.config.js'
    if not vite_config.exists():
        print(f"  {Colors.RED}✗ vite.config.js not found{Colors.END}")
        return False
    
    content = vite_config.read_text()
    checks = {
        "base: '/'": "base path set to root",
        "outDir: 'dist'": "output directory is 'dist'",
        "assetsDir: 'assets'": "assets directory configured",
        "/api": "API proxy configured",
    }
    
    all_good = True
    for pattern, description in checks.items():
        if pattern in content:
            print(f"  {Colors.GREEN}✓{Colors.END} {description}")
        else:
            print(f"  {Colors.YELLOW}⚠{Colors.END} {description} - not found")
            all_good = False
    
    return all_good

def check_django_settings():
    """Check Django settings"""
    print(f"\n{Colors.BLUE}⚙️  Checking Django Settings...{Colors.END}")
    
    settings_file = CORE_DIR / 'core' / 'settings.py'
    if not settings_file.exists():
        print(f"  {Colors.RED}✗ settings.py not found{Colors.END}")
        return False
    
    content = settings_file.read_text()
    
    checks = {
        "WHITENOISE_ROOT": "WhiteNoise root configured",
        "WHITENOISE_INDEX_FILE": "WhiteNoise index file enabled",
        "'frontend', 'dist', 'assets'": "STATICFILES_DIRS includes dist/assets",
        "BASE_DIR.parent / 'templates'": "Templates directory configured",
    }
    
    # Check CORS is removed
    if 'corsheaders' not in content:
        print(f"  {Colors.GREEN}✓{Colors.END} CORS removed (same origin)")
    else:
        print(f"  {Colors.YELLOW}⚠{Colors.END} CORS still present (not needed)")
    
    all_good = True
    for pattern, description in checks.items():
        if pattern in content:
            print(f"  {Colors.GREEN}✓{Colors.END} {description}")
        else:
            print(f"  {Colors.YELLOW}⚠{Colors.END} {description} - not found")
            all_good = False
    
    return all_good

def check_django_urls():
    """Check Django URL configuration"""
    print(f"\n{Colors.BLUE}🔗 Checking Django URLs...{Colors.END}")
    
    urls_file = CORE_DIR / 'core' / 'urls.py'
    if not urls_file.exists():
        print(f"  {Colors.RED}✗ urls.py not found{Colors.END}")
        return False
    
    content = urls_file.read_text()
    
    # Check catch-all excludes critical paths
    if re.search(r'\^(?!api/\|auth/\|admin/\|media/\|static/\|assets/)', content):
        print(f"  {Colors.GREEN}✓{Colors.END} Catch-all excludes /assets/")
    elif re.search(r'\^(?!api/\|auth/\|admin/\|media/\|static/)', content):
        print(f"  {Colors.YELLOW}⚠{Colors.END} Catch-all may not exclude /assets/")
    else:
        print(f"  {Colors.RED}✗{Colors.END} Catch-all route not found")
        return False
    
    if 'index.html' in content:
        print(f"  {Colors.GREEN}✓{Colors.END} Serves index.html for SPA routing")
    else:
        print(f"  {Colors.RED}✗{Colors.END} index.html serving not configured")
        return False
    
    return True

def check_axios_config():
    """Check axios configuration"""
    print(f"\n{Colors.BLUE}🌐 Checking Axios Configuration...{Colors.END}")
    
    axios_file = FRONTEND_DIR / 'src' / 'utils' / 'axios.js'
    if not axios_file.exists():
        print(f"  {Colors.YELLOW}⚠{Colors.END} axios.js not found (may use different API setup)")
        return True
    
    content = axios_file.read_text()
    
    # Check for relative paths (empty baseURL)
    if "baseURL = isDev ? '' : ''" in content or "baseURL: ''" in content:
        print(f"  {Colors.GREEN}✓{Colors.END} Using relative paths (same origin)")
    elif "localhost:8000" in content and "isDev" not in content:
        print(f"  {Colors.RED}✗{Colors.END} Hardcoded localhost URL found")
        return False
    else:
        print(f"  {Colors.YELLOW}⚠{Colors.END} Check baseURL configuration")
    
    return True

def check_build_output():
    """Check build output structure"""
    print(f"\n{Colors.BLUE}📂 Checking Build Output...{Colors.END}")
    
    if not DIST_DIR.exists():
        print(f"  {Colors.YELLOW}⚠{Colors.END} dist/ not built yet - run 'npm run build'")
        return True  # Not an error, just not built yet
    
    index_html = DIST_DIR / 'index.html'
    assets_dir = DIST_DIR / 'assets'
    
    if index_html.exists():
        print(f"  {Colors.GREEN}✓{Colors.END} index.html exists")
    else:
        print(f"  {Colors.RED}✗{Colors.END} index.html not found in dist/")
        return False
    
    if assets_dir.exists():
        print(f"  {Colors.GREEN}✓{Colors.END} assets/ directory exists")
        
        # Count assets
        js_files = list(assets_dir.glob('*.js'))
        css_files = list(assets_dir.glob('*.css'))
        print(f"  {Colors.GREEN}✓{Colors.END} Found {len(js_files)} JS files, {len(css_files)} CSS files")
    else:
        print(f"  {Colors.RED}✗{Colors.END} assets/ directory not found")
        return False
    
    # Check index.html references
    content = index_html.read_text()
    if '/assets/' in content:
        print(f"  {Colors.GREEN}✓{Colors.END} index.html references /assets/ correctly")
    else:
        print(f"  {Colors.YELLOW}⚠{Colors.END} index.html may not reference assets correctly")
    
    return True

def check_package_json():
    """Check package.json for Vite"""
    print(f"\n{Colors.BLUE}📄 Checking package.json...{Colors.END}")
    
    package_json = FRONTEND_DIR / 'package.json'
    if not package_json.exists():
        print(f"  {Colors.RED}✗ package.json not found{Colors.END}")
        return False
    
    with open(package_json) as f:
        data = json.load(f)
    
    # Check for Vite
    deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
    
    if 'vite' in deps:
        print(f"  {Colors.GREEN}✓{Colors.END} Vite is installed (v{deps['vite']})")
    else:
        print(f"  {Colors.RED}✗{Colors.END} Vite not found in dependencies")
        return False
    
    # Check build script
    scripts = data.get('scripts', {})
    if scripts.get('build') == 'vite build':
        print(f"  {Colors.GREEN}✓{Colors.END} Build script configured correctly")
    else:
        print(f"  {Colors.YELLOW}⚠{Colors.END} Build script: {scripts.get('build', 'not found')}")
    
    return True

def print_summary(results):
    """Print summary"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}📊 VALIDATION SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    passed = sum(results.values())
    total = len(results)
    
    for check, result in results.items():
        icon = f"{Colors.GREEN}✓{Colors.END}" if result else f"{Colors.RED}✗{Colors.END}"
        print(f"  {icon} {check}")
    
    print(f"\n{Colors.BLUE}Result: {passed}/{total} checks passed{Colors.END}\n")
    
    if passed == total:
        print(f"{Colors.GREEN}✨ All checks passed! Ready for production build.{Colors.END}\n")
        return True
    else:
        print(f"{Colors.YELLOW}⚠️  Some checks failed. Review the issues above.{Colors.END}\n")
        return False

def main():
    """Main execution"""
    print(f"\n{Colors.BLUE}🔍 BrainArtz Vite + Django Setup Validator{Colors.END}")
    
    results = {
        "Package.json": check_package_json(),
        "Vite Config": check_vite_config(),
        "Django Settings": check_django_settings(),
        "Django URLs": check_django_urls(),
        "Axios Config": check_axios_config(),
        "Build Output": check_build_output(),
    }
    
    success = print_summary(results)
    
    if not success:
        print(f"{Colors.BLUE}Next Steps:{Colors.END}")
        print("  1. Run: python prepare_production.py")
        print("  2. Fix any configuration issues")
        print("  3. Run this check again")
        print("  4. Build: cd frontend && npm run build")
        print("  5. Collect static: cd core && python manage.py collectstatic\n")
    
    return 0 if success else 1

if __name__ == '__main__':
    exit(main())
