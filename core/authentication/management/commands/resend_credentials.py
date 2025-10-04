from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from authentication.sms_backends import send_sms
from django.utils.crypto import get_random_string

User = get_user_model()


class Command(BaseCommand):
    help = 'Resend login credentials to an employee via SMS'

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument(
            '--user-id',
            type=int,
            help='Employee user ID'
        )
        group.add_argument(
            '--username',
            type=str,
            help='Employee username'
        )
        group.add_argument(
            '--phone',
            type=str,
            help='Employee phone number'
        )
        
        parser.add_argument(
            '--reset-password',
            action='store_true',
            help='Generate and set a new password for the employee'
        )
        parser.add_argument(
            '--new-password',
            type=str,
            help='Set specific new password (requires --reset-password)'
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        username = options.get('username')
        phone = options.get('phone')
        reset_password = options['reset_password']
        new_password = options.get('new_password')

        # Validate password options
        if new_password and not reset_password:
            raise CommandError('--new-password requires --reset-password')

        # Find the user
        try:
            if user_id:
                user = User.objects.get(id=user_id, is_worker=True)
            elif username:
                user = User.objects.get(username=username, is_worker=True)
            elif phone:
                # Find by phone in profile
                from authentication.models import Profile
                profile = Profile.objects.get(phone=phone)
                user = profile.user
                if not user.is_worker:
                    raise CommandError('User is not an employee')
            else:
                raise CommandError('Must provide user-id, username, or phone')
                
        except User.DoesNotExist:
            raise CommandError('Employee not found')
        except Exception as e:
            raise CommandError(f'Error finding employee: {str(e)}')

        self.stdout.write(f'Found employee: {user.get_full_name()} ({user.username})')

        # Get phone number
        if hasattr(user, 'profile') and user.profile.phone:
            employee_phone = user.profile.phone
        else:
            raise CommandError(f'Employee {user.username} does not have a phone number in profile')

        # Handle password reset if requested
        password_info = None
        if reset_password:
            if new_password:
                password_info = new_password
            else:
                password_info = get_random_string(12)
            
            user.set_password(password_info)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Password reset for {user.username}')
            )

        # Prepare SMS message
        if reset_password:
            message = (
                f"Hi {user.get_full_name()}! 👋\n\n"
                f"Your password has been reset:\n"
                f"👤 Username: {user.username}\n"
                f"📧 Email: {user.email}\n"
                f"🔒 New Password: {password_info}\n\n"
                f"Please log in and change your password.\n"
            )
        else:
            message = (
                f"Hi {user.get_full_name()}! 👋\n\n"
                f"Your login details:\n"
                f"👤 Username: {user.username}\n"
                f"📧 Email: {user.email}\n\n"
                f"Contact admin if you need password reset.\n"
            )

        # Send SMS
        try:
            sms_success = send_sms(employee_phone, message)
            
            if sms_success:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Credentials sent via SMS to {employee_phone}')
                )
                if reset_password:
                    self.stdout.write(f'New password: {password_info}')
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to send SMS to {employee_phone}')
                )
                self.stdout.write('\nCredentials to share manually:')
                self.stdout.write(f'Username: {user.username}')
                self.stdout.write(f'Email: {user.email}')
                if reset_password:
                    self.stdout.write(f'New Password: {password_info}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error sending SMS: {str(e)}')
            )
            
            # Display credentials for manual sharing
            self.stdout.write('\nCredentials to share manually:')
            self.stdout.write(f'Username: {user.username}')
            self.stdout.write(f'Email: {user.email}')
            if reset_password:
                self.stdout.write(f'New Password: {password_info}')


# Usage examples:
# python manage.py resend_credentials --username=johndoe
# python manage.py resend_credentials --user-id=5 --reset-password
# python manage.py resend_credentials --phone="+233241234567" --reset-password --new-password="NewSecure123!"