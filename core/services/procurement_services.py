"""
Business logic services for procurement and inventory management.
Handles transactional operations and WebSocket notifications.
"""

from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal
# from channels.layers import get_channel_layer  # Temporarily commented out
# from asgiref.sync import async_to_sync  # Temporarily commented out

from .models import Material, Procurement, JobMaterial, StockMovement, MaterialUsage


class ProcurementService:
    """Service class for managing procurement operations"""
    
    @staticmethod
    def mark_procurement_delivered(procurement_id, delivery_date=None, user=None):
        """
        Mark a procurement as delivered and update material stock.
        
        Args:
            procurement_id: ID of the procurement to mark as delivered
            delivery_date: Optional delivery date (defaults to now)
            user: User marking the procurement as delivered
            
        Returns:
            dict: Updated procurement data and stock info
            
        Raises:
            ValueError: If procurement is not in valid state for delivery
        """
        with transaction.atomic():
            try:
                # Lock the procurement record for update
                procurement = Procurement.objects.select_for_update().get(
                    id=procurement_id, status='pending'
                )
                
                # Lock the material record for update to prevent race conditions
                material = Material.objects.select_for_update().get(id=procurement.material.id)
                
                # Update material stock using atomic F expression
                material.current_stock = models.F('current_stock') + procurement.quantity_ordered
                material.save(update_fields=['current_stock'])
                
                # Refresh to get the actual current_stock value
                material.refresh_from_db()
                
                # Create stock movement record
                StockMovement.objects.create(
                    material=material,
                    movement_type='inflow',
                    quantity=procurement.quantity_ordered,
                    reference_type='procurement',
                    reference_id=procurement.id,
                    note=f"Procurement delivery - Procurement #{procurement.id}"
                )
                
                # Update procurement status
                procurement.status = 'delivered'
                procurement.delivery_date = delivery_date or timezone.now()
                procurement.save(update_fields=['status', 'delivery_date'])
                
                # Prepare response data
                result = {
                    'procurement': {
                        'id': procurement.id,
                        'material_id': material.id,
                        'material_name': material.name,
                        'quantity_added': procurement.quantity_ordered,
                        'delivery_date': procurement.delivery_date,
                    },
                    'material': {
                        'id': material.id,
                        'name': material.name,
                        'current_stock': material.current_stock,
                        'reorder_level': material.reorder_level,
                        'is_low_stock': material.is_low_stock(),
                    }
                }
                
                # Schedule WebSocket notifications after commit
                transaction.on_commit(lambda: ProcurementService._emit_procurement_delivered(result))
                
                # Check for low stock alert after delivery
                if material.is_low_stock():
                    transaction.on_commit(lambda: ProcurementService._emit_low_stock_alert(material))
                
                return result
                
            except Procurement.DoesNotExist:
                raise ValueError("Procurement not found or not in pending status")
            except Exception as e:
                raise
    
    @staticmethod
    def record_job_material_usage(job_id, material_id, quantity_used, user=None):
        """
        Record material usage for a job and update stock.
        
        Args:
            job_id: ID of the work order/job
            material_id: ID of the material being used
            quantity_used: Quantity of material consumed
            user: User recording the usage
            
        Returns:
            dict: JobMaterial record and updated stock info
            
        Raises:
            ValueError: If insufficient stock or invalid parameters
        """
        from .models import Work  # Import here to avoid circular imports
        
        with transaction.atomic():
            try:
                # Validate inputs
                if quantity_used <= 0:
                    raise ValueError("Quantity used must be positive")
                
                # Lock records for update
                job = Work.objects.select_for_update().get(id=job_id)
                material = Material.objects.select_for_update().get(
                    id=material_id, archived=False
                )
                
                # Check stock availability
                if material.current_stock < quantity_used:
                    raise ValueError(
                        f"Insufficient stock. Available: {material.current_stock}, "
                        f"Required: {quantity_used}"
                    )
                
                # Update material stock
                material.current_stock = models.F('current_stock') - quantity_used
                material.save(update_fields=['current_stock'])
                
                # Refresh to get actual current_stock value
                material.refresh_from_db()
                
                # Create job material record
                job_material = JobMaterial.objects.create(
                    job=job,
                    material=material,
                    quantity_used=quantity_used,
                    created_by=user
                )
                
                # Create stock movement record
                StockMovement.objects.create(
                    material=material,
                    movement_type='outflow',
                    quantity=quantity_used,
                    reference_type='job',
                    reference_id=job.id,
                    note=f"Material usage for job: {job.title}"
                )
                
                # Prepare response data
                result = {
                    'job_material': {
                        'id': job_material.id,
                        'job_id': job.id,
                        'job_title': job.title,
                        'material_id': material.id,
                        'material_name': material.name,
                        'quantity_used': quantity_used,
                        'created_at': job_material.created_at,
                    },
                    'material': {
                        'id': material.id,
                        'name': material.name,
                        'current_stock': material.current_stock,
                        'reorder_level': material.reorder_level,
                        'is_low_stock': material.is_low_stock(),
                    }
                }
                
                # Schedule WebSocket notifications after commit
                transaction.on_commit(lambda: ProcurementService._emit_stock_updated(material))
                
                # Check for low stock alert
                if material.is_low_stock():
                    transaction.on_commit(lambda: ProcurementService._emit_low_stock_alert(material))
                
                return result
                
            except Work.DoesNotExist:
                raise ValueError("Work order/job not found")
            except Material.DoesNotExist:
                raise ValueError("Material not found or archived")
            except Exception as e:
                raise
    
    @staticmethod
    def adjust_material_stock(material_id, adjustment_quantity, note="", user=None):
        """
        Manually adjust material stock (Manager only operation).
        
        Args:
            material_id: ID of the material
            adjustment_quantity: Positive for increase, negative for decrease
            note: Reason for adjustment
            user: User making the adjustment
            
        Returns:
            dict: Updated material stock info
        """
        with transaction.atomic():
            try:
                material = Material.objects.select_for_update().get(
                    id=material_id, archived=False
                )
                
                # Get current stock value before F() expression
                current_stock_value = material.current_stock
                
                # Prevent negative stock from manual adjustments
                new_stock = current_stock_value + adjustment_quantity
                if new_stock < 0:
                    raise ValueError(
                        f"Adjustment would result in negative stock. "
                        f"Current: {current_stock_value}, Adjustment: {adjustment_quantity}"
                    )
                
                # Update stock using F() expression for atomic update
                material.current_stock = models.F('current_stock') + adjustment_quantity
                material.save(update_fields=['current_stock'])
                material.refresh_from_db()
                
                # Create stock movement record
                movement_type = 'inflow' if adjustment_quantity > 0 else 'outflow'
                StockMovement.objects.create(
                    material=material,
                    movement_type=movement_type,
                    quantity=abs(adjustment_quantity),
                    reference_type='adjustment',
                    reference_id=0,  # No specific reference for manual adjustments
                    note=note or f"Manual adjustment by {user.username if user else 'system'}"
                )
                
                result = {
                    'material': {
                        'id': material.id,
                        'name': material.name,
                        'current_stock': material.current_stock,
                        'reorder_level': material.reorder_level,
                        'is_low_stock': material.is_low_stock(),
                    },
                    'adjustment': {
                        'quantity': adjustment_quantity,
                        'note': note,
                    }
                }
                
                # Schedule WebSocket notifications
                transaction.on_commit(lambda: ProcurementService._emit_stock_updated(material))
                
                if material.is_low_stock():
                    transaction.on_commit(lambda: ProcurementService._emit_low_stock_alert(material))
                
                return result
                
            except Material.DoesNotExist:
                raise ValueError("Material not found or archived")
            except Exception as e:
                raise
    
    # WebSocket notification methods (temporarily disabled)
    @staticmethod
    def _emit_procurement_delivered(data):
        """Emit procurement delivered event via WebSocket"""
        # TODO: Re-enable when channels is installed
        pass
        # try:
        #     channel_layer = get_channel_layer()
        #     if channel_layer:
        #         async_to_sync(channel_layer.group_send)(
        #             "inventory_updates",  # Organization-wide group
        #             {
        #                 "type": "inventory_message",
        #                 "event": "procurement_delivered",
        #                 "data": data
        #             }
        #         )
        # except Exception as e:
        #     logger.error(f"Error emitting procurement_delivered event: {e}")
    
    @staticmethod
    def _emit_stock_updated(material):
        """Emit stock updated event via WebSocket"""
        # TODO: Re-enable when channels is installed
        pass
        # try:
        #     channel_layer = get_channel_layer()
        #     if channel_layer:
        #         async_to_sync(channel_layer.group_send)(
        #             "inventory_updates",
        #             {
        #                 "type": "inventory_message",
        #                 "event": "stock_updated",
        #                 "data": {
        #                     "material_id": material.id,
        #                     "name": material.name,
        #                     "current_stock": str(material.current_stock),
        #                 }
        #             }
        #         )
        # except Exception as e:
        #     logger.error(f"Error emitting stock_updated event: {e}")
    
    @staticmethod
    def _emit_low_stock_alert(material):
        """Emit low stock alert via WebSocket"""
        # TODO: Re-enable when channels is installed
        pass
        # try:
        #     channel_layer = get_channel_layer()
        #     if channel_layer:
        #         async_to_sync(channel_layer.group_send)(
        #             "inventory_updates",
        #             {
        #                 "type": "inventory_message",
        #                 "event": "low_stock_alert",
        #                 "data": {
        #                     "material_id": material.id,
        #                     "name": material.name,
        #                     "current_stock": str(material.current_stock),
        #                     "reorder_level": str(material.reorder_level),
        #                     "suggested_reorder_quantity": str(material.get_suggested_reorder_quantity()),
        #                 }
        #             }
        #         )
        # except Exception as e:
        #     logger.error(f"Error emitting low_stock_alert event: {e}")
    
    @staticmethod
    def record_material_usage(material_id, quantity_taken, taken_by, note=""):
        """
        Record when an employee picks/takes materials from inventory.
        This creates an audit trail and reduces stock levels.
        
        Args:
            material_id: ID of the material being taken
            quantity_taken: Amount being taken from inventory
            taken_by: User taking the materials
            note: Optional note about the usage
            
        Returns:
            dict: Material usage record info
            
        Raises:
            ValueError: If insufficient stock or invalid parameters
        """
        with transaction.atomic():
            try:
                material = Material.objects.select_for_update().get(
                    id=material_id, archived=False
                )
                
                # Validate quantity
                if quantity_taken <= 0:
                    raise ValueError("Quantity taken must be greater than zero")
                
                # Check if there's enough stock
                if material.current_stock < quantity_taken:
                    raise ValueError(
                        f"Insufficient stock. Available: {material.current_stock} {material.unit}, "
                        f"Requested: {quantity_taken} {material.unit}"
                    )
                
                # Record stock levels before change
                stock_before = material.current_stock
                
                # Update material stock
                material.current_stock = models.F('current_stock') - quantity_taken
                material.save(update_fields=['current_stock'])
                material.refresh_from_db()
                
                # Create material usage record
                usage = MaterialUsage.objects.create(
                    material=material,
                    quantity_taken=quantity_taken,
                    taken_by=taken_by,
                    note=note or f"Materials picked by {taken_by.get_full_name() or taken_by.username}",
                    stock_before=stock_before,
                    stock_after=material.current_stock
                )
                
                # Create stock movement record for audit trail
                StockMovement.objects.create(
                    material=material,
                    movement_type='outflow',
                    quantity=quantity_taken,
                    reference_type='material_usage',
                    reference_id=usage.id,
                    note=f"Material pickup by {taken_by.get_full_name() or taken_by.username}: {note}" if note else f"Material pickup by {taken_by.get_full_name() or taken_by.username}"
                )
                
                result = {
                    'usage': {
                        'id': usage.id,
                        'material_name': material.name,
                        'quantity_taken': float(quantity_taken),
                        'taken_by': taken_by.get_full_name() or taken_by.username,
                        'taken_at': usage.taken_at,
                        'note': usage.note
                    },
                    'material': {
                        'id': material.id,
                        'name': material.name,
                        'current_stock': float(material.current_stock),
                        'is_low_stock': material.is_low_stock(),
                        'unit': material.unit
                    },
                    'stock_change': {
                        'before': float(stock_before),
                        'after': float(material.current_stock),
                        'change': float(-quantity_taken)
                    }
                }
                
                # Send WebSocket notification (when available)
                # ProcurementService._emit_stock_updated(material)
                # if material.is_low_stock():
                #     ProcurementService._emit_low_stock_alert(material)
                
                return result
                
            except Material.DoesNotExist:
                raise ValueError(f"Material with ID {material_id} not found or archived")
            except Exception as e:
                raise