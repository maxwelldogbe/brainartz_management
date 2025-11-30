from django.core.management.base import BaseCommand, CommandError
from services.models import JobCategory
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default job categories for work organization'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interactive',
            action='store_true',
            help='Interactive mode for creating categories'
        )

    def handle(self, *args, **options):
        if options['interactive']:
            return self.handle_interactive()
        
        # Create default categories
        self.create_default_categories()

    def handle_interactive(self):
        """Interactive mode for creating job categories"""
        self.stdout.write(
            self.style.SUCCESS('=== Interactive Job Category Creation ===')
        )
        
        try:
            while True:
                name = input('\nCategory Name (or "quit" to stop): ').strip()
                if name.lower() == 'quit':
                    break
                    
                if not name:
                    continue
                    
                # Check if category already exists
                if JobCategory.objects.filter(name=name).exists():
                    self.stdout.write(
                        self.style.WARNING(f'Category "{name}" already exists!')
                    )
                    continue
                
                description = input('Description (optional): ').strip()
                color = input('Color (hex, e.g., #FF5733) or press enter for default: ').strip()
                
                if not color:
                    color = '#3B82F6'  # Default blue
                elif not color.startswith('#'):
                    color = f'#{color}'
                
                # Create category
                category = JobCategory.objects.create(
                    name=name,
                    description=description or None,
                    color=color
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'[+] Created category: {category.name}')
                )
                
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nCategory creation cancelled'))

    def create_default_categories(self):
        """Create a set of default job categories"""
        
        default_categories = [
            {
                'name': 'Web Development',
                'description': 'Website creation, maintenance, and updates',
                'color': '#3B82F6'  # Blue
            },
            {
                'name': 'Graphic Design',
                'description': 'Logo design, branding, and visual materials',
                'color': '#F59E0B'  # Orange
            },
            {
                'name': 'Digital Marketing',
                'description': 'SEO, social media, and online advertising',
                'color': '#10B981'  # Green
            },
            {
                'name': 'Content Writing',
                'description': 'Articles, blog posts, and copywriting',
                'color': '#8B5CF6'  # Purple
            },
            {
                'name': 'Consulting',
                'description': 'Business consulting and advisory services',
                'color': '#EF4444'  # Red
            },
            {
                'name': 'Mobile App Development',
                'description': 'iOS and Android app development',
                'color': '#06B6D4'  # Cyan
            },
            {
                'name': 'Data Analysis',
                'description': 'Data processing, analysis, and reporting',
                'color': '#84CC16'  # Lime
            },
            {
                'name': 'Training & Education',
                'description': 'Workshops, courses, and training programs',
                'color': '#F97316'  # Amber
            },
            {
                'name': 'Technical Support',
                'description': 'IT support and troubleshooting',
                'color': '#6366F1'  # Indigo
            },
            {
                'name': 'Other Services',
                'description': 'Miscellaneous services not fitting other categories',
                'color': '#6B7280'  # Gray
            }
        ]
        
        created_count = 0
        skipped_count = 0
        
        self.stdout.write('Creating default job categories...\n')
        
        for category_data in default_categories:
            name = category_data['name']
            
            if JobCategory.objects.filter(name=name).exists():
                self.stdout.write(
                    self.style.WARNING(f'[!] Category "{name}" already exists, skipping...')
                )
                skipped_count += 1
                continue
            
            try:
                category = JobCategory.objects.create(**category_data)
                self.stdout.write(
                    self.style.SUCCESS(f'[+] Created: {category.name}')
                )
                created_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'[X] Failed to create "{name}": {str(e)}')
                )
        
        self.stdout.write(f'\n[SUMMARY] Summary:')
        self.stdout.write(f'   Created: {created_count} categories')
        self.stdout.write(f'   Skipped: {skipped_count} categories')
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'\n[SUCCESS] Job categories setup complete!')
            )


# Usage examples:
# python manage.py create_job_categories
# python manage.py create_job_categories --interactive