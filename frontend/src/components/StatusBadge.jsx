export default function StatusBadge({ isSubmitted, className = "" }) {
  if (isSubmitted) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
        ✅ Submitted
      </span>
    );
  } else {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ${className}`}>
        📝 Draft
      </span>
    );
  }
}