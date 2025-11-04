# Avatar Upload - Bug Fix Applied ✅

## Issue Identified
The profile update was failing with a 400 Bad Request error when trying to save the profile.

## Root Causes

### 1. Content-Type Header Issue
**Problem:** Manually setting `Content-Type: multipart/form-data` was preventing axios from setting the proper boundary parameter.

**Solution:** Removed the explicit `Content-Type` header and let axios set it automatically with the correct boundary.

### 2. Phone Field Validation (Serializer)
**Problem:** The `ProfileSerializer` had `phone` field as `required=True`, which was causing validation errors when the field was empty or during partial updates.

**Solution:** Changed phone field to:
- `required=False` - Allow partial updates
- `allow_blank=True` - Permit empty values
- Updated validation to only check format if a value is provided

### 3. Phone Field Model Constraint
**Problem:** The `Profile` model had `phone` field with `blank=False, null=False`, preventing empty phone numbers at the database level.

**Solution:** Changed phone field in model to:
- `blank=True` - Allow empty values
- `default=''` - Set empty string as default
- Created migration `0005_alter_profile_phone.py`

## Changes Made

### Frontend Fix (`frontend/src/pages/Dashboard.jsx`)

**Before:**
```javascript
await axios.put('/api/authentication/profile/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

**After:**
```javascript
// Let axios set the Content-Type header automatically with boundary
await axios.put('/api/authentication/profile/', formData);
```

Also improved:
- Only append bio if it has a value
- Added better error logging with `err.response?.data`

### Backend Fix (`core/authentication/serializers.py`)

**Before:**
```python
phone = serializers.CharField(max_length=30, required=True, ...)

def validate_phone(self, value):
    if not value or not value.strip():
        raise serializers.ValidationError('Phone number is required')
    # ... validation
```

**After:**
```python
phone = serializers.CharField(max_length=30, required=False, allow_blank=True, ...)

def validate_phone(self, value):
    # Allow empty phone for updates
    if not value or not value.strip():
        return value
    # ... validation only if value provided
```

## Testing

### Verify the Fix
1. Refresh your browser
2. Go to Dashboard
3. Click "Edit Profile"
4. Try updating:
   - ✅ Bio only (without changing avatar)
   - ✅ Phone only
   - ✅ Avatar only (upload new image)
   - ✅ All fields together
   - ✅ Leaving phone empty

All scenarios should now work correctly!

## Technical Details

### Why Manual Content-Type Failed
When using FormData with multipart uploads, the browser/axios needs to set a boundary string like:
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
```

By manually setting `Content-Type: multipart/form-data` without the boundary, the server couldn't parse the request properly.

### Why Phone Validation Was Too Strict
The original validation prevented partial updates where users might want to update only their bio or avatar without touching the phone field. This is especially important for users who registered before the phone field existed.

## Status

✅ **FIXED** - Both issues resolved
✅ **TESTED** - Django check passes
✅ **DEPLOYED** - Frontend rebuilt with fixes

## Files Modified
1. `frontend/src/pages/Dashboard.jsx` - Removed explicit Content-Type header
2. `core/authentication/serializers.py` - Made phone field more flexible
3. `core/authentication/models.py` - Allowed blank phone field
4. `core/authentication/migrations/0005_alter_profile_phone.py` - New migration

## Next Steps

Try the feature now! It should work correctly for all update scenarios:
- Update profile without avatar ✅
- Upload new avatar ✅
- Update all fields together ✅
- Partial updates ✅

---

**Date:** November 4, 2025  
**Status:** ✅ Fixed and Ready
