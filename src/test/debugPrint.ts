export function debugPrint(value: unknown): void {
  if (game) {
    game.print(serpent.block(value))
  }
  log(serpent.block(value))
}
