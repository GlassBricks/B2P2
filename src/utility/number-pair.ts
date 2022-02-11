// http://szudzik.com/ElegantPairing.pdf

export type NumberPair = number & { _numberPairBrand: never }

export function pair(x: number, y: number): NumberPair {
  return (y > x ? y * y + x : x * x + x + y) as NumberPair
}

const sqrt = math.sqrt
const floor = math.floor
export function unpair(z: NumberPair): LuaMultiReturn<[number, number]> {
  const q = floor(sqrt(z))
  const l = z - q * q
  if (l < q) {
    return $multi(l, q)
  }
  return $multi(q, l - q)
}
