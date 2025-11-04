# Stock Movements Data Fix

## Summary
Fixed stock movements to return all data on the frontend by enhancing the backend serializer and frontend handling.

## Changes Made

### Backend Changes

#### 1. Enhanced StockMovementSerializer (`core/services/serializers.py`)
Added the following fields to match frontend expectations:
- `quantity_changed`: Maps to the `quantity` field
- `balance_after`: Calculates from the material's current_stock
- `reference`: Human-readable reference (e.g., "Procurement #123", "Material Pickup #5")
- `notes`: Alias for the `note` field

The serializer now provides:
```python
fields = [
    'id', 'material', 'material_name', 'movement_type', 'quantity', 'quantity_changed',
    'balance_after', 'reference_type', 'reference_id', 'reference', 'note', 'notes', 'created_at'
]
```

#### 2. Enhanced StockMovementViewSet (`core/services/views.py`)
- **Disabled pagination**: Set `pagination_class = None` to return all records
- **Added search filter**: Filter by material name using `search` parameter
- **Added date filtering**: Support for `date_from` and `date_to` parameters
- **Fixed movement type mapping**: Maps frontend types ('in'/'out') to backend types ('inflow'/'outflow')

### Frontend Changes

#### Updated StockMovements.jsx (`frontend/src/pages/StockMovements.jsx`)
- **Added movement type mapping**: Handle both frontend ('in'/'out') and backend ('inflow'/'outflow') types
- **Added `getMovementLabel` function**: Consistent labeling for movement types
- **Enhanced data fallbacks**: Check for both `quantity_changed` and `quantity` fields
- **Fixed reference display**: Check for `reference`, `note`, or `notes` fields

## Testing

Verified that stock movements now return:
✅ All movement records (no pagination limit)
✅ Material names
✅ Correct movement types (inflow/outflow)
✅ Quantity changed values
✅ Balance after each movement
✅ Human-readable references
✅ Notes/descriptions
✅ Creation timestamps

## API Response Example

```json
{
  "id": 7,
  "material": 6,
  "material_name": "Laminating Film",
  "movement_type": "outflow",
  "quantity": "1.0000",
  "quantity_changed": "1.0000",
  "balance_after": 44.0,
  "reference_type": "material_usage",
  "reference_id": 6,
  "reference": "Material Pickup #6",
  "note": "Material pickup by admin: Material picked for work",
  "notes": "Material pickup by admin: Material picked for work",
  "created_at": "2025-11-03T12:10:58.687077Z"
}
```

## How to Use

### Filter by Search
```javascript
GET /api/services/stock-movements/?search=Paper
```

### Filter by Movement Type
```javascript
GET /api/services/stock-movements/?movement_type=in  // or 'out'
```

### Filter by Date Range
```javascript
GET /api/services/stock-movements/?date_from=2025-11-01&date_to=2025-11-03
```

### Combined Filters
```javascript
GET /api/services/stock-movements/?search=Paper&movement_type=in&date_from=2025-11-01
```

## Files Modified

1. `core/services/serializers.py` - Enhanced StockMovementSerializer
2. `core/services/views.py` - Enhanced StockMovementViewSet
3. `frontend/src/pages/StockMovements.jsx` - Updated frontend handling

## Notes

- All stock movements are now returned without pagination to ensure complete data visibility
- The `balance_after` field shows the current stock level (snapshot at query time, not historical)
- Movement types are properly mapped between frontend and backend terminology
- Date filtering uses the `created_at` field from the stock movement record
