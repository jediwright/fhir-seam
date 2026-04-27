/**
 * FieldError — inline validation error display.
 * Renders nothing when message is null.
 */
export function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
      <span aria-hidden="true">↑</span>
      {message}
    </p>
  )
}
