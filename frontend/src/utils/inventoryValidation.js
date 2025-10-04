/**
 * Inventory Form Validation System
 * JavaScript validation rules and helper functions for inventory management
 */

// ============== VALIDATION RULES ==============

export const materialValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_()]+$/,
    message: 'Material name must be 2-100 characters, alphanumeric with spaces, hyphens, underscores, and parentheses only'
  },
  description: {
    required: false,
    maxLength: 500,
    message: 'Description must be less than 500 characters'
  },
  category: {
    required: true,
    message: 'Material category is required'
  },
  unit: {
    required: true,
    pattern: /^[a-zA-Z]+$/,
    message: 'Unit must contain only letters (e.g., kg, pcs, meters)'
  },
  unitCost: {
    required: true,
    type: 'number',
    min: 0.01,
    message: 'Unit cost must be a positive number greater than 0'
  },
  reorderLevel: {
    required: true,
    type: 'number',
    min: 1,
    integer: true,
    message: 'Reorder level must be a positive integer'
  },
  currentStock: {
    required: true,
    type: 'number',
    min: 0,
    integer: true,
    message: 'Current stock must be a non-negative integer'
  },
  supplier: {
    required: false,
    message: 'Supplier selection is optional'
  }
};

export const procurementValidation = {
  materials: {
    required: true,
    type: 'array',
    minLength: 1,
    message: 'At least one material must be selected'
  },
  supplier: {
    required: true,
    message: 'Supplier selection is required'
  },
  expectedDelivery: {
    required: true,
    type: 'date',
    futureDate: true,
    message: 'Expected delivery date must be in the future'
  },
  notes: {
    required: false,
    maxLength: 1000,
    message: 'Notes must be less than 1000 characters'
  },
  urgency: {
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    message: 'Please select urgency level'
  }
};

export const stockAdjustmentValidation = {
  adjustmentType: {
    required: true,
    enum: ['increase', 'decrease'],
    message: 'Adjustment type is required'
  },
  quantity: {
    required: true,
    type: 'number',
    min: 1,
    integer: true,
    message: 'Quantity must be a positive integer'
  },
  reason: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Reason must be 10-500 characters explaining the adjustment'
  },
  reference: {
    required: false,
    maxLength: 100,
    message: 'Reference must be less than 100 characters'
  }
};

export const materialUsageValidation = {
  materials: {
    required: true,
    type: 'array',
    minLength: 1,
    message: 'At least one material must be selected for usage'
  },
  jobId: {
    required: true,
    message: 'Job ID is required'
  },
  usageDate: {
    required: true,
    type: 'date',
    pastOrCurrentDate: true,
    message: 'Usage date cannot be in the future'
  },
  notes: {
    required: false,
    maxLength: 500,
    message: 'Notes must be less than 500 characters'
  }
};

export const supplierValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Supplier name must be 2-100 characters'
  },
  email: {
    required: true,
    type: 'email',
    message: 'Valid email address is required'
  },
  phone: {
    required: true,
    pattern: /^[\d\s\-+()]+$/,
    minLength: 10,
    message: 'Valid phone number is required'
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: 'Address must be 10-200 characters'
  },
  contactPerson: {
    required: false,
    maxLength: 100,
    message: 'Contact person name must be less than 100 characters'
  }
};

export const deliveryValidation = {
  receivedQuantity: {
    required: true,
    type: 'number',
    min: 1,
    integer: true,
    message: 'Received quantity must be a positive integer'
  },
  deliveryDate: {
    required: true,
    type: 'date',
    pastOrCurrentDate: true,
    message: 'Delivery date cannot be in the future'
  },
  condition: {
    required: true,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    message: 'Please select the condition of delivered materials'
  },
  notes: {
    required: false,
    maxLength: 500,
    message: 'Notes must be less than 500 characters'
  },
  invoiceNumber: {
    required: false,
    maxLength: 50,
    message: 'Invoice number must be less than 50 characters'
  }
};

// ============== VALIDATION HELPER FUNCTIONS ==============

/**
 * Main validation function
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  for (const field in rules) {
    const rule = rules[field];
    const value = data[field];
    
    const fieldValidation = validateField(field, value, rule);
    if (!fieldValidation.isValid) {
      errors[field] = fieldValidation.message;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Validate individual field
 */
export const validateField = (fieldName, value, rule) => {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
    };
  }

  // Skip validation if field is not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  // Type validation
  if (rule.type && !validateType(value, rule.type)) {
    return {
      isValid: false,
      message: rule.message || `${fieldName} must be of type ${rule.type}`
    };
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be at least ${rule.minLength} characters`
      };
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be less than ${rule.maxLength} characters`
      };
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} format is invalid`
      };
    }
  }

  // Number validations
  if (typeof value === 'number' || rule.type === 'number') {
    const numValue = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be a valid number`
      };
    }

    if (rule.min !== undefined && numValue < rule.min) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be at least ${rule.min}`
      };
    }

    if (rule.max !== undefined && numValue > rule.max) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be no more than ${rule.max}`
      };
    }

    if (rule.integer && !Number.isInteger(numValue)) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be a whole number`
      };
    }
  }

  // Array validations
  if (rule.type === 'array') {
    if (!Array.isArray(value)) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be an array`
      };
    }

    if (rule.minLength && value.length < rule.minLength) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must have at least ${rule.minLength} items`
      };
    }
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    return {
      isValid: false,
      message: rule.message || `${fieldName} must be one of: ${rule.enum.join(', ')}`
    };
  }

  // Date validations
  if (rule.type === 'date' || rule.futureDate || rule.pastOrCurrentDate) {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be a valid date`
      };
    }

    if (rule.futureDate && date <= today) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} must be in the future`
      };
    }

    if (rule.pastOrCurrentDate && date > today) {
      return {
        isValid: false,
        message: rule.message || `${fieldName} cannot be in the future`
      };
    }
  }

  return { isValid: true };
};

/**
 * Type validation helper
 */
const validateType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' || !isNaN(parseFloat(value));
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'date':
      return !isNaN(new Date(value).getTime());
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
};

// ============== BUSINESS LOGIC VALIDATIONS ==============

/**
 * Validate stock adjustment quantity against current stock
 */
export const validateStockAdjustment = (currentStock, adjustmentType, quantity) => {
  if (adjustmentType === 'decrease' && quantity > currentStock) {
    return {
      isValid: false,
      message: `Cannot decrease stock by ${quantity}. Current stock is only ${currentStock}`
    };
  }
  return { isValid: true };
};

/**
 * Validate material usage against available stock
 */
export const validateMaterialUsage = (materials, availableStock) => {
  const errors = [];

  materials.forEach((material, index) => {
    const available = availableStock.find(stock => stock.materialId === material.materialId);
    
    if (!available) {
      errors.push({
        index,
        field: 'materialId',
        message: 'Material not found in inventory'
      });
    } else if (material.quantity > available.currentStock) {
      errors.push({
        index,
        field: 'quantity',
        message: `Not enough stock. Available: ${available.currentStock}, Required: ${material.quantity}`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate procurement delivery quantities
 */
export const validateDeliveryQuantities = (procurementItems, deliveredQuantities) => {
  const errors = [];

  procurementItems.forEach((item, index) => {
    const delivered = deliveredQuantities[index];
    
    if (delivered && delivered.quantity > item.quantity) {
      errors.push({
        index,
        field: 'quantity',
        message: `Delivered quantity (${delivered.quantity}) cannot exceed ordered quantity (${item.quantity})`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============== FORM FIELD FORMATTERS ==============

/**
 * Format currency input
 */
export const formatCurrency = (value) => {
  if (!value) return '';
  return parseFloat(value).toFixed(2);
};

/**
 * Format date for input
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Parse form number input
 */
export const parseNumber = (value) => {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Parse integer input
 */
export const parseInteger = (value) => {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

// ============== VALIDATION PRESETS ==============

/**
 * Get validation rules for specific forms
 */
export const getValidationRules = (formType) => {
  const rules = {
    material: materialValidation,
    procurement: procurementValidation,
    stockAdjustment: stockAdjustmentValidation,
    materialUsage: materialUsageValidation,
    supplier: supplierValidation,
    delivery: deliveryValidation
  };

  return rules[formType] || {};
};

/**
 * Validate entire form with custom business rules
 */
export const validateInventoryForm = (formType, data, businessContext = {}) => {
  const rules = getValidationRules(formType);
  const validation = validateForm(data, rules);

  // Apply business-specific validations
  switch (formType) {
    case 'stockAdjustment':
      if (validation.isValid && businessContext.currentStock !== undefined) {
        const stockValidation = validateStockAdjustment(
          businessContext.currentStock,
          data.adjustmentType,
          data.quantity
        );
        if (!stockValidation.isValid) {
          validation.isValid = false;
          validation.errors.quantity = stockValidation.message;
        }
      }
      break;

    case 'materialUsage':
      if (validation.isValid && businessContext.availableStock) {
        const usageValidation = validateMaterialUsage(
          data.materials,
          businessContext.availableStock
        );
        if (!usageValidation.isValid) {
          validation.isValid = false;
          validation.errors.materials = usageValidation.errors;
        }
      }
      break;

    case 'delivery':
      if (validation.isValid && businessContext.procurementItems) {
        const deliveryValidation = validateDeliveryQuantities(
          businessContext.procurementItems,
          data.materials
        );
        if (!deliveryValidation.isValid) {
          validation.isValid = false;
          validation.errors.materials = deliveryValidation.errors;
        }
      }
      break;
  }

  return validation;
};