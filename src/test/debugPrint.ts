export function debugPrint(...values: unknown[]): void {
  const output = values
    .map((value) => (typeof value === "number" || typeof value === "string" ? value.toString() : serpent.block(value)))
    .join(" ")
  game?.print(output)
  log(output)
}
