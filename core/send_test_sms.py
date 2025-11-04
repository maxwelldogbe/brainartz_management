#!/usr/bin/env python
"""
Interactive SMS Test Script - Send real SMS via Teleconic
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.sms_backends import send_sms, normalize_phone_number

def send_test_sms():
    """Send a test SMS to a real phone number."""
    print("=" * 70)
    print("SMS Test - BrainArtz Management System")
    print("=" * 70)
    print("\nEnter the phone number to send test SMS")
    print("Examples: 0241234567, +233241234567")
    
    phone = input("\nPhone number: ").strip()
    
    if not phone:
        print("❌ No phone number provided. Exiting.")
        return
    
    # Normalize phone number
    normalized = normalize_phone_number(phone)
    print(f"\n📱 Normalized phone: {normalized}")
    
    # Create test message
    message = (
        "Hello! This is a test message from BrainArtz Management System. "
        "SMS integration via Teleconic is working correctly! 🎉"
    )
    
    print(f"\n📝 Message: {message}")
    print(f"📊 Length: {len(message)} characters")
    
    # Confirm before sending
    confirm = input("\n⚠️  Send SMS? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("❌ SMS sending cancelled.")
        return
    
    print("\n📤 Sending SMS...")
    
    # Send SMS
    success = send_sms(normalized, message)
    
    if success:
        print("\n✅ SMS sent successfully!")
        print(f"   Recipient: {normalized}")
        print(f"   Message length: {len(message)} chars")
    else:
        print("\n❌ Failed to send SMS")
        print("   Check:")
        print("   1. API key is valid")
        print("   2. Phone number is correct")
        print("   3. Sender ID is approved")
        print("   4. Account has sufficient credits")

if __name__ == "__main__":
    try:
        send_test_sms()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
