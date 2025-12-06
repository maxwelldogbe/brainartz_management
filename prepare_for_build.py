#!/usr/bin/env python3
"""
Production Setup Preparation Script
This script prepares the Django-React application for production build.
Run this BEFORE running 'npm run build' in the frontend directory.
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

def print_info(message):
    print(f"{BLUE}ℹ {message}{RESET}")

def check_directory_structure():
    """Verify the project directory structure."""
    print_header("Checking Directory Structure")
    
    base_dir = Path(__file__).resolve().parent
    core_dir = base_dir / 'core'
    frontend_dir = base_dir / 'frontend'
    
    checks = {
        'Core (Django) directory': core_dir.exists(),
        'Frontend (React) directory': frontend_dir.exists(),
        'Django settings.py': (core_dir / 'core' / 'settings.py').exists(),
        'Django urls.py': (core_dir / 'core' / 'urls.py').exists(),
        'React package.json': (frontend_dir / 'package.json').exists(),
        'React vite.config.js': (frontend_dir / 'vite.config.js').exists(),
    }
    
    all_passed = True
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_error(f"{check} - NOT FOUND")
            all_passed = False
    
    return all_passed

def check_django_configuration():
    """Check Django settings for production readiness."""
    print_header("Checking Django Configuration")
    
    base_dir = Path(__file__).resolve().parent
    settings_file = base_dir / 'core' / 'core' / 'settings.py'
    
    if not settings_file.exists():
        print_error("settings.py not found")
        return False
    
    with open(settings_file, 'r') as f:
        content = f.read()
    
    checks = {
        'WhiteNoise middleware configured': 'whitenoise.middleware.WhiteNoiseMiddleware' in content,
        'STATIC_ROOT configured': 'STATIC_ROOT' in content,
        'STATICFILES_DIRS configured': 'STATICFILES_DIRS' in content,
        'CORS headers installed': 'corsheaders' in content,
        'Static files storage configured': 'STATICFILES_STORAGE' in content or 'CompressedManifestStaticFilesStorage' in content,
    }
    
    all_passed = True
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_warning(f"{check} - May need attention")
            all_passed = False
    
    return all_passed

def check_react_configuration():
    """Check React configuration for production build."""
    print_header("Checking React Configuration")
    
    base_dir = Path(__file__).resolve().parent
    package_json = base_dir / 'frontend' / 'package.json'
    vite_config = base_dir / 'frontend' / 'vite.config.js'
    
    if not package_json.exists():
        print_error("package.json not found")
        return False
    
    import json
    with open(package_json, 'r') as f:
        package_data = json.load(f)
    
    checks = {
        'Build script exists': 'build' in package_data.get('scripts', {}),
        'React installed': 'react' in package_data.get('dependencies', {}),
        'Axios installed': 'axios' in package_data.get('dependencies', {}),
        'Vite config exists': vite_config.exists(),
    }
    
    all_passed = True
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_error(f"{check} - NOT FOUND")
            all_passed = False
    
    return all_passed

def check_api_configuration():
    """Check if React API calls are properly configured."""
    print_header("Checking API Configuration")
    
    base_dir = Path(__file__).resolve().parent
    axios_file = base_dir / 'frontend' / 'src' / 'utils' / 'axios.js'
    
    if not axios_file.exists():
        print_warning("axios.js not found - using default fetch might be ok")
        return True
    
    with open(axios_file, 'r') as f:
        content = f.read()
    
    checks = {
        'Axios instance configured': 'axios.create' in content,
        'Base URL handling': 'baseURL' in content,
        'Auth token interceptor': 'interceptor' in content.lower(),
    }
    
    for check, passed in checks.items():
        if passed:
            print_success(check)
        else:
            print_warning(f"{check} - May need review")
    
    return True

def check_environment_files():
    """Check environment configuration."""
    print_header("Checking Environment Configuration")
    
    base_dir = Path(__file__).resolve().parent
    
    files = {
        'Django .env': base_dir / 'core' / '.env',
        'React .env.development': base_dir / 'frontend' / '.env.development',
    }
    
    for name, file_path in files.items():
        if file_path.exists():
            print_success(f"{name} exists")
        else:
            print_warning(f"{name} not found (may be optional)")
    
    return True

def check_requirements():
    """Check if all required Python packages are listed."""
    print_header("Checking Python Requirements")
    
    base_dir = Path(__file__).resolve().parent
    requirements_file = base_dir / 'core' / 'requirements.txt'
    
    if not requirements_file.exists():
        print_error("requirements.txt not found")
        return False
    
    with open(requirements_file, 'r') as f:
        requirements = f.read().lower()
    
    required_packages = {
        'Django': 'django' in requirements,
        'Django REST Framework': 'djangorestframework' in requirements,
        'WhiteNoise': 'whitenoise' in requirements,
        'Gunicorn': 'gunicorn' in requirements,
        'CORS Headers': 'django-cors-headers' in requirements or 'corsheaders' in requirements,
    }
    
    all_passed = True
    for package, installed in required_packages.items():
        if installed:
            print_success(f"{package} listed in requirements.txt")
        else:
            print_error(f"{package} NOT listed in requirements.txt")
            all_passed = False
    
    return all_passed

def print_next_steps():
    """Print the next steps for the user."""
    print_header("Setup Complete - Next Steps")
    
    print(f"{GREEN}Your application is configured for production!{RESET}\n")
    
    print(f"{BLUE}When you're ready to build for production, follow these steps:{RESET}\n")
    
    steps = [
        ("1. Build React Application", [
            "cd frontend",
            "npm run build",
            "cd .."
        ]),
        ("2. Collect Static Files", [
            "cd core",
            "python manage.py collectstatic --noinput",
            "cd .."
        ]),
        ("3. Test Production Setup", [
            "python check_setup.py"
        ]),
        ("4. Run Server", [
            "cd core",
            "# For development testing:",
            "python manage.py runserver",
            "",
            "# For production deployment:",
            "gunicorn core.wsgi:application --bind 0.0.0.0:8000"
        ]),
    ]
    
    for title, commands in steps:
        print(f"\n{YELLOW}{title}:{RESET}")
        for cmd in commands:
            if cmd.startswith('#'):
                print(f"  {BLUE}{cmd}{RESET}")
            elif cmd == "":
                print()
            else:
                print(f"  $ {cmd}")
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}Note: Your development workflow remains unchanged!{RESET}")
    print(f"  - Django dev server: cd core && python manage.py runserver")
    print(f"  - React dev server: cd frontend && npm run dev")
    print(f"{BLUE}{'='*60}{RESET}\n")

def main():
    """Main execution function."""
    print_header("Django-React Production Setup Checker")
    
    checks = [
        ("Directory Structure", check_directory_structure),
        ("Django Configuration", check_django_configuration),
        ("React Configuration", check_react_configuration),
        ("API Configuration", check_api_configuration),
        ("Environment Files", check_environment_files),
        ("Python Requirements", check_requirements),
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
        print_success("All checks passed! Your application is ready for production build.")
        print_next_steps()
        return 0
    else:
        print_warning("Some checks failed. Review the issues above before proceeding.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
