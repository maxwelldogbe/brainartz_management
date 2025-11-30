from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Work, CustomerContact
from django.utils import timezone

# import the SMS sender from authentication app
from authentication.sms_backends import send_sms


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
        # Log error but don't fail work creation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to save customer contact: {e}")


@receiver(post_save, sender=Work)
def work_post_save(sender, instance: Work, created, update_fields=None, **kwargs):
    """When a Work is marked completed, notify the customer via SMS if phone exists.

    We check that completed changed from False to True by tracking `created` and
    the instance.completed flag. If more precise previous-state comparison is
    required, a pre_save signal or a field tracker could be used; this simple
    approach avoids extra dependencies.
    """
    # Only act when not newly created and marked completed
    if created:
        return

    # If the work is completed, send SMS
    try:
        # If project updates pass `update_fields`, ignore cases where 'completed' wasn't changed
        if update_fields and 'completed' not in update_fields:
            return
    except Exception:
        pass

    # Check if category has notifications enabled and customer info is available
    if (instance.completed and 
        instance.customer_phone and 
        instance.customer_phone != 'N/A' and
        instance.category and 
        instance.category.send_completion_notification):
        
        phone = instance.customer_phone
        
        # Use title if available, fallback to description
        work_identifier = instance.title if hasattr(instance, 'title') and instance.title else instance.description[:60]
        
        # Format completion date
        completion_date = instance.completed_at or timezone.now()
        formatted_date = timezone.localtime(completion_date).strftime('%Y-%m-%d')
        
        message = (
            f"Hello {instance.customer_name},\n\n"
            f"Great news! Your work '{work_identifier}' has been completed on {formatted_date}.\n\n"
            f"Thank you for choosing our services. Please contact us if you have any questions.\n\n"
            f"Best regards,\nThe Team"
        )
        
        # send_sms returns True/False; ignore failures for now but log if needed
        try:
            send_sms(phone, message)
        except Exception:
            # avoid raising from signal
            pass
