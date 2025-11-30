#!/usr/bin/env python
"""
Test script for SMS Employee Invitation System

This script demonstrates how the SMS invitation system works and can be used
for testing the functionality.
"""

import os
import sys
import django

# Add the Django project path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import InvitationToken, User, Profile
from authentication.sms_backends import send_sms, normalize_phone_number
from datetime import timedelta
from django.utils import timezone

def test_phone_normalization():
    """Test phone number normalization function."""
    print("=== Testing Phone Number Normalization ===")
    
    test_numbers = [
        "0241234567",  # Ghana local format
        "+233241234567",  # Ghana international format  
        "024-123-4567",  # With dashes
        "(024) 123 4567",  # With parentheses and spaces
        "+1 555 123 4567",  # US format with spaces
    ]
    
    for number in test_numbers:
        normalized = normalize_phone_number(number)
        print(f"Original: {number:15} -> Normalized: {normalized}")

def test_sms_invitation():
    """Test the complete SMS invitation flow."""
    print("\n=== Testing SMS Invitation Flow ===")
    
    # Test data
    test_phone = "+233241234567"  # Ghana number
    test_email = "test.employee@company.com"
    
    print(f"Creating invitation for phone: {test_phone}")
    
    # Create invitation token (simulating what the API would do)
    try:
        invite = InvitationToken.objects.create(
            phone=test_phone,
            email=test_email,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        print(f"[+] Invitation token created: {invite.token}")
        print(f"[+] Expires at: {invite.expires_at}")
        
        # Test SMS sending (will use console output in development)
        message = (
            f"You're invited to join our team! Use this link to create your account: "
            f"http://localhost:8000/auth/register/{invite.token}\n"
            f"Your invitation code: {invite.token}\n"
            f"This invitation expires on {invite.expires_at.strftime('%Y-%m-%d at %H:%M')}.\n"
            f"Welcome aboard!"
        )
        
        sms_success = send_sms(test_phone, message)
        
        if sms_success:
            print("[+] SMS sent successfully!")
        else:
            print("[X] SMS sending failed")
            
        # Verify invitation status
        print(f"[+] Invitation used: {invite.used}")
        print(f"[+] Invitation expired: {invite.is_expired()}")
        
        return invite
        
    except Exception as e:
        print(f"[X] Error creating invitation: {e}")
        return None

def test_user_registration_from_invite(invite_token):
    """Test user registration using invitation token."""
    print("\n=== Testing User Registration from Invitation ===")
    
    if not invite_token:
        print("[X] No invitation token provided")
        return
    
    try:
        # Simulate user data that would come from registration form
        user_data = {
            'username': 'testemployee',
            'password': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'Employee'
        }
        
        invite = InvitationToken.objects.get(token=invite_token)
        
        # Check if invitation is valid
        if invite.is_expired() or invite.used:
            print("[X] Invitation token is expired or already used")
            return
        
        # Create user (simulating the registration API)
        user = User.objects.create_user(
            username=user_data['username'],
            email=invite.email or f"emp-{invite.phone.replace('+', '')}-{str(invite.token)[:8]}@company.local",
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            is_worker=True
        )
        
        print(f"[+] User created: {user.email}")
        
        # Update user profile with phone number from invitation
        if hasattr(user, 'profile'):
            user.profile.phone = invite.phone
            user.profile.save()
            print(f"[+] Phone number saved to profile: {invite.phone}")
        
        # Mark invitation as used
        invite.used = True
        invite.save()
        print("[+] Invitation marked as used")
        
        print(f"[+] Employee account setup complete for: {user.get_full_name()}")
        
        return user
        
    except Exception as e:
        print(f"[X] Error during registration: {e}")
        return None

def cleanup_test_data():
    """Clean up test data created during testing."""
    print("\n=== Cleaning Up Test Data ===")
    
    try:
        # Delete test users
        test_users = User.objects.filter(username__startswith='testemployee')
        count = test_users.count()
        test_users.delete()
        print(f"[+] Deleted {count} test users")
        
        # Delete test invitation tokens (unused ones)
        test_invites = InvitationToken.objects.filter(
            phone__startswith='+233241234567'
        )
        count = test_invites.count()
        test_invites.delete()
        print(f"[+] Deleted {count} test invitations")
        
    except Exception as e:
        print(f"[X] Error during cleanup: {e}")

def main():
    """Run all tests."""
    print("SMS Employee Invitation System Test")
    print("=" * 50)
    
    # Test phone normalization
    test_phone_normalization()
    
    # Test SMS invitation creation and sending
    invite = test_sms_invitation()
    
    if invite:
        # Test user registration from invitation
        user = test_user_registration_from_invite(invite.token)
        
        if user:
            print(f"\n[SUCCESS] Success! Employee {user.get_full_name()} has been invited and registered!")
    
    # Clean up test data
    cleanup_test_data()
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    main()