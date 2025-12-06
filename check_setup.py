#!/usr/bin/env python3
"""
Production Setup Verification Script
Run this AFTER building React to verify everything is ready for production.
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(message):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{message.center(60)}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def check_react_build():
    """Verify React build exists."""
    print_header("Checking React Build")
    
    base_dir = Path(__file__).resolve().parent
    dist_dir = base_dir / 'frontend' / 'dist'
    
    checks = {
        'dist directory exists': dist_dir.exists(),
        'index.html exists': (dist_dir / 'index.html').exists(),
        'assets directory exists': (dist_dir / 'assets').exists(),
    }
    
    all_passed = True
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_error(f"{check} - BUILD NOT FOUND")
            all_passed = False
    
    if not all_passed:
        print_warning("\nRun 'npm run build' in the frontend directory first!")
    else:
        # Count assets
        assets_dir = dist_dir / 'assets'
        if assets_dir.exists():
            asset_count = len(list(assets_dir.glob('*')))
            print_success(f"Found {asset_count} asset files")
    
    return all_passed

def check_static_files_collected():
    """Verify Django static files are collected."""
    print_header("Checking Django Static Files")
    
    base_dir = Path(__file__).resolve().parent
    staticfiles_dir = base_dir / 'core' / 'staticfiles'
    
    if not staticfiles_dir.exists():
        print_error("staticfiles directory not found")
        print_warning("Run 'python manage.py collectstatic' in the core directory!")
        return False
    
    # Check for collected files
    collected_files = list(staticfiles_dir.rglob('*'))
    file_count = len([f for f in collected_files if f.is_file()])
    
    if file_count > 0:
        print_success(f"staticfiles directory exists with {file_count} files")
    else:
        print_warning("staticfiles directory is empty")
        print_warning("Run 'python manage.py collectstatic' in the core directory!")
        return False
    
    # Check for React files in staticfiles
    has_react_files = any('index' in str(f) for f in collected_files)
    if has_react_files:
        print_success("React build files found in staticfiles")
    else:
        print_warning("React build files may not be collected")
    
    return True

def check_url_configuration():
    """Verify URL configuration includes React catch-all."""
    print_header("Checking URL Configuration")
    
    base_dir = Path(__file__).resolve().parent
    urls_file = base_dir / 'core' / 'core' / 'urls.py'
    
    if not urls_file.exists():
        print_error("urls.py not found")
        return False
    
    with open(urls_file, 'r') as f:
        content = f.read()
    
    checks = {
        'API routes configured': 'api/' in content,
        'Admin routes configured': 'admin/' in content,
        'Auth routes configured': 'auth/' in content,
        'React catch-all route present': 're_path' in content and 'index.html' in content,
    }
    
    all_passed = True
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_error(f"{check} - NOT CONFIGURED")
            all_passed = False
    
    return all_passed

def check_settings_configuration():
    """Verify settings.py configuration."""
    print_header("Checking Settings Configuration")
    
    base_dir = Path(__file__).resolve().parent
    settings_file = base_dir / 'core' / 'core' / 'settings.py'
    
    if not settings_file.exists():
        print_error("settings.py not found")
        return False
    
    with open(settings_file, 'r') as f:
        content = f.read()
    
    checks = {
        'STATICFILES_DIRS includes frontend/dist': 'frontend' in content and 'dist' in content,
        'WhiteNoise middleware active': 'whitenoise' in content.lower(),
        'STATIC_ROOT configured': 'STATIC_ROOT' in content,
    }
    
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_error(f"{check} - NOT CONFIGURED")
    
    return True

def check_django_can_run():
    """Check if Django can be imported and run."""
    print_header("Checking Django Runtime")
    
    base_dir = Path(__file__).resolve().parent
    core_dir = base_dir / 'core'
    
    # Add core directory to path
    sys.path.insert(0, str(core_dir))
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        import django
        django.setup()
        print_success("Django can be imported and initialized")
        
        from django.conf import settings
        print_success(f"DEBUG mode: {settings.DEBUG}")
        print_success(f"STATIC_URL: {settings.STATIC_URL}")
        print_success(f"STATIC_ROOT: {settings.STATIC_ROOT}")
        
        return True
    except Exception as e:
        print_error(f"Django initialization failed: {str(e)}")
        return False

def print_production_checklist():
    """Print final production deployment checklist."""
    print_header("Production Deployment Checklist")
    
    checklist = [
        ("✓", "React application built (npm run build)"),
        ("✓", "Static files collected (collectstatic)"),
        ("□", "Set DEBUG=False in production .env"),
        ("□", "Set ALLOWED_HOSTS to your domain"),
        ("□", "Set SECRET_KEY to a secure random string"),
        ("□", "Configure production database (PostgreSQL recommended)"),
        ("□", "Set up environment variables on server"),
        ("□", "Run migrations (python manage.py migrate)"),
        ("□", "Create superuser (python manage.py createsuperuser)"),
        ("□", "Set up HTTPS/SSL certificates"),
        ("□", "Configure firewall and security settings"),
        ("□", "Set up monitoring and logging"),
    ]
    
    for status, item in checklist:
        if status == "✓":
            print(f"{GREEN}{status} {item}{RESET}")
        else:
            print(f"{YELLOW}{status} {item}{RESET}")
    
    print(f"\n{BLUE}Production server command:{RESET}")
    print(f"  cd core")
    print(f"  gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3")

def main():
    """Main execution function."""
    print_header("Production Setup Verification")
    
    checks = [
        ("React Build", check_react_build),
        ("Static Files Collection", check_static_files_collected),
        ("URL Configuration", check_url_configuration),
        ("Settings Configuration", check_settings_configuration),
        ("Django Runtime", check_django_can_run),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        try:
            result = check_func()
            if not result:
                all_passed = False
        except Exception as e:
            print_error(f"Error during {check_name}: {str(e)}")
            all_passed = False
    
    print()
    if all_passed:
        print_success("All checks passed! Your application is ready for production.")
        print_production_checklist()
        return 0
    else:
        print_warning("Some checks failed. Review the issues above.")
        print_warning("\nCommon fixes:")
        print("  - Run 'cd frontend && npm run build' to build React")
        print("  - Run 'cd core && python manage.py collectstatic' to collect static files")
        return 1

if __name__ == '__main__':
    sys.exit(main())
