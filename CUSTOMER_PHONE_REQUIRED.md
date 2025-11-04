# Customer Phone Number - Always Required

## Summary
Updated the work form to make customer phone number always required (not just for notification categories). This ensures all customers have phone numbers for SMS notifications.

## Changes Made

### Frontend Changes

#### EnhancedWorkForm (`frontend/src/components/EnhancedWorkForm.jsx`)

**Updated Validation:**
```javascript
// Before - Phone only required for notification categories
if (selectedCategory && selectedCategory.send_completion_notification) {
  if (!formData.customer_phone.trim()) {
    newErrors.customer_phone = 'Required for notifications';
  }
}

// After - Phone always required
if (!formData.customer_phone.trim()) {
  newErrors.customer_phone = 'Customer phone is required';
} else if (formData.customer_phone.trim().length < 10) {
  newErrors.customer_phone = 'Please enter a valid phone number (minimum 10 digits)';
}
```

**Updated UI:**
- Changed label from "Customer Phone (Optional/Required)" to "Customer Phone *"
- Added `required` attribute to input field
- Added help text: "Required for sending completion notifications"
- Removed conditional label logic

### Backend Changes

#### WorkSerializer (`core/services/serializers.py`)

**Added Validation in create() method:**
```python
# Validate required customer fields
if not customer_name or not customer_name.strip():
    raise serializers.ValidationError({'customer_name': 'Customer name is required'})

if not customer_phone or not customer_phone.strip():
    raise serializers.ValidationError({'customer_phone': 'Customer phone is required for notifications'})
```

## Required Fields Summary

| Field | Status | Validation |
|-------|--------|------------|
| Customer Name | ✅ Required | Must not be empty |
| Customer Phone | ✅ Required | Must be at least 10 characters |
| Customer Email | ⭕ Optional | Valid email format when provided |

## Benefits

1. **Consistent Data Collection**
   - All customers will have phone numbers
   - No missing contact info for notifications

2. **Future-Proof**
   - Any category can be enabled for notifications later
   - No need to update customer records retroactively

3. **Better User Experience**
   - Clear expectation - phone is always required
   - No confusion about when phone is needed

4. **SMS Notification Ready**
   - All works have customer phone available
   - Notifications can be sent for any category

## Form Validation Flow

```
User submits work form
    ↓
Frontend validates:
    ✓ Customer name not empty?
    ✓ Customer phone not empty?
    ✓ Customer phone >= 10 chars?
    ↓
Backend validates:
    ✓ Customer name provided?
    ✓ Customer phone provided?
    ↓
Create/find customer
    ↓
Create work
    ↓
Success!
```

## Updated Form Layout

```
┌─────────────────────────────────────────┐
│ Work Title *                            │
├─────────────────────────────────────────┤
│ Job Category          │ Customer Name * │
├─────────────────────────────────────────┤
│ Customer Phone *      │ Customer Email  │
│ (Always Required)     │ (Optional)      │
│ "Required for notifications"            │
├─────────────────────────────────────────┤
│ Worker Assignment     │ Price *         │
└─────────────────────────────────────────┘
```

## Error Messages

### Customer Phone Validation Errors

| Scenario | Error Message |
|----------|--------------|
| Phone field empty | "Customer phone is required" |
| Phone too short (< 10 chars) | "Please enter a valid phone number (minimum 10 digits)" |
| Backend validation fails | "Customer phone is required for notifications" |

## Files Modified

1. **frontend/src/components/EnhancedWorkForm.jsx**
   - Updated validation logic
   - Changed phone field label
   - Added required attribute
   - Added help text

2. **core/services/serializers.py**
   - Added customer_name validation
   - Added customer_phone validation
   - Raises ValidationError if missing

## Testing

✅ Test creating work without phone number (should fail)
✅ Test creating work with phone < 10 chars (should fail)
✅ Test creating work with valid phone (should succeed)
✅ Verify error messages display correctly
✅ Check backend validation prevents submission
✅ Verify customer is created with phone number

## Migration Impact

**No database migration required** - Customer model already has phone field (nullable)

**Existing data:**
- Existing customers without phone numbers can still exist
- Only new works require phone numbers
- Old works with customers without phones are unaffected

## Notes

- Phone number format is flexible (any format accepted, min 10 chars)
- International format recommended (e.g., +233241234567)
- No automatic formatting applied (user enters as-is)
- Backend stores phone exactly as entered
- Frontend validates length only, not format
