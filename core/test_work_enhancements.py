#!/usr/bin/env python
"""
Test script for Work Enhancement Features

This script demonstrates the new work features including:
- Work titles and job categories
- File upload functionality
- Enhanced work management
"""

import os
import sys
import django
from io import BytesIO

# Add the Django project path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.models import Customer, Work, JobCategory, WorkFile
from authentication.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone


def test_job_categories():
    """Test job category creation and management"""
    print("=== Testing Job Categories ===")
    
    # Create test categories
    test_categories = [
        {
            'name': 'Test Web Development',
            'description': 'Website and web app development',
            'color': '#3B82F6'
        },
        {
            'name': 'Test Graphic Design', 
            'description': 'Visual design and branding',
            'color': '#F59E0B'
        },
        {
            'name': 'Test Consulting',
            'description': 'Business consulting services',
            'color': '#EF4444'
        }
    ]
    
    created_categories = []
    
    for cat_data in test_categories:
        try:
            # Check if category already exists
            category, created = JobCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            
            if created:
                print(f"✓ Created category: {category.name}")
            else:
                print(f"→ Category already exists: {category.name}")
            
            created_categories.append(category)
            
        except Exception as e:
            print(f"✗ Error creating category {cat_data['name']}: {e}")
    
    print(f"✓ Total categories available: {len(created_categories)}")
    return created_categories


def test_enhanced_work_creation():
    """Test creating works with titles and categories"""
    print(f"\n=== Testing Enhanced Work Creation ===")
    
    # Get or create a test customer
    customer, created = Customer.objects.get_or_create(
        name='Test Customer for Enhanced Work',
        defaults={
            'email': 'testcustomer@example.com',
            'phone': '+233241234567'
        }
    )
    
    if created:
        print(f"✓ Created test customer: {customer.name}")
    else:
        print(f"→ Using existing customer: {customer.name}")
    
    # Get or create a test worker
    worker, created = User.objects.get_or_create(
        username='testworker',
        defaults={
            'email': 'testworker@company.com',
            'is_worker': True,
            'first_name': 'Test',
            'last_name': 'Worker'
        }
    )
    
    if created:
        print(f"✓ Created test worker: {worker.get_full_name()}")
    else:
        print(f"→ Using existing worker: {worker.get_full_name()}")
    
    # Get available categories
    categories = JobCategory.objects.filter(is_active=True)[:3]
    
    # Test work data
    test_works = [
        {
            'title': 'Build E-commerce Website',
            'description': 'Create a full-featured e-commerce website with payment integration',
            'price': 2500.00,
            'category': categories[0] if categories else None
        },
        {
            'title': 'Design Company Logo',
            'description': 'Create a modern logo for the company brand',
            'price': 500.00,
            'category': categories[1] if len(categories) > 1 else None
        },
        {
            'title': 'Business Strategy Consultation',
            'description': 'Provide strategic planning and market analysis',
            'price': 1500.00,
            'category': categories[2] if len(categories) > 2 else None
        }
    ]
    
    created_works = []
    
    for work_data in test_works:
        try:
            work = Work.objects.create(
                customer=customer,
                worker=worker,
                **work_data
            )
            
            print(f"✓ Created work: {work.title}")
            print(f"   Customer: {work.customer.name}")
            print(f"   Category: {work.category.name if work.category else 'No category'}")
            print(f"   Price: ${work.price}")
            print(f"   Status: {work.completed}")
            
            created_works.append(work)
            
        except Exception as e:
            print(f"✗ Error creating work {work_data['title']}: {e}")
    
    return created_works


def test_file_upload_functionality(works):
    """Test file upload functionality for works"""
    print(f"\n=== Testing File Upload Functionality ===")
    
    if not works:
        print("✗ No works available for file upload testing")
        return []
    
    work = works[0]  # Use first work for testing
    print(f"Testing file uploads for work: {work.title}")
    
    # Create test files in memory
    test_files = [
        {
            'name': 'project_requirements.txt',
            'content': b'Project Requirements:\n1. User authentication\n2. Payment integration\n3. Mobile responsive design',
            'content_type': 'text/plain'
        },
        {
            'name': 'design_mockup.pdf',
            'content': b'%PDF-1.4\n%Mock PDF content for testing',
            'content_type': 'application/pdf'
        },
        {
            'name': 'client_feedback.docx',
            'content': b'PK\x03\x04Mock DOCX content for testing',
            'content_type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
    ]
    
    uploaded_files = []
    
    for file_data in test_files:
        try:
            # Create Django uploaded file
            uploaded_file = SimpleUploadedFile(
                file_data['name'],
                file_data['content'],
                content_type=file_data['content_type']
            )
            
            # Create WorkFile instance
            work_file = WorkFile.objects.create(
                work=work,
                file=uploaded_file,
                description=f"Test file: {file_data['name']}",
                uploaded_by=work.worker
            )
            
            print(f"✓ Uploaded file: {work_file.original_name}")
            print(f"   File type: {work_file.file_type}")
            print(f"   File size: {work_file.get_file_size_display()}")
            print(f"   Description: {work_file.description}")
            
            uploaded_files.append(work_file)
            
        except Exception as e:
            print(f"✗ Error uploading file {file_data['name']}: {e}")
    
    return uploaded_files


def test_work_status_management(works):
    """Test work completion and status management"""
    print(f"\n=== Testing Work Status Management ===")
    
    if not works:
        print("✗ No works available for status testing")
        return
    
    work = works[0]
    
    print(f"Testing status management for work: {work.title}")
    print(f"Initial status - Completed: {work.completed}")
    
    # Mark work as completed
    work.completed = True
    work.save()  # This should auto-set completed_at
    
    # Refresh from database
    work.refresh_from_db()
    
    print(f"✓ Work marked as completed")
    print(f"   Completed: {work.completed}")
    print(f"   Completed at: {work.completed_at}")
    
    # Test uncompleting work
    work.completed = False
    work.save()  # This should clear completed_at
    
    work.refresh_from_db()
    
    print(f"✓ Work marked as incomplete")
    print(f"   Completed: {work.completed}")
    print(f"   Completed at: {work.completed_at}")


def test_work_queries_and_filters():
    """Test various work queries and filtering"""
    print(f"\n=== Testing Work Queries and Filters ===")
    
    # Test basic queries
    total_works = Work.objects.count()
    completed_works = Work.objects.filter(completed=True).count()
    pending_works = Work.objects.filter(completed=False).count()
    
    print(f"Total works: {total_works}")
    print(f"Completed works: {completed_works}")
    print(f"Pending works: {pending_works}")
    
    # Test category-based queries
    for category in JobCategory.objects.filter(is_active=True):
        works_count = category.works.count()
        print(f"Works in '{category.name}': {works_count}")
    
    # Test file-related queries
    works_with_files = Work.objects.filter(files__isnull=False).distinct().count()
    total_files = WorkFile.objects.count()
    
    print(f"Works with files: {works_with_files}")
    print(f"Total files: {total_files}")


def test_category_management():
    """Test job category management features"""
    print(f"\n=== Testing Category Management ===")
    
    # Test category activation/deactivation
    category = JobCategory.objects.first()
    if category:
        print(f"Testing category: {category.name}")
        print(f"Initial active status: {category.is_active}")
        
        # Deactivate
        category.is_active = False
        category.save()
        print(f"✓ Category deactivated")
        
        # Reactivate
        category.is_active = True
        category.save()
        print(f"✓ Category reactivated")
    
    # Test category with works count
    categories_with_counts = []
    for category in JobCategory.objects.all():
        works_count = category.works.count()
        categories_with_counts.append((category.name, works_count))
        print(f"Category '{category.name}': {works_count} works")


def cleanup_test_data():
    """Clean up test data created during testing"""
    print(f"\n=== Cleaning Up Test Data ===")
    
    try:
        # Delete test files (this will also delete the actual files)
        test_files = WorkFile.objects.filter(work__customer__name='Test Customer for Enhanced Work')
        files_count = test_files.count()
        test_files.delete()
        print(f"✓ Deleted {files_count} test files")
        
        # Delete test works
        test_works = Work.objects.filter(customer__name='Test Customer for Enhanced Work')
        works_count = test_works.count()
        test_works.delete()
        print(f"✓ Deleted {works_count} test works")
        
        # Delete test customer
        test_customers = Customer.objects.filter(name='Test Customer for Enhanced Work')
        customers_count = test_customers.count()
        test_customers.delete()
        print(f"✓ Deleted {customers_count} test customers")
        
        # Delete test categories (optional - comment out if you want to keep them)
        test_categories = JobCategory.objects.filter(name__startswith='Test ')
        categories_count = test_categories.count()
        test_categories.delete()
        print(f"✓ Deleted {categories_count} test categories")
        
        # Delete test worker
        test_workers = User.objects.filter(username='testworker')
        workers_count = test_workers.count()
        test_workers.delete()
        print(f"✓ Deleted {workers_count} test workers")
        
    except Exception as e:
        print(f"✗ Error during cleanup: {e}")


def main():
    """Run all tests"""
    print("Work Enhancement Features Test")
    print("=" * 50)
    
    # Test 1: Job Categories
    categories = test_job_categories()
    
    # Test 2: Enhanced Work Creation
    works = test_enhanced_work_creation()
    
    # Test 3: File Upload Functionality
    uploaded_files = test_file_upload_functionality(works)
    
    # Test 4: Work Status Management
    test_work_status_management(works)
    
    # Test 5: Queries and Filters
    test_work_queries_and_filters()
    
    # Test 6: Category Management
    test_category_management()
    
    # Summary
    print(f"\n" + "=" * 50)
    print("🎉 Work Enhancement Tests Completed!")
    
    print(f"\n💡 New Features Tested:")
    print(f"   ✓ Job categories for work organization")
    print(f"   ✓ Work titles for better identification")
    print(f"   ✓ File upload and attachment system")
    print(f"   ✓ Enhanced work status management")
    print(f"   ✓ Advanced querying and filtering")
    print(f"   ✓ Category management features")
    
    # Cleanup (optional)
    cleanup_confirmation = input(f"\n🗑️  Clean up test data? (y/n): ").lower()
    if cleanup_confirmation == 'y':
        cleanup_test_data()
    else:
        print("Test data retained for manual inspection")


if __name__ == "__main__":
    main()