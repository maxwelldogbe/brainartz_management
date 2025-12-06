"""
Test script for inventory notification system.
Run with: python test_inventory_notifications.py
"""

import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from services.models import Material, MaterialUsage, Procurement, Notification
from services.notification_service import (
    send_low_stock_notification,
    send_material_request_notification,
    send_procurement_created_notification,
    send_procurement_delivered_notification
)

User = get_user_model()

print("=" * 80)
print("INVENTORY NOTIFICATION SYSTEM TEST")
print("=" * 80)

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

# Create a test material
material, created = Material.objects.get_or_create(
    name='Test Paper A4',
    defaults={
        'category': 'paper',
        'unit': 'reams',
        'current_stock': 5,
        'reorder_level': 10,
    }
)

if created:
    print(f"\n✓ Material created: {material.name}")
    print(f"  Current stock: {material.current_stock} {material.unit}")
    print(f"  Reorder level: {material.reorder_level} {material.unit}")
else:
    print(f"\n✓ Material found: {material.name}")

# Test 1: Low Stock Notification
print("\n" + "-" * 80)
print("TEST 1: Low Stock Notification")
print("-" * 80)

low_stock_notifications = Notification.objects.filter(
    material=material,
    notification_type='low_stock'
)

print(f"\n📧 Low Stock Notifications: {low_stock_notifications.count()}")
for notif in low_stock_notifications[:5]:  # Show first 5
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Test 2: Material Pickup Notification
print("\n" + "-" * 80)
print("TEST 2: Material Pickup Notification")
print("-" * 80)

# Create a material pickup
material_usage = MaterialUsage.objects.create(
    material=material,
    quantity_taken=2,
    taken_by=worker_user,
    note="For urgent print job",
    stock_before=material.current_stock,
    stock_after=material.current_stock - 2
)

# Update material stock
material.current_stock -= 2
material.save()

pickup_notifications = Notification.objects.filter(
    material=material,
    notification_type='material_pickup'
).order_by('-created_at')

print(f"\n📧 Material Pickup Notifications: {pickup_notifications.count()}")
for notif in pickup_notifications[:5]:
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Test 3: Procurement Created Notification
print("\n" + "-" * 80)
print("TEST 3: Procurement Created Notification")
print("-" * 80)

procurement = Procurement.objects.create(
    material=material,
    quantity_ordered=50,
    unit_cost=25.00,
    total_cost=1250.00,
    status='pending',
    created_by=admin_user
)

procurement_created_notifications = Notification.objects.filter(
    procurement=procurement,
    notification_type='procurement_created'
)

print(f"\n📧 Procurement Created Notifications: {procurement_created_notifications.count()}")
for notif in procurement_created_notifications:
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Test 4: Procurement Delivered Notification
print("\n" + "-" * 80)
print("TEST 4: Procurement Delivered Notification")
print("-" * 80)

procurement.status = 'delivered'
procurement.save()

# Update material stock
material.current_stock += procurement.quantity_ordered
material.save()

delivery_notifications = Notification.objects.filter(
    procurement=procurement,
    notification_type='procurement_delivered'
)

print(f"\n📧 Procurement Delivered Notifications: {delivery_notifications.count()}")
for notif in delivery_notifications[:5]:
    print(f"  - To: {notif.recipient.username}")
    print(f"    Title: {notif.title}")
    print(f"    Read: {notif.is_read}")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

all_notifications = Notification.objects.all()
inventory_notifications = all_notifications.filter(
    notification_type__in=['low_stock', 'material_pickup', 'procurement_created', 'procurement_delivered']
)

print(f"Total Notifications: {all_notifications.count()}")
print(f"Inventory Notifications: {inventory_notifications.count()}")
print(f"Work Notifications: {all_notifications.count() - inventory_notifications.count()}")
print(f"\nBreakdown by type:")
print(f"  - Low Stock: {Notification.objects.filter(notification_type='low_stock').count()}")
print(f"  - Material Pickup: {Notification.objects.filter(notification_type='material_pickup').count()}")
print(f"  - Procurement Created: {Notification.objects.filter(notification_type='procurement_created').count()}")
print(f"  - Procurement Delivered: {Notification.objects.filter(notification_type='procurement_delivered').count()}")

print("\n✅ Test completed successfully!")
print(f"\nMaterial final stock: {material.current_stock} {material.unit}")
print(f"Is low stock: {material.is_low_stock()}")
