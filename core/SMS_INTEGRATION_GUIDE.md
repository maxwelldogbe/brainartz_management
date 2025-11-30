# SMS Integration Guide - BrainArtz Management System

## Overview
This system uses **Teleconic** as the SMS provider for sending notifications to employees, including:
- Employee invitations
- Login credentials
- Password resets
- System notifications

## Configuration

### Environment Variables
Add the following to your `.env` file:

```bash
# Teleconic SMS Provider Configuration
TELECONIC_API_KEY=your_teleconic_api_key_here
TELECONIC_SENDER_ID=BrainArtz
TELECONIC_API_URL=https://sms.teleconic.com/api/v1/send
```

### Required Settings
- `TELECONIC_API_KEY`: Your Teleconic API key (required)
- `TELECONIC_SENDER_ID`: The sender name that appears on SMS (default: "BrainArtz")
- `TELECONIC_API_URL`: Teleconic API endpoint (default: https://sms.teleconic.com/api/v1/send)

## Usage

### Basic SMS Sending

```python
from authentication.sms_backends import send_sms

# Send SMS to a phone number
phone = "+233241234567"  # Ghana format
message = "Your verification code is: 123456"
success = send_sms(phone, message)

if success:
    print("SMS sent successfully")
else:
    print("Failed to send SMS")
```

### Phone Number Normalization

The system automatically normalizes phone numbers:

```python
from authentication.sms_backends import normalize_phone_number

# Examples
normalize_phone_number("0241234567")        # -> +233241234567 (Ghana)
normalize_phone_number("+233241234567")     # -> +233241234567
normalize_phone_number("024-123-4567")      # -> +233241234567
normalize_phone_number("(024) 123 4567")    # -> +233241234567
```

## API Endpoints

### 1. Generate Employee Invitation
**POST** `/auth/generate-invite/`

Sends SMS invitation to a new employee.

**Request:**
```json
{
  "phone": "+233241234567",
  "email": "employee@company.com"  // optional
}
```

**Response:**
```json
{
  "message": "Employee invitation sent successfully",
  "invite_link": "http://yourdomain.com/auth/register/abc123...",
  "expires_at": "2024-12-01T10:00:00Z",
  "phone": "+233241234567",
  "sms_sent": true
}
```

### 2. Create Employee Manually
**POST** `/auth/create-employee/`

Creates an employee account and sends credentials via SMS.

**Request:**
```json
{
  "username": "jdoe",
  "email": "jdoe@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+233241234567",
  "password": "SecurePass123!"  // optional, auto-generated if not provided
}
```

**Response:**
```json
{
  "message": "Employee account created successfully",
  "employee": {
    "id": 1,
    "username": "jdoe",
    "email": "jdoe@company.com",
    "full_name": "John Doe",
    "phone": "+233241234567",
    "is_worker": true
  },
  "login_credentials": {
    "username": "jdoe",
    "password": "SecurePass123!",
    "email": "jdoe@company.com"
  },
  "sms_sent": true,
  "instructions": "Share the login credentials with the employee securely..."
}
```

### 3. Resend Login Credentials
**POST** `/auth/resend-credentials/{user_id}/`

Resends login credentials to an existing employee.

**Request:**
```json
{
  "reset_password": true  // optional, generates new password if true
}
```

**Response:**
```json
{
  "message": "Password reset and credentials sent successfully",
  "employee": {
    "id": 1,
    "username": "jdoe",
    "email": "jdoe@company.com",
    "full_name": "John Doe",
    "phone": "+233241234567"
  },
  "sms_sent": true,
  "new_password": "NewSecurePass456!"  // only if reset_password was true
}
```

### 4. Register from Invitation
**POST** `/auth/register/{token}/`

Employee uses this to complete registration from SMS invitation.

**Request:**
```json
{
  "username": "jdoe",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "email": "jdoe@company.com"  // optional
}
```

**Response:**
```json
{
  "message": "Employee account created successfully! Welcome to the team.",
  "access": "jwt_access_token_here",
  "refresh": "jwt_refresh_token_here",
  "user": {
    "id": 1,
    "email": "jdoe@company.com",
    "username": "jdoe",
    "is_worker": true,
    "phone": "+233241234567"
  }
}
```

## Testing

### Test SMS Configuration
Run the test script to verify your SMS setup:

```bash
cd core
python test_teleconic_sms.py
```

This will:
- Check if Teleconic is properly configured
- Test phone number normalization
- Show usage examples

### Send Test SMS
To send an actual test SMS, edit `test_teleconic_sms.py` and uncomment:

```python
# At the bottom of main() function
test_send_sms('+233241234567', test_mode=False)  # Your real phone number
```

### Test Complete Invitation Flow
Run the SMS invitation test:

```bash
cd core
python test_sms_invitation.py
```

## Django Management Commands

### 1. Invite Employee
```bash
python manage.py invite_employee --phone "+233241234567" --email "employee@company.com"
```

### 2. Create Employee Account
```bash
python manage.py create_employee \
  --username jdoe \
  --phone "+233241234567" \
  --first-name John \
  --last-name Doe \
  --email jdoe@company.com \
  --send-sms
```

### 3. Resend Credentials
```bash
python manage.py resend_credentials --username jdoe --reset-password
```

## SMS Message Templates

### Employee Invitation
```
You're invited to join our team! Use this link to create your account: 
[invite_link]

Your invitation code: [token]
This invitation expires on [date].
Welcome aboard!
```

### Manual Account Creation
```
Welcome to the team, [Full Name]! 🎉

Your account has been created:
👤 Username: [username]
📧 Email: [email]
🔒 Password: [password]

Please log in and change your password.
Welcome aboard! 🚀
```

### Password Reset
```
Hi [Full Name]! 👋

Your password has been reset:
👤 Username: [username]
📧 Email: [email]
🔒 New Password: [password]

Please log in and change your password.
```

## Troubleshooting

### SMS Not Sending

1. **Check API Key**: Ensure `TELECONIC_API_KEY` is set in `.env`
2. **Check API URL**: Verify `TELECONIC_API_URL` is correct
3. **Check Phone Format**: Phone numbers should be in international format (+233...)
4. **Check Logs**: Look for error messages in Django logs

### Common Issues

**Issue**: SMS fails with "API key not configured"
**Solution**: Add `TELECONIC_API_KEY` to your `.env` file

**Issue**: Phone number format errors
**Solution**: Use international format (+233...) or let the system normalize local formats (024...)

**Issue**: SMS sent but not received
**Solution**: 
- Verify phone number is correct
- Check Teleconic account balance
- Verify sender ID is approved

## Security Best Practices

1. **Never commit** API keys to version control
2. **Use HTTPS** for all API endpoints in production
3. **Validate phone numbers** before sending SMS
4. **Rate limit** SMS sending to prevent abuse
5. **Log SMS activities** for audit purposes
6. **Expire invitations** after a reasonable time (default: 24 hours)

## Production Deployment

1. Set environment variables in your hosting platform
2. Ensure `.env` is in `.gitignore`
3. Use strong API keys from Teleconic
4. Monitor SMS usage and costs
5. Set up alerts for failed SMS deliveries

## Support

For Teleconic API support:
- Website: https://sms.teleconic.com
- Documentation: https://sms.teleconic.com/api/docs

For system support:
- Check application logs
- Review Django error messages
- Test with `test_teleconic_sms.py` script
