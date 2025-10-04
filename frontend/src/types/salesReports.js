// Sales Reports Type Definitions

/**
 * @typedef {Object} DailySalesReport
 * @property {number} id
 * @property {string} date - YYYY-MM-DD format
 * @property {string} generated_by
 * @property {string} generated_by_name
 * @property {boolean} is_submitted
 * @property {string|null} submitted_at
 * @property {string} total_sales_amount - decimal as string
 * @property {string} total_payments_received
 * @property {string} total_outstanding
 * @property {string} total_expenses
 * @property {string} net_total
 * @property {string} created_at
 * @property {string} updated_at
 * @property {boolean} can_edit - Important for UI controls
 * @property {DailySalesReportItem[]} report_items
 * @property {DailyExpense[]} expenses
 * @property {SalesReportNote[]} notes
 */

/**
 * @typedef {Object} DailySalesReportItem
 * @property {number} id
 * @property {number} category - category ID
 * @property {string} category_name
 * @property {string} category_color - hex color for UI
 * @property {number} total_works
 * @property {string} total_amount
 * @property {string} payments_received
 * @property {string} outstanding_amount - auto-calculated
 */

/**
 * @typedef {Object} DailyExpense
 * @property {number} id
 * @property {string} description
 * @property {string} amount
 * @property {ExpenseCategory} category
 * @property {string|null} receipt_number
 * @property {string} recorded_by
 * @property {string} recorded_at
 */

/**
 * @typedef {Object} SalesReportNote
 * @property {number} id
 * @property {string} note
 * @property {string} added_by
 * @property {string} added_by_name
 * @property {string} created_at
 */

/**
 * @typedef {'office_supplies'|'transport'|'meals'|'utilities'|'maintenance'|'marketing'|'other'} ExpenseCategory
 */

/**
 * @typedef {Object} CategoryItemForm
 * @property {number} category - dropdown of job categories
 * @property {number} total_works
 * @property {string} total_amount
 * @property {string} payments_received
 */

/**
 * @typedef {Object} ExpenseForm
 * @property {string} description
 * @property {string} amount
 * @property {ExpenseCategory} category
 * @property {string} receipt_number
 */

/**
 * @typedef {Object} NoteForm
 * @property {string} note - textarea
 */

/**
 * @typedef {Object} SalesReportSummary
 * @property {number} total_reports
 * @property {number} submitted_reports
 * @property {number} draft_reports
 * @property {string} total_revenue
 * @property {string} total_outstanding
 * @property {DailySalesReport[]} recent_reports
 */

export const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'transport', label: 'Transport' },
  { value: 'meals', label: 'Meals' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' }
];

export const getExpenseCategoryLabel = (category) => {
  const found = EXPENSE_CATEGORIES.find(c => c.value === category);
  return found ? found.label : category;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(parseFloat(amount || 0));
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateTime) => {
  return new Date(dateTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};