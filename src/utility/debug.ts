export function debugPrint(...items: unknown[]): void {
  const message = items.map((x) => serpent.block(x)).join(" ")
  game?.print(message)
  log(message)
}
