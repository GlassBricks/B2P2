export function debugPrint(item: unknown): void {
  const message = serpent.block(item)
  game?.print(message)
  log(message)
}
