export function debugPrint(...items: unknown[]): void {
  let item: unknown
  if (select("#", ...items) === 1) {
    ;[item] = [...items]
  } else {
    item = table.pack(...items)
  }

  const message = serpent.block(item)
  game?.print(message)
  log(message)
}
