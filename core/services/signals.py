from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Work, CustomerContact, Material, MaterialUsage, Procurement
from django.utils import timezone

# import the SMS sender from authentication app
from authentication.sms_backends import send_sms

# Store previous state for comparison
_work_pre_save_state = {}
_procurement_pre_save_state = {}


@receiver(post_save, sender=Work)
def save_customer_contact(sender, instance: Work, created, **kwargs):
    """
    Automatically save or update customer contact information when a work is created/updated.
    This builds a database of customers for marketing purposes.
    """
    # Only process if we have valid customer information
    if not instance.customer_name or not instance.customer_phone:
        return
    
    # Skip if phone is placeholder
    if instance.customer_phone.strip() in ['', 'N/A', 'n/a']:
        return
    
    phone = instance.customer_phone.strip()
    name = instance.customer_name.strip()
    
    try:
        # Get or create customer contact
        customer, is_new = CustomerContact.objects.get_or_create(
            phone=phone,
            defaults={'name': name}
        )
        
        # Update customer information
        if not is_new:
            # Update name if it's different (customer might have provided more details)
            if customer.name != name:
                customer.name = name
            
            # Increment work count and update total spent
            customer.total_works += 1
            customer.total_spent += instance.price
            customer.save()
    except Exception as e:
        # Error but don't fail work creation
        pass


@receiver(pre_save, sender=Work)
def work_pre_save(sender, instance: Work, **kwargs):
    """Store the previous state of work before saving"""
    if instance.pk:
        try:
            old_instance = Work.objects.get(pk=instance.pk)
            _work_pre_save_state[instance.pk] = {
                'completed': old_instance.completed,
                'worker': old_instance.worker
            }
        except Work.DoesNotExist:
            pass


@receiver(post_save, sender=Work)
def work_post_save(sender, instance: Work, created, update_fields=None, **kwargs):
    """
    Handle work status changes and send appropriate notifications.
    Also sends SMS to customers when work is completed (existing functionality).
    """
    from .notification_service import (
        send_new_work_notification,
        send_work_reopened_notification,
        send_work_completed_notification
    )
    
    if created:
        if instance.worker:
            send_new_work_notification(instance)
        return
    
    previous_state = _work_pre_save_state.get(instance.pk)
    if not previous_state:
        return
    
    previous_completed = previous_state.get('completed', False)
    current_completed = instance.completed
    
    if previous_completed and not current_completed:
        if instance.worker:
            send_work_reopened_notification(instance)
    
    elif not previous_completed and current_completed:
        send_work_completed_notification(instance)
        
        if (instance.customer_phone and 
            instance.customer_phone != 'N/A' and
            instance.category and 
            instance.category.send_completion_notification):
            
            phone = instance.customer_phone
            work_identifier = instance.title if hasattr(instance, 'title') and instance.title else instance.description[:60]
            completion_date = instance.completed_at or timezone.now()
            formatted_date = timezone.localtime(completion_date).strftime('%Y-%m-%d')
            
            message = (
                f"Hello {instance.customer_name},\n\n"
                f"Great news! Your work '{work_identifier}' has been completed on {formatted_date}.\n\n"
                f"Thank you for choosing our services. Please contact us if you have any questions.\n\n"
                f"Best regards,\nThe Team"
            )
            
            try:
                send_sms(phone, message)
            except Exception:
                pass
    
    if instance.pk in _work_pre_save_state:
        del _work_pre_save_state[instance.pk]


# ============== INVENTORY SIGNALS ==============

@receiver(post_save, sender=Material)
def check_low_stock(sender, instance: Material, created, **kwargs):
    """Send notification when material stock is low"""
    from .notification_service import send_low_stock_notification
    
    if instance.archived:
        return
    
    # Refresh from DB if current_stock is an F() expression
    from django.db.models import F, Expression
    if isinstance(instance.current_stock, (F, Expression)):
        instance.refresh_from_db()
    
    if instance.is_low_stock():
        send_low_stock_notification(instance)


@receiver(post_save, sender=MaterialUsage)
def notify_material_pickup(sender, instance: MaterialUsage, created, **kwargs):
    """Send notification when materials are picked up"""
    from .notification_service import send_material_request_notification
    
    if created:
        send_material_request_notification(instance)


@receiver(post_save, sender=Procurement)
def handle_procurement_notifications(sender, instance: Procurement, created, **kwargs):
    """Handle procurement creation and status change notifications"""
    from .notification_service import (
        send_procurement_created_notification,
        send_procurement_delivered_notification
    )
    
    if created:
        send_procurement_created_notification(instance)
        return
    
    previous_state = _procurement_pre_save_state.get(instance.pk)
    if not previous_state:
        return
    
    previous_status = previous_state.get('status')
    current_status = instance.status
    
    if previous_status != 'delivered' and current_status == 'delivered':
        send_procurement_delivered_notification(instance)
    
    if instance.pk in _procurement_pre_save_state:
        del _procurement_pre_save_state[instance.pk]


@receiver(pre_save, sender=Procurement)
def procurement_pre_save(sender, instance: Procurement, **kwargs):
    """Store the previous state of procurement before saving"""
    if instance.pk:
        try:
            old_instance = Procurement.objects.get(pk=instance.pk)
            _procurement_pre_save_state[instance.pk] = {
                'status': old_instance.status,
            }
        except Procurement.DoesNotExist:
            pass
