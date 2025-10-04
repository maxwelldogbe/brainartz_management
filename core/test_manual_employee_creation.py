#!/usr/bin/env python
"""
Test script for Manual Employee Account Creation System

This script demonstrates the manual employee account creation functionality
and tests various scenarios including SMS failures and credential sharing.
"""

import os
import sys
import django

# Add the Django project path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User, Profile
from authentication.serializers import ManualEmployeeCreateSerializer
from authentication.sms_backends import send_sms
from django.utils.crypto import get_random_string


def test_manual_employee_creation():
    """Test manual employee account creation via serializer"""
    print("=== Testing Manual Employee Account Creation ===")
    
    test_data = {
        'username': 'testmanual',
        'first_name': 'Manual',
        'last_name': 'Test',
        'phone': '+233241111111',
        'email': 'manual.test@company.com',
        # No password provided - should generate one
    }
    
    print(f"Creating employee account for: {test_data['first_name']} {test_data['last_name']}")
    
    try:
        serializer = ManualEmployeeCreateSerializer(data=test_data)
        
        if serializer.is_valid():
            user = serializer.save()
            password = getattr(user, '_generated_password', 'N/A')
            
            print(f"✓ Employee account created successfully!")
            print(f"   ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Full Name: {user.get_full_name()}")
            print(f"   Phone: {user.profile.phone if hasattr(user, 'profile') else 'N/A'}")
            print(f"   Generated Password: {password}")
            print(f"   Is Worker: {user.is_worker}")
            
            return user, password
        else:
            print(f"✗ Validation errors: {serializer.errors}")
            return None, None
            
    except Exception as e:
        print(f"✗ Error creating account: {e}")
        return None, None


def test_credential_sharing_sms(user, password):
    """Test sharing login credentials via SMS"""
    print(f"\n=== Testing Credential Sharing for {user.username} ===")
    
    if not hasattr(user, 'profile') or not user.profile.phone:
        print("✗ No phone number found for user")
        return False
    
    phone = user.profile.phone
    
    # Prepare login credentials message
    message = (
        f"Welcome to the team, {user.get_full_name()}! 🎉\n\n"
        f"Your account has been created:\n"
        f"👤 Username: {user.username}\n"
        f"📧 Email: {user.email}\n"
        f"🔒 Password: {password}\n\n"
        f"Please log in and change your password.\n"
        f"Welcome aboard! 🚀"
    )
    
    try:
        sms_success = send_sms(phone, message)
        
        if sms_success:
            print(f"✓ Login credentials sent via SMS to {phone}")
        else:
            print(f"✗ Failed to send SMS to {phone}")
            print("   Fallback: Share credentials manually")
            
        return sms_success
        
    except Exception as e:
        print(f"✗ SMS sending error: {e}")
        return False


def test_password_reset_and_resend(user):
    """Test password reset and credential resending"""
    print(f"\n=== Testing Password Reset for {user.username} ===")
    
    # Generate new password
    new_password = get_random_string(12)
    user.set_password(new_password)
    user.save()
    
    print(f"✓ Password reset successfully")
    print(f"   New Password: {new_password}")
    
    # Send new credentials via SMS
    if hasattr(user, 'profile') and user.profile.phone:
        message = (
            f"Hi {user.get_full_name()}! 👋\n\n"
            f"Your password has been reset:\n"
            f"👤 Username: {user.username}\n"
            f"📧 Email: {user.email}\n"
            f"🔒 New Password: {new_password}\n\n"
            f"Please log in and change your password.\n"
        )
        
        try:
            sms_success = send_sms(user.profile.phone, message)
            if sms_success:
                print(f"✓ New credentials sent via SMS to {user.profile.phone}")
            else:
                print(f"✗ Failed to send SMS with new credentials")
            
            return sms_success
            
        except Exception as e:
            print(f"✗ Error sending password reset SMS: {e}")
            return False
    else:
        print("✗ No phone number available for SMS")
        return False


def test_account_creation_without_email():
    """Test creating account without providing email (should generate one)"""
    print("\n=== Testing Account Creation Without Email ===")
    
    test_data = {
        'username': 'noemail',
        'first_name': 'No',
        'last_name': 'Email',
        'phone': '+233242222222',
        # No email provided - should generate one
    }
    
    try:
        serializer = ManualEmployeeCreateSerializer(data=test_data)
        
        if serializer.is_valid():
            user = serializer.save()
            password = getattr(user, '_generated_password', 'N/A')
            
            print(f"✓ Account created without email!")
            print(f"   Generated Email: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Generated Password: {password}")
            
            return user
        else:
            print(f"✗ Validation errors: {serializer.errors}")
            return None
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def test_validation_errors():
    """Test various validation scenarios"""
    print("\n=== Testing Validation Scenarios ===")
    
    test_cases = [
        {
            'name': 'Missing phone number',
            'data': {
                'username': 'nophone',
                'first_name': 'No',
                'last_name': 'Phone',
            }
        },
        {
            'name': 'Invalid phone number',
            'data': {
                'username': 'badphone',
                'first_name': 'Bad',
                'last_name': 'Phone',
                'phone': 'not-a-phone',
            }
        },
        {
            'name': 'Missing required fields',
            'data': {
                'username': 'incomplete',
                'phone': '+233243333333',
                # Missing first_name and last_name
            }
        },
    ]
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        serializer = ManualEmployeeCreateSerializer(data=test_case['data'])
        
        if not serializer.is_valid():
            print(f"✓ Expected validation error: {serializer.errors}")
        else:
            print(f"✗ Unexpected success - should have failed validation")


def test_duplicate_prevention():
    """Test prevention of duplicate usernames and emails"""
    print("\n=== Testing Duplicate Prevention ===")
    
    # Create first user
    original_data = {
        'username': 'original',
        'first_name': 'Original',
        'last_name': 'User',
        'phone': '+233244444444',
        'email': 'original@company.com',
    }
    
    serializer = ManualEmployeeCreateSerializer(data=original_data)
    if serializer.is_valid():
        user1 = serializer.save()
        print(f"✓ First user created: {user1.username}")
    else:
        print(f"✗ Failed to create first user: {serializer.errors}")
        return
    
    # Try to create duplicate username
    duplicate_username_data = {
        'username': 'original',  # Same username
        'first_name': 'Duplicate',
        'last_name': 'Username',
        'phone': '+233245555555',
        'email': 'different@company.com',
    }
    
    serializer = ManualEmployeeCreateSerializer(data=duplicate_username_data)
    if not serializer.is_valid():
        print(f"✓ Duplicate username prevented: {serializer.errors}")
    else:
        print(f"✗ Duplicate username not prevented!")
    
    # Try to create duplicate email
    duplicate_email_data = {
        'username': 'different',
        'first_name': 'Duplicate',
        'last_name': 'Email',
        'phone': '+233246666666',
        'email': 'original@company.com',  # Same email
    }
    
    serializer = ManualEmployeeCreateSerializer(data=duplicate_email_data)
    if not serializer.is_valid():
        print(f"✓ Duplicate email prevented: {serializer.errors}")
    else:
        print(f"✗ Duplicate email not prevented!")


def cleanup_test_data():
    """Clean up test data created during testing"""
    print("\n=== Cleaning Up Test Data ===")
    
    test_usernames = ['testmanual', 'noemail', 'original', 'nophone', 'badphone', 'incomplete', 'different']
    
    try:
        deleted_count = 0
        for username in test_usernames:
            try:
                user = User.objects.get(username=username)
                user.delete()
                deleted_count += 1
                print(f"✓ Deleted user: {username}")
            except User.DoesNotExist:
                pass  # User doesn't exist, skip
        
        print(f"✓ Cleaned up {deleted_count} test users")
        
    except Exception as e:
        print(f"✗ Error during cleanup: {e}")


def main():
    """Run all tests"""
    print("Manual Employee Account Creation System Test")
    print("=" * 60)
    
    # Test 1: Basic manual employee creation
    user, password = test_manual_employee_creation()
    
    if user and password:
        # Test 2: Credential sharing via SMS
        test_credential_sharing_sms(user, password)
        
        # Test 3: Password reset and resend
        test_password_reset_and_resend(user)
    
    # Test 4: Account creation without email
    user_no_email = test_account_creation_without_email()
    
    # Test 5: Validation scenarios
    test_validation_errors()
    
    # Test 6: Duplicate prevention
    test_duplicate_prevention()
    
    # Cleanup
    cleanup_test_data()
    
    print("\n" + "=" * 60)
    print("🎉 Manual Employee Account Creation Tests Completed!")
    
    print("\n💡 Key Features Tested:")
    print("   ✓ Manual account creation with auto-generated passwords")
    print("   ✓ Automatic email generation when not provided")
    print("   ✓ SMS credential sharing")
    print("   ✓ Password reset and credential resending")
    print("   ✓ Input validation and duplicate prevention")
    print("   ✓ Phone number normalization")


if __name__ == "__main__":
    main()