export function checkIsBeforeLoad(): void {
  if (game) {
    error("This operation must only be done during script load.")
  }
}

export function checkCanModifyGameState(): void {
  if (!game) {
    error("This operation can only be done after script load.")
  }
}
