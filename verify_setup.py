#!/usr/bin/env python3
"""
Setup verification script for Yara AI Voice Assistant
Checks that all requirements are met before running the application
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if Path(filepath).exists():
        print(f"✓ {description}: Found")
        return True
    else:
        print(f"✗ {description}: Missing")
        return False

def check_env_var(var_name, required=True):
    """Check if environment variable is set"""
    value = os.getenv(var_name)

    if not value:
        if required:
            print(f"✗ {var_name}: Not set (REQUIRED)")
            return False
        else:
            print(f"⚠ {var_name}: Not set (optional)")
            return True

    # Check for placeholder values
    placeholders = [
        'your-secret-key',
        'your-google-api-key',
        'your-supabase',
        'your-password',
        'use-your-key',
        'change-this'
    ]

    if any(placeholder in value.lower() for placeholder in placeholders):
        print(f"⚠ {var_name}: Using placeholder value (needs to be updated)")
        return False

    print(f"✓ {var_name}: Set")
    return True

def main():
    """Run all verification checks"""
    print("=" * 60)
    print("Yara AI Voice Assistant - Setup Verification")
    print("=" * 60)
    print()

    all_checks_passed = True

    # Check required files
    print("Checking required files...")
    print("-" * 60)

    files_to_check = [
        ('.env', '.env file'),
        ('requirements.txt', 'Requirements file'),
        ('run.py', 'Application entry point'),
        ('app/__init__.py', 'App package'),
        ('app/config.py', 'Configuration module'),
    ]

    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_checks_passed = False

    print()

    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✓ Loaded .env file")
    except ImportError:
        print("⚠ python-dotenv not installed, attempting to load .env manually")
        # Try to load manually
        if Path('.env').exists():
            with open('.env') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            os.environ[key] = value

    print()

    # Check environment variables
    print("Checking environment variables...")
    print("-" * 60)

    required_vars = [
        ('SECRET_KEY', True),
        ('GOOGLE_API_KEY', True),
        ('DATABASE_URL', True),
        ('SUPABASE_URL', True),
        ('SUPABASE_ANON_KEY', True),
    ]

    optional_vars = [
        ('OPENAI_API_KEY', False),
        ('FLASK_DEBUG', False),
    ]

    for var, required in required_vars:
        if not check_env_var(var, required):
            all_checks_passed = False

    for var, required in optional_vars:
        check_env_var(var, required)

    print()

    # Check database URL format
    print("Checking database configuration...")
    print("-" * 60)

    db_url = os.getenv('DATABASE_URL', '')
    if db_url.startswith('postgresql://'):
        print("✓ Database URL: PostgreSQL (recommended)")
    elif db_url.startswith('sqlite://'):
        print("⚠ Database URL: SQLite (not recommended for production)")
    else:
        print("✗ Database URL: Invalid format")
        all_checks_passed = False

    print()

    # Summary
    print("=" * 60)
    if all_checks_passed:
        print("✓ All checks passed! You're ready to run the application.")
        print()
        print("Start the application with:")
        print("  python run.py")
        print()
        print("Then visit: http://localhost:5000")
        print("Health check: http://localhost:5000/health")
        return 0
    else:
        print("✗ Some checks failed. Please fix the issues above.")
        print()
        print("Common fixes:")
        print("  1. Copy .env.example to .env: cp .env.example .env")
        print("  2. Edit .env and add your API keys")
        print("  3. Get Google API key: https://makersuite.google.com/app/apikey")
        print("  4. Get Supabase credentials: https://supabase.com/dashboard")
        return 1

if __name__ == '__main__':
    sys.exit(main())
