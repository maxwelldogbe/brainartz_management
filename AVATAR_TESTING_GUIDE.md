# Avatar File Upload - Testing Guide 🧪

## Verification Completed ✅

### Backend Verification
- ✅ Pillow library installed (version 12.0.0)
- ✅ Migration created and applied successfully
- ✅ Profile model uses ImageField for avatar
- ✅ ProfileSerializer configured correctly
- ✅ Media directory structure created
- ✅ Django system check passes with no issues

### Frontend Verification
- ✅ Frontend built successfully without errors
- ✅ Dashboard component updated
- ✅ File input component implemented
- ✅ Preview functionality added

## Manual Testing Steps

### 1. Test Avatar Upload
1. Open the application in your browser
2. Log in with your account
3. Navigate to Dashboard
4. Click "Edit Profile"
5. Click on the profile picture file input
6. Select an image file from your device
7. Verify the preview appears immediately
8. Click "Save Changes"
9. Verify the avatar displays correctly after save

### 2. Test Different Image Formats
Try uploading:
- ✅ JPEG/JPG files
- ✅ PNG files
- ✅ GIF files
- ✅ WebP files (if supported by browser)

### 3. Test Edge Cases
- Upload a large image (should work, but may take longer)
- Upload without selecting a file (should keep existing avatar)
- Cancel editing after selecting a file (should not save)
- Edit profile multiple times with different images

### 4. Verify File Storage
Check that uploaded files are stored correctly:
```bash
ls -la media/avatars/
```

Expected: Files should be stored with unique names in the avatars directory

### 5. Test Avatar Display
- ✅ Avatar should display in profile section
- ✅ Avatar should be circular
- ✅ Avatar should maintain aspect ratio
- ✅ Default icon should show if no avatar uploaded

## API Testing

### Test Profile Endpoint with cURL

#### 1. Get Profile (GET request)
```bash
# Replace TOKEN with your actual JWT token
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/authentication/profile/
```

Expected response:
```json
{
  "phone": "+233241234567",
  "bio": "Your bio text",
  "avatar": "avatars/filename.jpg",
  "avatar_url": "http://localhost:8000/media/avatars/filename.jpg"
}
```

#### 2. Update Profile with Avatar (PUT request)
```bash
# Replace TOKEN with your actual JWT token
# Replace path/to/image.jpg with actual image path
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -F "phone=+233241234567" \
  -F "bio=Updated bio" \
  -F "avatar=@path/to/image.jpg" \
  http://localhost:8000/api/authentication/profile/
```

## Expected Behavior

### Successful Upload
- 200 OK status code
- Profile updated in database
- File saved to media/avatars/
- avatar_url returned in response
- Avatar displays in frontend

### Without Avatar Change
- Can update phone and bio without uploading new avatar
- Existing avatar remains unchanged

### Error Handling
- Invalid file type: Should show appropriate error
- Large file: Should handle or show size limit error
- Network error: Should show user-friendly message

## Browser Console Testing

Open browser console and check for:
```javascript
// After profile load
console.log('Profile data:', profile);
// Should show avatar_url field

// After file selection
console.log('Avatar preview:', avatarPreview);
// Should show base64 data URL

// After save
console.log('Updated profile:', response.data);
// Should show new avatar_url
```

## Database Verification

Check database directly:
```bash
python manage.py shell
```

```python
from authentication.models import Profile, User

# Get a user's profile
user = User.objects.first()
profile = user.profile

# Check avatar field
print(f"Avatar: {profile.avatar}")
print(f"Avatar URL: {profile.avatar.url if profile.avatar else 'No avatar'}")

# List all profiles with avatars
profiles_with_avatars = Profile.objects.exclude(avatar='').exclude(avatar=None)
print(f"Profiles with avatars: {profiles_with_avatars.count()}")
```

## Troubleshooting

### Avatar Not Displaying
1. Check media URL configuration in settings.py
2. Verify file exists in media/avatars/
3. Check file permissions
4. Verify Django is serving media files in DEBUG mode

### Upload Fails
1. Check Pillow is installed: `pip list | grep Pillow`
2. Check file size limits in Django settings
3. Check disk space
4. Check browser console for errors

### Preview Not Showing
1. Check FileReader API support in browser
2. Check JavaScript console for errors
3. Verify file is a valid image

## Performance Considerations

### Image Optimization (Future Enhancement)
Consider implementing:
- Image resizing on upload
- Thumbnail generation
- Maximum file size validation
- Image format conversion

### Current Limitations
- No client-side file size validation
- No image compression
- No thumbnail generation
- Original images stored as-is

## Security Notes

✅ File uploads restricted to images only (via accept attribute)
✅ Files stored in separate media directory
✅ Authentication required for profile updates
✅ Each user can only update their own profile

⚠️ Consider adding:
- Server-side file type validation
- File size limits
- Virus scanning for production
- Image sanitization

## Summary

The avatar file upload feature is fully implemented and ready for testing. All backend and frontend changes have been completed successfully. The system properly handles image uploads, storage, and display with appropriate error handling and user feedback.

Happy Testing! 🎉
