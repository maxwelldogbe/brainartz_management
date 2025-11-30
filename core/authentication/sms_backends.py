from django.conf import settings
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

def send_sms(phone_number: str, message: str) -> bool:
    """Send SMS to phone_number with message using Teleconic API.

    Return True on success.
    """
    # Normalize phone number
    phone_number = normalize_phone_number(phone_number)
    
    return send_teleconic_sms(phone_number, message)


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


def send_teleconic_sms(phone_number: str, message: str) -> bool:
    """Send SMS using Teleconic API.
    
    Teleconic is a telecommunications provider.
    API Documentation: https://sms.teleconic.com/api/v1
    """
    try:
        api_key = getattr(settings, 'TELECONIC_API_KEY', None)
        sender_id = getattr(settings, 'TELECONIC_SENDER_ID', 'BrainArtz')
        api_url = getattr(settings, 'TELECONIC_API_URL', 'https://sms.teleconic.com/api/v1/send')
        
        if not api_key:
            logger.error("Teleconic API key not configured")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        payload = {
            'to': phone_number,
            'message': message,
            'sender_id': sender_id
        }
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get('status') == 'success' or response.status_code == 200:
            logger.info(f"Teleconic SMS sent successfully to {phone_number}. Message ID: {result.get('message_id', 'N/A')}")
            return True
        else:
            logger.error(f"Teleconic SMS failed: {result.get('message', 'Unknown error')}")
            return False
        
    except requests.exceptions.RequestException as exc:
        logger.exception(f"Teleconic SMS request failed to {phone_number}: {exc}")
        return False
    except Exception as exc:
        logger.exception(f"Teleconic SMS failed to {phone_number}: {exc}")
        return False
