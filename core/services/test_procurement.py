"""
Tests for procurement and inventory system
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from .models import Material, Procurement, JobMaterial, StockMovement, Work, Customer, JobCategory
from .procurement_services import ProcurementService

User = get_user_model()


class ProcurementTestCase(TestCase):
    """Test cases for procurement and inventory functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.manager = User.objects.create_user(
            email='manager@test.com',
            username='manager',
            password='testpass123',
            is_staff=True  # Manager (admin)
        )
        
        self.staff = User.objects.create_user(
            email='staff@test.com',
            username='staff',
            password='testpass123',
            is_staff=False  # Regular staff
        )
        
        # Create test material
        self.material = Material.objects.create(
            name='A4 Paper',
            category='paper',
            unit='reams',
            current_stock=Decimal('50.0'),
            reorder_level=Decimal('20.0')
        )
        
        # Create test customer and job category for work orders
        self.customer = Customer.objects.create(
            name='Test Customer',
            email='customer@test.com'
        )
        
        self.job_category = JobCategory.objects.create(
            name='Printing',
            description='Printing services'
        )
        
        # Create test work order
        self.work = Work.objects.create(
            customer=self.customer,
            title='Test Print Job',
            description='Test printing work',
            price=Decimal('100.00'),
            category=self.job_category,
            worker=self.staff
        )
        
        # API client
        self.client = APIClient()
    
    def test_material_creation(self):
        """Test creating a material"""
        material = Material.objects.create(
            name='Ink Cartridge',
            category='ink',
            unit='pieces',
            current_stock=Decimal('10.0'),
            reorder_level=Decimal('5.0')
        )
        
        self.assertEqual(material.name, 'Ink Cartridge')
        self.assertEqual(material.category, 'ink')
        self.assertFalse(material.is_low_stock())
    
    def test_low_stock_detection(self):
        """Test low stock detection"""
        # Create material with stock at reorder level
        low_stock_material = Material.objects.create(
            name='Low Stock Item',
            category='other',
            unit='pieces',
            current_stock=Decimal('5.0'),
            reorder_level=Decimal('10.0')
        )
        
        self.assertTrue(low_stock_material.is_low_stock())
        
        # Test with stock above reorder level
        self.assertFalse(self.material.is_low_stock())
    
    def test_procurement_creation(self):
        """Test creating a procurement record"""
        procurement = Procurement.objects.create(
            material=self.material,
            supplier_name='Test Supplier',
            supplier_email='supplier@test.com',
            quantity_ordered=Decimal('100.0'),
            unit_cost=Decimal('2.50'),
            created_by=self.manager
        )
        
        self.assertEqual(procurement.material, self.material)
        self.assertEqual(procurement.total_cost, Decimal('250.00'))
        self.assertEqual(procurement.status, 'pending')
    
    def test_procurement_delivery(self):
        """Test marking procurement as delivered"""
        # Create procurement
        procurement = Procurement.objects.create(
            material=self.material,
            supplier_name='Test Supplier',
            quantity_ordered=Decimal('30.0'),
            unit_cost=Decimal('2.00'),
            created_by=self.manager
        )
        
        initial_stock = self.material.current_stock
        
        # Mark as delivered
        result = ProcurementService.mark_procurement_delivered(
            procurement_id=procurement.id,
            user=self.manager
        )
        
        # Refresh from database
        procurement.refresh_from_db()
        self.material.refresh_from_db()
        
        # Check procurement status
        self.assertEqual(procurement.status, 'delivered')
        
        # Check stock increase
        self.assertEqual(
            self.material.current_stock, 
            initial_stock + procurement.quantity_ordered
        )
        
        # Check stock movement created
        movements = StockMovement.objects.filter(
            material=self.material,
            reference_type='procurement',
            reference_id=procurement.id
        )
        self.assertEqual(movements.count(), 1)
        self.assertEqual(movements.first().movement_type, 'inflow')
        self.assertEqual(movements.first().quantity, procurement.quantity_ordered)
    
    def test_job_material_usage(self):
        """Test recording material usage for a job"""
        initial_stock = self.material.current_stock
        usage_quantity = Decimal('5.0')
        
        # Record material usage
        result = ProcurementService.record_job_material_usage(
            job_id=self.work.id,
            material_id=self.material.id,
            quantity_used=usage_quantity,
            user=self.staff
        )
        
        # Refresh from database
        self.material.refresh_from_db()
        
        # Check stock decrease
        self.assertEqual(
            self.material.current_stock,
            initial_stock - usage_quantity
        )
        
        # Check JobMaterial record created
        job_materials = JobMaterial.objects.filter(
            job=self.work,
            material=self.material
        )
        self.assertEqual(job_materials.count(), 1)
        self.assertEqual(job_materials.first().quantity_used, usage_quantity)
        
        # Check stock movement created
        movements = StockMovement.objects.filter(
            material=self.material,
            reference_type='job',
            reference_id=self.work.id
        )
        self.assertEqual(movements.count(), 1)
        self.assertEqual(movements.first().movement_type, 'outflow')
        self.assertEqual(movements.first().quantity, usage_quantity)
    
    def test_insufficient_stock_prevention(self):
        """Test that insufficient stock prevents material usage"""
        # Try to use more material than available
        with self.assertRaises(ValueError) as context:
            ProcurementService.record_job_material_usage(
                job_id=self.work.id,
                material_id=self.material.id,
                quantity_used=Decimal('100.0'),  # More than current stock (50)
                user=self.staff
            )
        
        self.assertIn('Insufficient stock', str(context.exception))
    
    def test_stock_adjustment(self):
        """Test manual stock adjustment"""
        initial_stock = self.material.current_stock
        adjustment = Decimal('10.0')
        
        # Adjust stock upward
        result = ProcurementService.adjust_material_stock(
            material_id=self.material.id,
            adjustment_quantity=adjustment,
            note='Test adjustment',
            user=self.manager
        )
        
        # Refresh from database
        self.material.refresh_from_db()
        
        # Check stock change
        self.assertEqual(
            self.material.current_stock,
            initial_stock + adjustment
        )
        
        # Check stock movement created
        movements = StockMovement.objects.filter(
            material=self.material,
            reference_type='adjustment'
        )
        self.assertEqual(movements.count(), 1)
        self.assertEqual(movements.first().movement_type, 'inflow')
        self.assertEqual(movements.first().quantity, adjustment)
    
    def test_negative_stock_prevention(self):
        """Test that manual adjustments cannot create negative stock"""
        with self.assertRaises(ValueError) as context:
            ProcurementService.adjust_material_stock(
                material_id=self.material.id,
                adjustment_quantity=Decimal('-100.0'),  # Would make stock negative
                user=self.manager
            )
        
        self.assertIn('negative stock', str(context.exception))


class ProcurementAPITestCase(TestCase):
    """Test cases for procurement API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.manager = User.objects.create_user(
            email='manager@test.com',
            username='manager',
            password='testpass123',
            is_staff=True
        )
        
        self.staff = User.objects.create_user(
            email='staff@test.com',
            username='staff',
            password='testpass123',
            is_staff=False
        )
        
        # Create test material
        self.material = Material.objects.create(
            name='Test Material',
            category='paper',
            unit='reams',
            current_stock=Decimal('50.0'),
            reorder_level=Decimal('20.0')
        )
        
        # API client
        self.client = APIClient()
    
    def test_material_list_api(self):
        """Test material list endpoint"""
        self.client.force_authenticate(user=self.manager)
        
        response = self.client.get('/api/services/materials/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.material.name)
    
    def test_material_create_api(self):
        """Test material creation via API"""
        self.client.force_authenticate(user=self.manager)
        
        data = {
            'name': 'New Material',
            'category': 'ink',
            'unit': 'liters',
            'current_stock': '25.0',
            'reorder_level': '10.0'
        }
        
        response = self.client.post('/api/services/materials/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify material was created
        self.assertTrue(
            Material.objects.filter(name='New Material').exists()
        )
    
    def test_procurement_create_api(self):
        """Test procurement creation via API"""
        self.client.force_authenticate(user=self.manager)
        
        data = {
            'material': self.material.id,
            'supplier_name': 'Test Supplier',
            'supplier_email': 'supplier@test.com',
            'quantity_ordered': '100.0',
            'unit_cost': '2.50'
        }
        
        response = self.client.post('/api/services/procurements/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify procurement was created
        procurement = Procurement.objects.get(id=response.data['id'])
        self.assertEqual(procurement.supplier_name, 'Test Supplier')
        self.assertEqual(procurement.total_cost, Decimal('250.00'))
    
    def test_staff_permissions(self):
        """Test that staff cannot create procurements"""
        self.client.force_authenticate(user=self.staff)
        
        data = {
            'material': self.material.id,
            'supplier_name': 'Test Supplier',
            'quantity_ordered': '100.0',
            'unit_cost': '2.50'
        }
        
        response = self.client.post('/api/services/procurements/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access endpoints"""
        response = self.client.get('/api/services/materials/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


if __name__ == '__main__':
    import sys
    from django.test.utils import get_runner
    from django.conf import settings
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(['services.test_procurement'])
    if failures:
        sys.exit(failures)