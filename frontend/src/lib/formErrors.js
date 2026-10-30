// Turns an ApiError from a 422 response into { field: 'first message' } for FormField error props.
export function fieldErrors(error) {
  if (!error || error.status !== 422 || !error.errors) return {};
  return Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]]));
}

// The errors without the one for a field the user just changed (QA bug #12: an old message stayed until the
// next save). A picker field "category" also clears the server's "category_id" message. Same object if nothing to clear.
export function withoutError(errors, field) {
  const keys = [field, `${field}_id`].filter((key) => errors && key in errors);
  if (keys.length === 0) return errors;
  const next = { ...errors };
  keys.forEach((key) => delete next[key]);
  return next;
}
