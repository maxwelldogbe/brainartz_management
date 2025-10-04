from django.core.management.base import BaseCommand, CommandError
from django.urls import reverse
from django.conf import settings
from authentication.models import InvitationToken
from authentication.sms_backends import send_sms
from datetime import timedelta
from django.utils import timezone
import uuid


class Command(BaseCommand):
    help = 'Send SMS invitation to an employee to join the system'

    def add_arguments(self, parser):
        parser.add_argument(
            'phone',
            type=str,
            help='Employee phone number (required)'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Employee email address (optional)'
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Hours until invitation expires (default: 24)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Generate invitation but don\'t send SMS'
        )

    def handle(self, *args, **options):
        phone = options['phone']
        email = options.get('email')
        hours = options['hours']
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.SUCCESS(f'Creating employee invitation for phone: {phone}')
        )

        try:
            # Create invitation token
            expires_at = timezone.now() + timedelta(hours=hours)
            
            invite = InvitationToken.objects.create(
                phone=phone,
                email=email,
                expires_at=expires_at
            )

            # Generate invitation link (you may need to adjust the domain)
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            invite_link = f"{base_url}/register/{invite.token}"

            # Create SMS message
            message = (
                f"🎉 You're invited to join our team!\n\n"
                f"Create your account here: {invite_link}\n\n"
                f"Your invitation code: {invite.token}\n"
                f"Expires: {invite.expires_at.strftime('%Y-%m-%d at %H:%M')}\n\n"
                f"Welcome aboard! 🚀"
            )

            # Display information
            self.stdout.write(f"Invitation Token: {invite.token}")
            self.stdout.write(f"Expires At: {invite.expires_at}")
            self.stdout.write(f"Invitation Link: {invite_link}")
            
            if email:
                self.stdout.write(f"Email: {email}")

            self.stdout.write("\nSMS Message:")
            self.stdout.write("-" * 50)
            self.stdout.write(message)
            self.stdout.write("-" * 50)

            if dry_run:
                self.stdout.write(
                    self.style.WARNING('DRY RUN: SMS not sent (use --dry-run=False to send)')
                )
            else:
                # Send SMS
                sms_success = send_sms(phone, message)
                
                if sms_success:
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ SMS invitation sent successfully to {phone}!')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Failed to send SMS to {phone}')
                    )
                    raise CommandError('SMS sending failed')

            self.stdout.write(
                self.style.SUCCESS(f'\n🎯 Employee invitation created successfully!')
            )

        except Exception as e:
            raise CommandError(f'Error creating invitation: {str(e)}')


# Usage examples:
# python manage.py invite_employee "+233241234567"
# python manage.py invite_employee "+233241234567" --email="john@company.com" 
# python manage.py invite_employee "+233241234567" --hours=48 --dry-run