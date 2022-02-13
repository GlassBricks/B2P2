import { NumberPair, pair } from "./number-pair"
import { DOWN, LEFT, RIGHT, UP } from "./rotation"

// Down is positive y, right is positive x

const floor = math.floor
const ceil = math.ceil
const sqrt = math.sqrt
const setmeta = setmetatable

function pos(x: number, y: number): PosClass {
  return setmeta({ x, y }, proto)
}
// class not exported so not accidentally instantiated
// noinspection JSSuspiciousNameCombination
export class PosClass implements PositionTable {
  readonly x: number
  readonly y: number

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private constructor(_: never) {
    error("PositionClass should not be instantiated")
  }

  add(other: PositionTable): PosClass {
    return pos(this.x + other.x, this.y + other.y)
  }

  sub(other: PositionTable): PosClass {
    return pos(this.x - other.x, this.y - other.y)
  }

  times(factor: number): PosClass {
    return pos(this.x * factor, this.y * factor)
  }

  div(factor: number): PosClass {
    return pos(this.x / factor, this.y / factor)
  }

  emul(other: PositionTable): PosClass {
    return pos(this.x * other.x, this.y * other.y)
  }

  ediv(other: PositionTable): PosClass {
    return pos(this.x / other.x, this.y / other.y)
  }

  floor(): PosClass {
    return pos(floor(this.x), floor(this.y))
  }

  ceil(): PosClass {
    return pos(ceil(this.x), ceil(this.y))
  }

  length(): number {
    return sqrt(this.x * this.x + this.y * this.y)
  }

  pair(): NumberPair {
    return pair(this.x, this.y)
  }

  equals(position: PositionTable): boolean {
    return this.x === position.x && this.y === position.y
  }

  rotateAboutOrigin(direction: defines.direction): PosClass {
    if (direction === UP) return this
    if (direction === DOWN) return pos(-this.x, -this.y)
    if (direction === LEFT) return pos(this.y, -this.x)
    if (direction === RIGHT) return pos(-this.y, this.x)
    error(`invalid direction: ${defines.direction[direction]}`)
  }
}
const proto = PosClass.prototype as LuaMetatable<any>

namespace pos {
  export function load(position: PositionTable): asserts position is PosClass {
    setmeta(position, proto)
  }

  export function from(position: PositionTable): PosClass {
    return setmeta({ x: position.x, y: position.y }, proto)
  }

  export function equals(a: PositionTable, b: PositionTable): boolean {
    return a.x === b.x && a.y === b.y
  }
}

export { pos }
