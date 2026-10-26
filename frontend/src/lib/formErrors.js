// Turns an ApiError from a 422 response into { field: 'first message' } for FormField error props.
export function fieldErrors(error) {
  if (!error || error.status !== 422 || !error.errors) return {};
  return Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]]));
}
