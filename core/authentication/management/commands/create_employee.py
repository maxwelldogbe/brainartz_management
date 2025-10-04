from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from authentication.models import Profile
from authentication.sms_backends import send_sms, normalize_phone_number
from django.utils.crypto import get_random_string
import getpass

User = get_user_model()


class Command(BaseCommand):
    help = 'Create employee account manually (useful when SMS invitation fails)'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            type=str,
            help='Employee username (required)'
        )
        parser.add_argument(
            'phone',
            type=str,
            help='Employee phone number (required)'
        )
        parser.add_argument(
            '--first-name',
            type=str,
            required=True,
            help='Employee first name'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            required=True,
            help='Employee last name'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Employee email address (optional, will generate if not provided)'
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Employee password (optional, will generate if not provided)'
        )
        parser.add_argument(
            '--send-sms',
            action='store_true',
            help='Send login credentials via SMS'
        )
        parser.add_argument(
            '--interactive',
            action='store_true',
            help='Interactive mode for entering details'
        )

    def handle(self, *args, **options):
        if options['interactive']:
            return self.handle_interactive()
        
        username = options['username']
        phone = options['phone']
        first_name = options['first_name']
        last_name = options['last_name']
        email = options.get('email')
        password = options.get('password')
        send_sms_flag = options['send_sms']

        self.create_employee_account(
            username, phone, first_name, last_name, 
            email, password, send_sms_flag
        )

    def handle_interactive(self):
        """Interactive mode for creating employee accounts"""
        self.stdout.write(
            self.style.SUCCESS('=== Interactive Employee Account Creation ===')
        )
        
        try:
            username = input('Username: ').strip()
            first_name = input('First Name: ').strip()
            last_name = input('Last Name: ').strip()
            phone = input('Phone Number: ').strip()
            email = input('Email (optional): ').strip() or None
            
            use_generated_password = input('Generate random password? (y/n): ').lower() == 'y'
            if use_generated_password:
                password = None
            else:
                password = getpass.getpass('Password: ')
            
            send_sms_flag = input('Send login credentials via SMS? (y/n): ').lower() == 'y'
            
            # Confirmation
            self.stdout.write('\n=== Confirmation ===')
            self.stdout.write(f'Username: {username}')
            self.stdout.write(f'Name: {first_name} {last_name}')
            self.stdout.write(f'Phone: {phone}')
            self.stdout.write(f'Email: {email or "Will be generated"}')
            self.stdout.write(f'Password: {"Will be generated" if not password else "Provided"}')
            self.stdout.write(f'Send SMS: {"Yes" if send_sms_flag else "No"}')
            
            confirm = input('\nCreate account? (y/n): ').lower()
            if confirm != 'y':
                self.stdout.write(self.style.WARNING('Account creation cancelled'))
                return
            
            self.create_employee_account(
                username, phone, first_name, last_name, 
                email, password, send_sms_flag
            )
            
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nAccount creation cancelled'))
        except Exception as e:
            raise CommandError(f'Error in interactive mode: {str(e)}')

    def create_employee_account(self, username, phone, first_name, last_name, email=None, password=None, send_sms_flag=False):
        """Create the employee account with given parameters"""
        
        # Validate inputs
        if User.objects.filter(username=username).exists():
            raise CommandError(f'Username "{username}" already exists')
        
        if email and User.objects.filter(email=email).exists():
            raise CommandError(f'Email "{email}" already exists')
        
        # Generate password if not provided
        if not password:
            password = get_random_string(12)
            password_generated = True
        else:
            password_generated = False
        
        # Generate email if not provided
        if not email:
            safe_phone = normalize_phone_number(phone).replace('+', '').replace(' ', '').replace('-', '')
            email = f"{username}-{safe_phone[:6]}@company.local"
            email_generated = True
        else:
            email_generated = False

        try:
            # Create user account
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_worker=True
            )

            # Update or create profile with phone number
            normalized_phone = normalize_phone_number(phone)
            if hasattr(user, 'profile'):
                user.profile.phone = normalized_phone
                user.profile.save()
            else:
                Profile.objects.create(user=user, phone=normalized_phone)

            # Display success information
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Employee account created successfully!')
            )
            self.stdout.write(f'ID: {user.id}')
            self.stdout.write(f'Username: {username}')
            self.stdout.write(f'Full Name: {user.get_full_name()}')
            self.stdout.write(f'Email: {email} {"(generated)" if email_generated else ""}')
            self.stdout.write(f'Phone: {normalized_phone}')
            self.stdout.write(f'Password: {password} {"(generated)" if password_generated else ""}')

            # Send SMS if requested
            sms_success = False
            if send_sms_flag:
                sms_message = (
                    f"Welcome to the team, {user.get_full_name()}! 🎉\n\n"
                    f"Your account has been created:\n"
                    f"👤 Username: {username}\n"
                    f"📧 Email: {email}\n"
                    f"🔒 Password: {password}\n\n"
                    f"Please log in and change your password.\n"
                    f"Welcome aboard! 🚀"
                )
                
                try:
                    sms_success = send_sms(normalized_phone, sms_message)
                    if sms_success:
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Login credentials sent via SMS to {normalized_phone}')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'✗ Failed to send SMS to {normalized_phone}')
                        )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ SMS sending error: {str(e)}')
                    )

            # Display instructions
            self.stdout.write('\n=== Next Steps ===')
            if not sms_success and send_sms_flag:
                self.stdout.write(
                    self.style.WARNING('SMS failed. Please share login credentials securely with the employee.')
                )
            elif not send_sms_flag:
                self.stdout.write('Please share the above login credentials securely with the employee.')
            
            self.stdout.write('Employee should change their password on first login.')
            
        except Exception as e:
            raise CommandError(f'Error creating employee account: {str(e)}')


# Usage examples:
# python manage.py create_employee johndoe "+233241234567" --first-name="John" --last-name="Doe" --send-sms
# python manage.py create_employee --interactive