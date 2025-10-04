import { formatCurrency } from '../types/salesReports';

export default function Currency({ amount, className = "", colorClass = "" }) {
  const formattedAmount = formatCurrency(amount);
  
  return (
    <span className={`${className} ${colorClass}`}>
      {formattedAmount}
    </span>
  );
}