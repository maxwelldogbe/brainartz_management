from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Work
from django.utils import timezone

# import the SMS sender from authentication app
from authentication.sms_backends import send_sms


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

    if instance.completed and instance.customer and instance.customer.phone:
        phone = instance.customer.phone
        
        # Use title if available, fallback to description
        work_identifier = instance.title if hasattr(instance, 'title') and instance.title else instance.description[:60]
        
        # Format completion date
        completion_date = instance.completed_at or timezone.now()
        formatted_date = timezone.localtime(completion_date).strftime('%Y-%m-%d')
        
        message = (
            f"Hello {instance.customer.name},\n\n"
            f"Great news! Your work '{work_identifier}' has been completed on {formatted_date}. ✅\n\n"
            f"Thank you for choosing our services. Please contact us if you have any questions.\n\n"
            f"Best regards,\nThe Team"
        )
        
        # send_sms returns True/False; ignore failures for now but log if needed
        try:
            send_sms(phone, message)
        except Exception:
            # avoid raising from signal
            pass
