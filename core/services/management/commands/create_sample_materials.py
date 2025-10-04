"""
Management command to create sample materials and procurements for testing
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal

from services.models import Material, Procurement

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates sample materials and procurements for testing the inventory system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing materials and procurements before creating samples',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing materials and procurements...')
            Material.objects.all().delete()
            Procurement.objects.all().delete()

        # Create sample materials
        materials_data = [
            {
                'name': 'A4 Premium Paper',
                'category': 'paper',
                'unit': 'reams',
                'current_stock': Decimal('75.0'),
                'reorder_level': Decimal('25.0'),
            },
            {
                'name': 'A3 Paper',
                'category': 'paper',
                'unit': 'reams',
                'current_stock': Decimal('15.0'),  # Low stock
                'reorder_level': Decimal('20.0'),
            },
            {
                'name': 'Black Ink Cartridge',
                'category': 'ink',
                'unit': 'pieces',
                'current_stock': Decimal('8.0'),
                'reorder_level': Decimal('5.0'),
            },
            {
                'name': 'Color Ink Cartridge',
                'category': 'ink',
                'unit': 'pieces',
                'current_stock': Decimal('3.0'),  # Low stock
                'reorder_level': Decimal('5.0'),
            },
            {
                'name': 'Spiral Binding Coils',
                'category': 'binding',
                'unit': 'pieces',
                'current_stock': Decimal('200.0'),
                'reorder_level': Decimal('50.0'),
            },
            {
                'name': 'Laminating Film',
                'category': 'other',
                'unit': 'meters',
                'current_stock': Decimal('45.0'),
                'reorder_level': Decimal('20.0'),
            },
        ]

        created_materials = []
        for material_data in materials_data:
            material, created = Material.objects.get_or_create(
                name=material_data['name'],
                defaults=material_data
            )
            created_materials.append(material)
            status = "Created" if created else "Already exists"
            low_stock = " (LOW STOCK)" if material.is_low_stock() else ""
            self.stdout.write(f'  {status}: {material.name}{low_stock}')

        # Create sample procurements (if manager user exists)
        try:
            manager = User.objects.filter(is_admin=True).first()  # Use is_admin instead of is_staff
            if manager:
                procurements_data = [
                    {
                        'material': created_materials[0],  # A4 Premium Paper
                        'supplier_name': 'Office Supplies Co.',
                        'supplier_email': 'orders@officesupplies.com',
                        'supplier_phone': '+1234567890',
                        'quantity_ordered': Decimal('100.0'),
                        'unit_cost': Decimal('2.50'),
                        'created_by': manager,
                    },
                    {
                        'material': created_materials[1],  # A3 Paper
                        'supplier_name': 'Paper World Ltd.',
                        'supplier_email': 'sales@paperworld.com',
                        'supplier_contact': 'John Smith, Sales Manager',
                        'quantity_ordered': Decimal('50.0'),
                        'unit_cost': Decimal('3.75'),
                        'created_by': manager,
                    },
                    {
                        'material': created_materials[2],  # Black Ink
                        'supplier_name': 'Ink Solutions Inc.',
                        'supplier_email': 'orders@inksolutions.com',
                        'quantity_ordered': Decimal('20.0'),
                        'unit_cost': Decimal('15.00'),
                        'created_by': manager,
                    },
                ]

                self.stdout.write('\nCreating sample procurements...')
                for procurement_data in procurements_data:
                    procurement = Procurement.objects.create(**procurement_data)
                    self.stdout.write(
                        f'  Created: Procurement #{procurement.id} - '
                        f'{procurement.material.name} from {procurement.supplier_name} '
                        f'(${procurement.total_cost})'
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        'No manager user found. Skipping procurement creation. '
                        'Create a superuser first to see sample procurements.'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating procurements: {e}')
            )

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('Sample data creation completed!'))
        
        total_materials = Material.objects.count()
        low_stock_count = sum(1 for m in Material.objects.all() if m.is_low_stock())
        total_procurements = Procurement.objects.count()
        
        self.stdout.write(f'Total Materials: {total_materials}')
        self.stdout.write(f'Low Stock Materials: {low_stock_count}')
        self.stdout.write(f'Total Procurements: {total_procurements}')
        
        if low_stock_count > 0:
            self.stdout.write('\nLow Stock Materials:')
            for material in Material.objects.all():
                if material.is_low_stock():
                    self.stdout.write(
                        f'  - {material.name}: {material.current_stock} {material.unit} '
                        f'(reorder at {material.reorder_level})'
                    )
        
        self.stdout.write('\nNext steps:')
        self.stdout.write('1. Access materials: GET /api/services/materials/')
        self.stdout.write('2. View low stock: GET /api/services/materials/?low_stock=true')
        self.stdout.write('3. Check procurements: GET /api/services/procurements/')
        self.stdout.write('4. Mark procurement delivered: POST /api/services/procurements/{id}/mark_delivered/')
        self.stdout.write('5. Admin interface: /admin/services/')