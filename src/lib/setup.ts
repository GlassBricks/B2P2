export function checkIsBeforeLoad(): void {
  if (game) {
    error("This operation must only be done during script load.")
  }
}
