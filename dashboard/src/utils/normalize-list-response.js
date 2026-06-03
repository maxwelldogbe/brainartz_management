// ----------------------------------------------------------------------

export function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
}
