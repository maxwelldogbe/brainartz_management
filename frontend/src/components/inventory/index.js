// Inventory Components Export Index
// Complete inventory management component library

// Main Components
export { default as InventoryDashboard } from './InventoryDashboard';
export { default as MaterialList } from './MaterialList';
export { default as MaterialCard } from './MaterialCard';
export { default as MaterialForm } from './MaterialForm';
export { default as StockAdjustmentModal } from './StockAdjustmentModal';
export { default as ProcurementList } from './ProcurementList';
export { default as ProcurementCard } from './ProcurementCard';

// Widgets
export { default as LowStockAlertWidget } from './LowStockAlertWidget';
export { default as PendingProcurementsWidget } from './PendingProcurementsWidget';

// Forms (To be created)
// export { default as ProcurementForm } from './ProcurementForm';
// export { default as DeliveryModal } from './DeliveryModal';
// export { default as MaterialUsageForm } from './MaterialUsageForm';
// export { default as WorkOrderMaterials } from './WorkOrderMaterials';

// Services and Hooks
export { default as inventoryService } from '../../services/inventory/inventoryService';
export { useInventory } from '../../hooks/inventory/useInventory';

// Validation utilities
export * from '../../utils/inventoryValidation';