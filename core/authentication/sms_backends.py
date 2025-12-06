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
    
    API Documentation: https://sms.teleconic.com/api/v1
    Endpoint: POST /sms/send
    """
    try:
        api_key = getattr(settings, 'TELECONIC_API_KEY', None)
        sender_id = getattr(settings, 'TELECONIC_SENDER_ID', 'BrainArtz')
        api_url = getattr(settings, 'TELECONIC_API_URL', 'https://sms.teleconic.com/api/v1/sms/send')
        
        if not api_key or api_key == 'your_teleconic_api_key_here':
            logger.error("Teleconic API key not configured. Set TELECONIC_API_KEY in .env")
            return False
        
        # Teleconic API expects Bearer token authentication
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        # API payload according to documentation
        payload = {
            'to': phone_number,
            'message': message,
            'sender_id': sender_id
        }
        
        logger.info(f"Sending SMS to {phone_number} via Teleconic API")
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parse JSON response
        result = response.json()
        
        # Check success field according to API documentation
        if result.get('success') == True:
            data = result.get('data', {})
            request_id = data.get('request_id', 'N/A')
            recipients_count = data.get('recipients_count', 0)
            logger.info(
                f"✅ SMS sent successfully to {phone_number}\n"
                f"   Request ID: {request_id}\n"
                f"   Recipients: {recipients_count}\n"
                f"   Balance remaining: {data.get('remaining_balance', 'N/A')}"
            )
            return True
        else:
            error_msg = result.get('message', 'Unknown error')
            logger.error(f"❌ Teleconic SMS failed: {error_msg}")
            return False
        
    except requests.exceptions.HTTPError as exc:
        status_code = exc.response.status_code
        try:
            error_data = exc.response.json()
            error_msg = error_data.get('message', exc.response.text[:200])
        except:
            error_msg = exc.response.text[:200]
        
        error_messages = {
            401: "Invalid or missing API key",
            403: "Insufficient permissions - check API key scopes",
            422: f"Validation error: {error_msg}",
            429: "Rate limit exceeded (60 requests/minute)",
            402: "Insufficient balance in Teleconic account",
            404: "API endpoint not found - check TELECONIC_API_URL in .env",
        }
        
        logger.error(
            f"❌ Teleconic API error {status_code}: {error_messages.get(status_code, error_msg)}\n"
            f"   Phone: {phone_number}\n"
            f"   URL: {api_url}"
        )
        return False
    except requests.exceptions.RequestException as exc:
        logger.exception(f"❌ Teleconic SMS request failed to {phone_number}: {exc}")
        return False
    except Exception as exc:
        logger.exception(f"❌ Teleconic SMS unexpected error for {phone_number}: {exc}")
        return False
