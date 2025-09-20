from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Simple pluggable SMS sender. Swap implementation as needed.
def send_sms(phone_number: str, message: str) -> bool:
    """Send SMS to phone_number with message.

    Default implementation logs the message. Return True on success.
    """
    # If a real SMS provider is configured in settings, call it here.
    provider = getattr(settings, 'SMS_PROVIDER', None)
    if provider == 'twilio':
        # Example placeholder - don't import Twilio unless configured
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(body=message, from_=settings.TWILIO_FROM, to=phone_number)
            return True
        except Exception as exc:
            logger.exception("Twilio send failed")
            return False

    # Fallback: log to console in development
    logger.info(f"[SMS to {phone_number}] {message}")
    print(f"[SMS to {phone_number}] {message}")
    return True
