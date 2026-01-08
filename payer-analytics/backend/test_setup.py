#!/usr/bin/env python3
"""
Test script to verify backend setup and dependencies
"""

import sys
import importlib

def test_imports():
    """Test if all required packages can be imported"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'psycopg2',
        'pydantic',
        'aiohttp',
        'beautifulsoup4',
        'pandas',
        'requests'
    ]

    failed_imports = []

    for package in required_packages:
        try:
            importlib.import_module(package.replace('-', '_'))
            print(f"✓ {package}")
        except ImportError as e:
            print(f"✗ {package}: {e}")
            failed_imports.append(package)

    return len(failed_imports) == 0

def test_python_version():
    """Check Python version compatibility"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 9:
        print(f"✓ Python version: {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"✗ Python version: {version.major}.{version.minor}.{version.micro} (requires 3.9+)")
        return False

def main():
    """Run all setup tests"""
    print("Testing Payer Analytics Backend Setup")
    print("=" * 40)

    tests = [
        ("Python Version", test_python_version),
        ("Package Imports", test_imports),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1

    print("\n" + "=" * 40)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("✓ Setup looks good! You can proceed with development.")
        return 0
    else:
        print("✗ Some issues found. Please resolve before proceeding.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
