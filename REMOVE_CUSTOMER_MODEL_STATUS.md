# Customer Model Removal - In Progress

## What Has Been Done

### ✅ Completed Changes

1. **models.py** - Customer model removed
2. **models.py** - Work model updated with customer fields:
   - `customer_name` (CharField)
   - `customer_phone` (CharField)
3. **serializers.py** - Customer import removed
4. **serializers.py** - CustomerSerializer removed
5. **serializers.py** - CustomerSelectSerializer removed
6. **serializers.py** - WorkSerializer updated to use customer_name and customer_phone directly
7. **serializers.py** - WorkCreateSerializer simplified (no customer lookup needed)
8. **admin.py** - Customer import removed
9. **admin.py** - CustomerAdmin removed
10. **admin.py** - WorkAdmin updated to show customer_name and customer_phone
11. **frontend** - customer_email field removed from form

### ⚠️ Remaining Changes Needed

The following files still reference Customer and need to be updated:

#### 1. services/views.py
- Remove Customer from imports (line 13)
- Remove CustomerSerializer from imports (line 18)
- Remove CustomerSelectSerializer from imports (line 20)
- Remove or comment out CustomerViewSet (lines 38-56)
- Update statistics views that count Customer objects (lines 395, 468)

#### 2. services/urls.py
- Remove customer routes from router

#### 3. Frontend files
- Remove/update Customer page component
- Remove fetchCustomers API calls where not needed
- Update any components displaying customer lists

## Migration Command

Once all Customer references are removed from views and urls, run:

```bash
cd core
source brain/bin/activate
python manage.py makemigrations services -n remove_customer_model_add_fields_to_work
python manage.py migrate services
```

## Database Changes

The migration will:
1. Add `customer_name` field to Work model
2. Add `customer_phone` field to Work model
3. Remove Customer model/table
4. Remove foreign key relationship from Work to Customer

## Summary

Customer information now lives directly on the Work model:
- Work.customer_name - stores customer's name
- Work.customer_phone - stores customer's phone for SMS notifications

No separate Customer model needed!
