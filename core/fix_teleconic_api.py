#!/usr/bin/env python3
"""
Teleconic API Diagnostic Tool

This tool helps identify the correct Teleconic API endpoint.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
import requests

def test_api_endpoint():
    """Test Teleconic API endpoint and suggest fixes"""
    
    api_key = getattr(settings, 'TELECONIC_API_KEY', None)
    sender_id = getattr(settings, 'TELECONIC_SENDER_ID', 'BrainArtz')
    api_url = getattr(settings, 'TELECONIC_API_URL', 'https://sms.teleconic.com/api/v1/send')
    
    print("="*70)
    print("TELECONIC API DIAGNOSTIC TOOL")
    print("="*70)
    
    print(f"\n📋 Current Configuration:")
    print(f"  API Key: {'✓ Set' if api_key else '✗ Missing'} ({len(api_key) if api_key else 0} chars)")
    print(f"  Sender ID: {sender_id}")
    print(f"  API URL: {api_url}")
    
    if not api_key:
        print("\n❌ TELECONIC_API_KEY is not set!")
        print("\nTo fix:")
        print("  1. Get API key from Teleconic dashboard")
        print("  2. Add to core/.env file:")
        print("     TELECONIC_API_KEY=your_api_key_here")
        return
    
    print(f"\n🔍 Testing API Endpoints...")
    
    test_phone = "233535859825"  # Ghana format
    test_message = "Test message from BrainArtz"
    
    # Test different endpoint formats
    test_configs = [
        {
            'name': 'Current (JSON + Bearer)',
            'url': api_url,
            'method': 'json',
            'headers': {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            'payload': {'to': test_phone, 'message': test_message, 'sender_id': sender_id}
        },
        {
            'name': 'Form-based with key',
            'url': 'https://sms.teleconic.com/api',
            'method': 'form',
            'headers': {},
            'payload': {'key': api_key, 'to': test_phone, 'msg': test_message, 'sender_id': sender_id}
        },
        {
            'name': 'Query params',
            'url': f'https://sms.teleconic.com/api?key={api_key}&to={test_phone}&msg={test_message}&sender_id={sender_id}',
            'method': 'get',
            'headers': {},
            'payload': {}
        },
        {
            'name': 'JSON with API key in body',
            'url': api_url,
            'method': 'json',
            'headers': {'Content-Type': 'application/json'},
            'payload': {'api_key': api_key, 'to': test_phone, 'message': test_message, 'sender_id': sender_id}
        },
    ]
    
    working_configs = []
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n{i}. {config['name']}")
        print(f"   URL: {config['url'][:80]}...")
        
        try:
            if config['method'] == 'json':
                response = requests.post(config['url'], json=config['payload'], 
                                       headers=config['headers'], timeout=10)
            elif config['method'] == 'form':
                response = requests.post(config['url'], data=config['payload'], 
                                       headers=config['headers'], timeout=10)
            else:  # get
                response = requests.get(config['url'], timeout=10)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 404:
                print(f"   Result: ❌ Not Found")
            elif response.status_code == 401:
                print(f"   Result: ⚠️  Unauthorized (endpoint exists but API key invalid)")
                working_configs.append({**config, 'note': 'Check API key'})
            elif response.status_code == 200:
                print(f"   Result: ✓ Success")
                print(f"   Response: {response.text[:150]}")
                working_configs.append(config)
            else:
                print(f"   Result: ⚠️  Status {response.status_code}")
                print(f"   Response: {response.text[:150]}")
                if response.status_code < 500:
                    working_configs.append({**config, 'note': f'Status {response.status_code}'})
                    
        except requests.exceptions.ConnectionError:
            print(f"   Result: ✗ Connection failed")
        except requests.exceptions.Timeout:
            print(f"   Result: ✗ Timeout")
        except Exception as e:
            print(f"   Result: ✗ Error: {type(e).__name__}")
    
    # Summary
    print(f"\n{'='*70}")
    print("📊 SUMMARY")
    print(f"{'='*70}")
    
    if working_configs:
        print(f"\n✓ Found {len(working_configs)} potential working endpoint(s):\n")
        for i, config in enumerate(working_configs, 1):
            print(f"{i}. {config['name']}")
            print(f"   URL: {config['url'][:80]}")
            if 'note' in config:
                print(f"   Note: {config['note']}")
            print()
        
        print("💡 RECOMMENDED ACTIONS:")
        print("\n1. Update core/.env with the working endpoint:")
        print(f"   TELECONIC_API_URL={working_configs[0]['url']}")
        
        if working_configs[0]['method'] == 'form':
            print("\n2. Update sms_backends.py to use form-based API")
        
    else:
        print("\n❌ No working endpoints found")
        print("\n💡 POSSIBLE SOLUTIONS:")
        print("\n1. Contact Teleconic Support:")
        print("   - Request API documentation")
        print("   - Verify your API key is active")
        print("   - Get the correct API endpoint URL")
        
        print("\n2. Check Teleconic Dashboard:")
        print("   - Login to https://sms.teleconic.com")
        print("   - Look for API documentation section")
        print("   - Check API key status")
        
        print("\n3. Alternative: Use Console Backend (for testing):")
        print("   In authentication/sms_backends.py, use:")
        print("   logger.info(f'SMS to {phone_number}: {message}')")
        print("   return True  # For testing without real SMS")
        
        print("\n4. Try other SMS providers:")
        print("   - Twilio (https://www.twilio.com)")
        print("   - Africa's Talking (https://africastalking.com)")
        print("   - TermII (https://termii.com)")

if __name__ == '__main__':
    test_api_endpoint()
