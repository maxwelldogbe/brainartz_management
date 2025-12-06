"""
Test script for notification system.
Run with: python manage.py shell < test_notifications.py
Or: python test_notifications.py
"""

import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from services.models import Work, JobCategory, Notification
from services.notification_service import (
    send_new_work_notification,
    send_work_completed_notification,
    send_work_reopened_notification
)

User = get_user_model()

print("=" * 60)
print("NOTIFICATION SYSTEM TEST")
print("=" * 60)

# Get or create test users
admin_user, _ = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@test.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'is_admin': True,
        'is_staff': True,
        'is_worker': True
    }
)

worker_user, _ = User.objects.get_or_create(
    username='worker1',
    defaults={
        'email': 'worker@test.com',
        'first_name': 'Worker',
        'last_name': 'One',
        'is_worker': True
    }
)

print(f"\n✓ Users ready:")
print(f"  - Admin: {admin_user.username} (ID: {admin_user.id})")
print(f"  - Worker: {worker_user.username} (ID: {worker_user.id})")

# Get or create a test category
category, _ = JobCategory.objects.get_or_create(
    name='Testing',
    defaults={'description': 'Test category'}
)

print(f"\n✓ Category ready: {category.name}")

# Create a test work order
work = Work.objects.create(
    title='Test Work Order',
    description='This is a test work order for notification testing',
    price=100.00,
    category=category,
    worker=worker_user,
    customer_name='Test Customer',
    customer_phone='1234567890'
)

print(f"\n✓ Work order created: {work.title} (ID: {work.id})")

# Check if new work notification was sent
new_work_notifications = Notification.objects.filter(
    work_order=work,
    notification_type='new_work'
)

print(f"\n📧 New Work Notifications: {new_work_notifications.count()}")
for notif in new_work_notifications:
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Test work completion notification
print("\n" + "-" * 60)
print("Testing Work Completion Notification...")
work.completed = True
work.save()

completed_notifications = Notification.objects.filter(
    work_order=work,
    notification_type='work_completed'
)

print(f"\n📧 Completion Notifications: {completed_notifications.count()}")
for notif in completed_notifications:
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Test work reopened notification
print("\n" + "-" * 60)
print("Testing Work Reopened Notification...")
work.completed = False
work.save()

reopened_notifications = Notification.objects.filter(
    work_order=work,
    notification_type='work_reopened'
)

print(f"\n📧 Reopened Notifications: {reopened_notifications.count()}")
for notif in reopened_notifications:
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Summary
total_notifications = Notification.objects.count()
print("\n" + "=" * 60)
print(f"SUMMARY")
print("=" * 60)
print(f"Total Notifications in Database: {total_notifications}")
print(f"Notifications for {worker_user.username}: {Notification.objects.filter(recipient=worker_user).count()}")
print(f"Notifications for {admin_user.username}: {Notification.objects.filter(recipient=admin_user).count()}")
print(f"Unread Notifications: {Notification.objects.filter(is_read=False).count()}")

print("\n✅ Test completed successfully!")
print("\nTo clean up test data:")
print(f"  - Delete work: Work.objects.get(id={work.id}).delete()")
print(f"  - Delete notifications: Notification.objects.filter(work_order_id={work.id}).delete()")
