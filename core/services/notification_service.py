"""
Service functions for handling notifications.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from .models import Notification, Work


def send_notification(recipient, notification_type, title, message, work_order=None, material=None, procurement=None):
    """
    Create and send a notification via WebSocket.
    
    Args:
        recipient: User object to receive the notification
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        work_order: Optional Work object reference
        material: Optional Material object reference
        procurement: Optional Procurement object reference
    
    Returns:
        Created Notification object
    """
    try:
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            work_order=work_order,
            material=material,
            procurement=procurement
        )
        
        channel_layer = get_channel_layer()
        group_name = f"notifications_{recipient.id}"
        
        notification_data = {
            'id': notification.id,
            'type': notification_type,
            'title': title,
            'message': message,
            'work_order_id': work_order.id if work_order else None,
            'material_id': material.id if material else None,
            'material_name': material.name if material else None,
            'procurement_id': procurement.id if procurement else None,
            'is_read': False,
            'created_at': notification.created_at.isoformat(),
        }
        
        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
        except Exception:
            pass
        
        unread_count = Notification.objects.filter(
            recipient=recipient,
            is_read=False
        ).count()
        
        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'unread_count_update',
                    'count': unread_count
                }
            )
        except Exception:
            pass
        
        return notification
        
    except Exception:
        return None


def send_new_work_notification(work):
    """Send notification when new work is created."""
    if not work.worker:
        return None
    
    title = f"New Work Assigned: {work.title}"
    message = f"You have been assigned new work: {work.title}"
    if work.customer_name:
        message += f" for {work.customer_name}"
    
    return send_notification(
        recipient=work.worker,
        notification_type='new_work',
        title=title,
        message=message,
        work_order=work
    )


def send_work_reopened_notification(work):
    """Send notification when work is reopened."""
    if not work.worker:
        return None
    
    title = f"Work Reopened: {work.title}"
    message = f"Work has been reopened: {work.title}"
    if work.customer_name:
        message += f" for {work.customer_name}"
    
    return send_notification(
        recipient=work.worker,
        notification_type='work_reopened',
        title=title,
        message=message,
        work_order=work
    )


def send_work_completed_notification(work):
    """
    Send notification when work is completed.
    Notifies supervisors/admins about completion.
    """
    from authentication.models import User
    
    # Get all admin/supervisor users
    supervisors = User.objects.filter(is_admin=True)
    
    notifications = []
    for supervisor in supervisors:
        title = f"Work Completed: {work.title}"
        message = f"Work has been completed: {work.title}"
        if work.worker:
            message += f" by {work.worker.get_full_name() or work.worker.username}"
        if work.customer_name:
            message += f" for {work.customer_name}"
        
        notification = send_notification(
            recipient=supervisor,
            notification_type='work_completed',
            title=title,
            message=message,
            work_order=work
        )
        if notification:
            notifications.append(notification)
    
    return notifications


# ============== INVENTORY NOTIFICATIONS ==============

def send_low_stock_notification(material):
    """
    Send notification when material stock is low.
    Notifies admins and inventory managers.
    """
    from authentication.models import User
    
    # Get admin users
    admins = User.objects.filter(is_admin=True)
    
    title = f"Low Stock Alert: {material.name}"
    message = f"Material '{material.name}' is running low. Current stock: {material.current_stock} {material.unit}. Reorder level: {material.reorder_level} {material.unit}."
    
    notifications = []
    for admin in admins:
        notification = send_notification(
            recipient=admin,
            notification_type='low_stock',
            title=title,
            message=message,
            material=material
        )
        if notification:
            notifications.append(notification)
    
    return notifications


def send_material_request_notification(material_usage):
    """
    Send notification when a worker picks up materials.
    Notifies admins about material pickup.
    """
    from authentication.models import User
    
    # Get admin users
    admins = User.objects.filter(is_admin=True)
    
    requester_name = material_usage.taken_by.get_full_name() or material_usage.taken_by.username if material_usage.taken_by else "Unknown"
    title = f"Material Pickup: {material_usage.material.name}"
    message = f"{requester_name} picked up {material_usage.quantity_taken} {material_usage.material.unit} of {material_usage.material.name}. Stock remaining: {material_usage.stock_after} {material_usage.material.unit}."
    
    if material_usage.note:
        message += f" Note: {material_usage.note}"
    
    notifications = []
    for admin in admins:
        notification = send_notification(
            recipient=admin,
            notification_type='material_pickup',
            title=title,
            message=message,
            material=material_usage.material
        )
        if notification:
            notifications.append(notification)
    
    return notifications


def send_procurement_created_notification(procurement):
    """
    Send notification when a new procurement order is created.
    Notifies admins about new procurement.
    """
    from authentication.models import User
    
    # Get admin users
    admins = User.objects.filter(is_admin=True)
    
    creator_name = procurement.created_by.get_full_name() or procurement.created_by.username if procurement.created_by else "Unknown"
    title = f"New Procurement: {procurement.material.name}"
    message = f"{creator_name} created a procurement order for {procurement.quantity_ordered} {procurement.material.unit} of {procurement.material.name}. Total cost: GHS {procurement.total_cost}."
    
    notifications = []
    for admin in admins:
        notification = send_notification(
            recipient=admin,
            notification_type='procurement_created',
            title=title,
            message=message,
            material=procurement.material,
            procurement=procurement
        )
        if notification:
            notifications.append(notification)
    
    return notifications


def send_procurement_delivered_notification(procurement):
    """
    Send notification when a procurement is marked as delivered.
    Notifies all workers about new stock availability.
    """
    from authentication.models import User
    
    # Get all workers and admins
    staff = User.objects.filter(is_worker=True) | User.objects.filter(is_admin=True)
    staff = staff.distinct()
    
    title = f"Stock Replenished: {procurement.material.name}"
    message = f"Procurement delivered: {procurement.quantity_ordered} {procurement.material.unit} of {procurement.material.name}. Material is now available."
    
    notifications = []
    for user in staff:
        notification = send_notification(
            recipient=user,
            notification_type='procurement_delivered',
            title=title,
            message=message,
            material=procurement.material,
            procurement=procurement
        )
        if notification:
            notifications.append(notification)
    
    return notifications


def cleanup_old_notifications(days=30):
    """
    Clean up old read notifications.
    
    Args:
        days: Number of days to keep notifications (default 30)
    
    Returns:
        Number of deleted notifications
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    deleted_count, _ = Notification.objects.filter(
        is_read=True,
        read_at__lt=cutoff_date
    ).delete()
    
    return deleted_count


def mark_notification_read(notification_id, user):
    """
    Mark a notification as read.
    
    Args:
        notification_id: ID of notification to mark as read
        user: User object (for security check)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        notification = Notification.objects.get(
            id=notification_id,
            recipient=user
        )
        notification.mark_as_read()
        
        # Send updated unread count
        channel_layer = get_channel_layer()
        group_name = f"notifications_{user.id}"
        unread_count = Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'unread_count_update',
                'count': unread_count
            }
        )
        
        return True
    except Notification.DoesNotExist:
        return False


def mark_all_notifications_read(user):
    """
    Mark all notifications as read for a user.
    
    Args:
        user: User object
    
    Returns:
        Number of notifications marked as read
    """
    count = Notification.objects.filter(
        recipient=user,
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    
    # Send updated unread count
    channel_layer = get_channel_layer()
    group_name = f"notifications_{user.id}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'unread_count_update',
            'count': 0
        }
    )
    
    return count


def get_user_notifications(user, limit=50, offset=0, unread_only=False):
    """
    Get notifications for a user with pagination.
    
    Args:
        user: User object
        limit: Maximum number of notifications to return
        offset: Offset for pagination
        unread_only: If True, only return unread notifications
    
    Returns:
        QuerySet of Notification objects
    """
    queryset = Notification.objects.filter(recipient=user)
    
    if unread_only:
        queryset = queryset.filter(is_read=False)
    
    return queryset[offset:offset + limit]
