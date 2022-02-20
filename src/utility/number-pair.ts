// http://szudzik.com/ElegantPairing.pdf

function integerToNatural(a: number): number {
  return a < 0 ? -2 * a - 1 : 2 * a
}
function naturalToInteger(a: number): number {
  return a % 2 === 0 ? a / 2 : -(a + 1) / 2
}
export type NumberPair = number & { _numberPairBrand: never }
export function pair(x: number, y: number): NumberPair {
  x = integerToNatural(x)
  y = integerToNatural(y)

  return (y > x ? y * y + x : x * x + x + y) as NumberPair
}

const sqrt = math.sqrt
const floor = math.floor
export function unpair(z: NumberPair): LuaMultiReturn<[number, number]> {
  const q = floor(sqrt(z))
  const l = z - q * q
  if (l < q) {
    // return $multi(l, q)
    return $multi(naturalToInteger(l), naturalToInteger(q))
  }
  // return $multi(q, l - q)
  return $multi(naturalToInteger(q), naturalToInteger(l - q))
}
