// ----------------------------------------------------------------------

export function extractErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.detail) return typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
  if (error?.non_field_errors?.length) return error.non_field_errors[0];
  if (error?.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  if (error && typeof error === 'object') {
    const firstFieldErrors = Object.values(error).find((value) => Array.isArray(value) && value.length);
    if (firstFieldErrors) return firstFieldErrors[0];
  }
  return 'Request failed';
}
