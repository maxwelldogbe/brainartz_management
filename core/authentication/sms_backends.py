from django.conf import settings
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

def send_sms(phone_number: str, message: str) -> bool:
    """Send SMS to phone_number with message.

    Supports multiple SMS providers. Return True on success.
    """
    # Normalize phone number
    phone_number = normalize_phone_number(phone_number)
    
    provider = getattr(settings, 'SMS_PROVIDER', None)
    
    if provider == 'twilio':
        return send_twilio_sms(phone_number, message)
    elif provider == 'vonage':  # Formerly Nexmo
        return send_vonage_sms(phone_number, message)
    elif provider == 'africasTalking':
        return send_africas_talking_sms(phone_number, message)
    else:
        # Fallback: log to console in development
        logger.info(f"[SMS to {phone_number}] {message}")
        print(f"[SMS to {phone_number}] {message}")
        return True


def normalize_phone_number(phone: str) -> str:
    """Normalize phone number format for international sending."""
    if not phone:
        return phone
    
    # Remove common formatting characters
    clean = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('.', '')
    
    # If number doesn't start with +, assume it needs country code
    # For Ghana (common in Africa), add +233 if it starts with 0
    if clean.startswith('0') and len(clean) == 10:
        clean = '+233' + clean[1:]
    elif not clean.startswith('+'):
        # Default to assuming it's already formatted or add + if it looks international
        if len(clean) > 10:
            clean = '+' + clean
    
    return clean


def send_twilio_sms(phone_number: str, message: str) -> bool:
    """Send SMS using Twilio."""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message_obj = client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM,
            to=phone_number
        )
        
        logger.info(f"Twilio SMS sent successfully. SID: {message_obj.sid}")
        return True
    except Exception as exc:
        logger.exception(f"Twilio SMS failed to {phone_number}: {exc}")
        return False


def send_vonage_sms(phone_number: str, message: str) -> bool:
    """Send SMS using Vonage (formerly Nexmo)."""
    try:
        import vonage
        
        client = vonage.Client(
            key=settings.VONAGE_API_KEY,
            secret=settings.VONAGE_API_SECRET
        )
        
        response = client.sms.send_message({
            'from': settings.VONAGE_FROM,
            'to': phone_number,
            'text': message
        })
        
        if response['messages'][0]['status'] == '0':
            logger.info(f"Vonage SMS sent successfully to {phone_number}")
            return True
        else:
            logger.error(f"Vonage SMS failed: {response['messages'][0]['error-text']}")
            return False
            
    except Exception as exc:
        logger.exception(f"Vonage SMS failed to {phone_number}: {exc}")
        return False


def send_africas_talking_sms(phone_number: str, message: str) -> bool:
    """Send SMS using Africa's Talking (popular African SMS provider)."""
    try:
        import africastalking
        
        # Initialize the SDK
        africastalking.initialize(
            username=settings.AFRICAS_TALKING_USERNAME,
            api_key=settings.AFRICAS_TALKING_API_KEY
        )
        
        # Get the SMS service
        sms = africastalking.SMS
        
        # Send the message
        response = sms.send(message, [phone_number], sender_id=settings.AFRICAS_TALKING_SENDER_ID)
        
        if response['SMSMessageData']['Recipients'][0]['status'] == 'Success':
            logger.info(f"Africa's Talking SMS sent successfully to {phone_number}")
            return True
        else:
            logger.error(f"Africa's Talking SMS failed: {response}")
            return False
            
    except Exception as exc:
        logger.exception(f"Africa's Talking SMS failed to {phone_number}: {exc}")
        return False


def send_generic_http_sms(phone_number: str, message: str) -> bool:
    """Send SMS using a generic HTTP API endpoint."""
    try:
        url = settings.SMS_HTTP_URL
        headers = {'Content-Type': 'application/json'}
        
        # Add authentication if configured
        if hasattr(settings, 'SMS_HTTP_AUTH_HEADER'):
            headers['Authorization'] = settings.SMS_HTTP_AUTH_HEADER
        
        payload = {
            'to': phone_number,
            'message': message,
            'from': getattr(settings, 'SMS_HTTP_FROM', 'Employee Portal')
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        logger.info(f"HTTP SMS sent successfully to {phone_number}")
        return True
        
    except Exception as exc:
        logger.exception(f"HTTP SMS failed to {phone_number}: {exc}")
        return False
