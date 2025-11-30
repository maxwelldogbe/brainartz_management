#!/usr/bin/env python
"""
Test script for Teleconic SMS Integration

This script allows you to test the Teleconic SMS functionality.
Usage: python test_teleconic_sms.py
"""

import os
import sys
import django

# Add the Django project path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.sms_backends import send_sms, send_teleconic_sms, normalize_phone_number
from django.conf import settings


def test_teleconic_configuration():
    """Check if Teleconic is properly configured."""
    print("=== Checking Teleconic Configuration ===")
    
    api_key = getattr(settings, 'TELECONIC_API_KEY', None)
    sender_id = getattr(settings, 'TELECONIC_SENDER_ID', 'BrainArtz')
    api_url = getattr(settings, 'TELECONIC_API_URL', 'https://sms.teleconic.com/api/v1/send')
    
    print(f"API Key: {'[+] Configured' if api_key else '[X] Not configured'}")
    print(f"Sender ID: {sender_id}")
    print(f"API URL: {api_url}")
    
    if not api_key:
        print("\n[!]  Warning: TELECONIC_API_KEY is not set in environment variables.")
        print("   Please add it to your .env file.")
        return False
    
    return True


def test_phone_normalization():
    """Test phone number normalization for different formats."""
    print("\n=== Testing Phone Number Normalization ===")
    
    test_numbers = [
        "0241234567",           # Ghana local
        "+233241234567",        # Ghana international
        "024-123-4567",         # With dashes
        "(024) 123 4567",       # With parentheses
        "+233 24 123 4567",     # With spaces
        "0501234567",           # Different Ghana carrier
    ]
    
    for number in test_numbers:
        normalized = normalize_phone_number(number)
        print(f"{number:20} -> {normalized}")


def test_send_sms(phone_number: str, test_mode: bool = True):
    """Test sending SMS via Teleconic."""
    print(f"\n=== Testing SMS Send to {phone_number} ===")
    
    if test_mode:
        print("Running in TEST MODE - no actual SMS will be sent")
        print("Set test_mode=False to send real SMS")
        return
    
    message = (
        "Hello from BrainArtz Management System! "
        "This is a test message from Teleconic SMS integration. "
        "If you received this, the integration is working correctly."
    )
    
    print(f"Message: {message[:50]}...")
    print(f"Length: {len(message)} characters")
    
    # Normalize phone number
    normalized_phone = normalize_phone_number(phone_number)
    print(f"Normalized phone: {normalized_phone}")
    
    # Send SMS
    success = send_sms(normalized_phone, message)
    
    if success:
        print("[+] SMS sent successfully!")
        return True
    else:
        print("[X] Failed to send SMS")
        return False


def test_teleconic_direct(phone_number: str, test_mode: bool = True):
    """Test sending SMS directly via Teleconic backend."""
    print(f"\n=== Testing Direct Teleconic API Call ===")
    
    if test_mode:
        print("Running in TEST MODE - no actual SMS will be sent")
        print("Set test_mode=False to send real SMS")
        return
    
    message = "Direct Teleconic test from BrainArtz Management."
    normalized_phone = normalize_phone_number(phone_number)
    
    success = send_teleconic_sms(normalized_phone, message)
    
    if success:
        print("[+] Direct Teleconic SMS sent successfully!")
        return True
    else:
        print("[X] Failed to send direct Teleconic SMS")
        return False


def show_usage_example():
    """Show example usage of the Teleconic SMS integration."""
    print("\n=== Usage Example ===")
    print("""
# In your Django views or services:

from authentication.sms_backends import send_sms

# Send SMS notification
phone = "+233241234567"
message = "Your verification code is: 123456"
success = send_sms(phone, message)

if success:
    print("SMS sent successfully")
else:
    print("Failed to send SMS")

# Common use cases:
# 1. Employee invitation
# 2. OTP verification
# 3. Appointment reminders
# 4. System notifications
# 5. Password reset codes
    """)


def main():
    """Run all tests."""
    print("Teleconic SMS Integration Test")
    print("=" * 60)
    
    # Check configuration
    is_configured = test_teleconic_configuration()
    
    # Test phone normalization
    test_phone_normalization()
    
    # Show usage example
    show_usage_example()
    
    # Interactive test option
    if is_configured:
        print("\n" + "=" * 60)
        print("To send a test SMS, uncomment and modify the following lines:")
        print("test_send_sms('+233241234567', test_mode=False)")
        print("=" * 60)
    
    print("\n[+] Test suite completed!")
    print("\nNext steps:")
    print("1. Add TELECONIC_API_KEY to your .env file")
    print("2. Add TELECONIC_SENDER_ID to your .env file (optional, defaults to 'BrainArtz')")
    print("3. Run this script again to verify configuration")
    print("4. Use send_sms() in your application code")


if __name__ == "__main__":
    main()
