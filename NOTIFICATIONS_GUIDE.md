# Real-time Push Notifications System

## Overview
This system provides real-time push notifications for work status updates using Django Channels (WebSocket) and React.

## Features Implemented

### Backend (Django)
- ✅ Django Channels for WebSocket support
- ✅ Notification model with work order references
- ✅ WebSocket consumer for real-time notifications
- ✅ JWT authentication for WebSocket connections
- ✅ Notification service functions for sending notifications
- ✅ Django signals for automatic notifications on work status changes
- ✅ REST API endpoints for notification management
- ✅ Notification types: new_work, work_reopened, work_completed

### Frontend (React)
- ✅ NotificationContext for global state management
- ✅ WebSocket connection manager with auto-reconnection
- ✅ NotificationBell component with badge
- ✅ NotificationDropdown for quick access
- ✅ Full Notifications page with filtering
- ✅ Browser notifications support
- ✅ Sound notifications with mute control
- ✅ Responsive design for mobile and desktop

## Notification Triggers

### 1. New Work Created
- **When**: A new work order is created with an assigned worker
- **Recipient**: The assigned worker
- **Message**: "You have been assigned new work: {work_title}"

### 2. Work Reopened
- **When**: A completed work order is reopened (marked as not completed)
- **Recipient**: The assigned worker
- **Message**: "Work has been reopened: {work_title}"

### 3. Work Completed
- **When**: A work order is marked as completed
- **Recipients**: All admin users
- **Message**: "Work has been completed: {work_title} by {worker_name}"

## Installation & Setup

### Backend Setup

1. **Install Dependencies** (already in requirements.txt):
   ```bash
   cd core
   source brain/bin/activate
   pip install daphne channels channels-redis redis
   ```

2. **Database Migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Settings Configuration** (already configured):
   - Django Channels is enabled
   - In-memory channel layer for development
   - Redis channel layer for production (requires Redis server)

### Frontend Setup

No additional dependencies needed! All components use existing packages.

## Running the Application

### Development Mode

1. **Start Django Development Server**:
   ```bash
   cd core
   source brain/bin/activate
   python manage.py runserver
   ```

2. **Start React Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```

The WebSocket will connect automatically when a user logs in.

### Production Deployment

1. **Install Redis** (required for production):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **Update Environment Variables**:
   ```bash
   # In core/.env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Run with Daphne** (instead of gunicorn):
   ```bash
   daphne -b 0.0.0.0 -p 8000 core.asgi:application
   ```

4. **Configure Nginx** (for WebSocket support):
   ```nginx
   location /ws/ {
       proxy_pass http://127.0.0.1:8000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

## API Endpoints

### Notification Endpoints

- `GET /api/notifications/` - List notifications (paginated)
  - Query params: `is_read`, `type`, `limit`, `offset`
- `GET /api/notifications/{id}/` - Get notification detail
- `POST /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read
- `DELETE /api/notifications/{id}/` - Delete notification
- `GET /api/notifications/unread_count/` - Get unread count

### WebSocket Endpoint

- `ws://localhost:8000/ws/notifications/?token={jwt_token}` - WebSocket connection

## Usage Guide

### For Users

1. **Viewing Notifications**:
   - Click the bell icon in the top bar to see recent notifications
   - Badge shows unread count
   - Click "View all notifications" for full history

2. **Managing Notifications**:
   - Click a notification to view the related work order
   - Click "Mark all as read" to clear unread notifications
   - Delete individual notifications from the full page
   - Toggle sound notifications on/off

3. **Browser Notifications**:
   - Allow browser notifications when prompted
   - Receive notifications even when the tab is in background

### For Developers

#### Sending Custom Notifications

```python
from services.notification_service import send_notification

# Send a custom notification
send_notification(
    recipient=user_object,
    notification_type='new_work',  # or 'work_reopened', 'work_completed'
    title='Notification Title',
    message='Notification message',
    work_order=work_object  # optional
)
```

#### Adding New Notification Types

1. **Update Model** (services/models.py):
   ```python
   NOTIFICATION_TYPES = [
       ('new_work', 'New Work'),
       ('work_reopened', 'Work Reopened'),
       ('work_completed', 'Work Completed'),
       ('your_new_type', 'Your New Type'),  # Add here
   ]
   ```

2. **Create Service Function** (services/notification_service.py):
   ```python
   def send_your_notification(work):
       return send_notification(
           recipient=user,
           notification_type='your_new_type',
           title='Your Title',
           message='Your Message',
           work_order=work
       )
   ```

3. **Add Signal Handler** (services/signals.py):
   ```python
   @receiver(post_save, sender=YourModel)
   def your_signal_handler(sender, instance, created, **kwargs):
       send_your_notification(instance)
   ```

4. **Update Frontend Icon** (NotificationItem.jsx):
   ```javascript
   case 'your_new_type':
       return (
           <div className="notification-icon your-style">
               {/* Your SVG icon */}
           </div>
       );
   ```

## Troubleshooting

### WebSocket Connection Issues

1. **Connection Refused**:
   - Ensure Django is running
   - Check if port 8000 is accessible
   - Verify JWT token is valid

2. **Frequent Disconnections**:
   - Check network stability
   - Verify Redis is running (production)
   - Check NGINX configuration (if using)

3. **Notifications Not Appearing**:
   - Check browser console for errors
   - Verify user is logged in
   - Check Django logs for errors
   - Ensure signals are properly connected

### Performance Optimization

1. **Database Queries**:
   - Notifications are indexed by recipient and created_at
   - Old notifications cleanup (run periodically):
     ```python
     from services.notification_service import cleanup_old_notifications
     cleanup_old_notifications(days=30)
     ```

2. **WebSocket Scaling**:
   - Use Redis channel layer (production)
   - Consider multiple Daphne workers
   - Use Redis pub/sub for cross-server notifications

## Testing

### Backend Tests
```bash
cd core
python manage.py test services.tests
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Create a new work order with an assigned worker
2. Check if the worker receives a notification
3. Mark work as completed
4. Check if admins receive completion notification
5. Reopen a work order
6. Check if worker receives reopened notification

## Security Considerations

- ✅ WebSocket connections require JWT authentication
- ✅ Users can only access their own notifications
- ✅ WSS (secure WebSocket) in production
- ✅ CORS configured properly
- ✅ Rate limiting on notification endpoints

## Future Enhancements

Potential features to add:
- [ ] Email notifications for important updates
- [ ] SMS notifications integration
- [ ] Notification preferences per user
- [ ] Notification groups/categories
- [ ] Rich notifications with images
- [ ] Notification history export
- [ ] Push notifications for mobile app

## Support

For issues or questions:
1. Check Django logs: `tail -f core/logs/django.log`
2. Check browser console for frontend errors
3. Test WebSocket connection manually
4. Review this guide's troubleshooting section

## License

This notification system is part of the BrainArtz Management System.
