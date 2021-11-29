export function checkIsBeforeLoad(): void {
  if (game) {
    error("This operation must only be done during script load.")
  }
}

export function checkIsAfterLoad(): void {
  if (!game) {
    error("This operation can only be during an event")
  }
}
