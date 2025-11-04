# SMS Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Configure Environment
Add to `core/.env`:
```bash
TELECONIC_API_KEY=your_teleconic_api_key_here
TELECONIC_SENDER_ID=BrainArtz
```

### Step 2: Test Configuration
```bash
cd core
source brain/bin/activate
python test_teleconic_sms.py
```

### Step 3: Test with Real Phone Number
Edit `test_teleconic_sms.py`, uncomment at bottom:
```python
test_send_sms('+233241234567', test_mode=False)  # Your number
```

## 📱 Common Use Cases

### Invite New Employee (API)
```bash
POST /auth/generate-invite/
{
  "phone": "+233241234567",
  "email": "employee@company.com"
}
```

### Invite New Employee (CLI)
```bash
python manage.py invite_employee --phone "+233241234567"
```

### Create Employee Account (API)
```bash
POST /auth/create-employee/
{
  "username": "jdoe",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+233241234567"
}
```

### Create Employee Account (CLI)
```bash
python manage.py create_employee \
  --username jdoe \
  --phone "+233241234567" \
  --first-name John \
  --last-name Doe \
  --send-sms
```

### Resend Login Credentials
```bash
POST /auth/resend-credentials/1/
{
  "reset_password": true
}
```

## 💻 In Your Code

```python
from authentication.sms_backends import send_sms

# Send SMS
phone = "+233241234567"
message = "Your verification code is: 123456"
success = send_sms(phone, message)

if success:
    print("✓ SMS sent")
else:
    print("✗ SMS failed")
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not configured" | Add `TELECONIC_API_KEY` to `.env` |
| Phone format error | Use international format: `+233...` |
| SMS not received | Check API key, phone number, account balance |

## 📖 More Info

- Full guide: `SMS_INTEGRATION_GUIDE.md`
- Summary: `SMS_IMPLEMENTATION_SUMMARY.md`
- Test scripts: `test_teleconic_sms.py`, `test_sms_invitation.py`

## 🎯 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/generate-invite/` | POST | Create invitation & send SMS |
| `/auth/create-employee/` | POST | Create account & send credentials |
| `/auth/resend-credentials/{id}/` | POST | Resend login info via SMS |
| `/auth/register/{token}/` | POST | Employee registers from invite |

## ✅ Checklist

- [ ] Add `TELECONIC_API_KEY` to `.env`
- [ ] Run `test_teleconic_sms.py` to verify config
- [ ] Test with real phone number
- [ ] Update frontend to use SMS endpoints
- [ ] Monitor SMS usage and costs in production

---

**Need Help?** See `SMS_INTEGRATION_GUIDE.md` for detailed documentation.
