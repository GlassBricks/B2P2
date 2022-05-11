/** @noSelfInFile */

import * as util from "util"
import { NumberPair, pair } from "./number-pair"
import { DOWN, LEFT, RIGHT, UP } from "./rotation"

// Down is positive y, right is positive x

const setmetatable = globalThis.setmetatable
const gfloor = math.floor
const gceil = math.ceil
const sqrt = math.sqrt
const gpair = pair

export type PositionClass = WithMetatable<MapPositionTable, typeof pos>

function pos(x: number, y: number): PositionClass {
  return setmetatable({ x, y }, meta)
}

namespace pos {
  export function from(position: MapPositionTable): PositionClass {
    return setmetatable({ x: position.x, y: position.y }, meta)
  }
  export function load(position: MapPositionTable): PositionClass {
    return setmetatable(position, meta)
  }
  export function normalize(pos: MapPosition): PositionClass
  export function normalize(p: Any): PositionClass {
    return pos(p.x || p[1], p.y || p[2])
  }

  export function add(pos1: MapPositionTable, pos2: MapPositionTable): PositionClass {
    return pos(pos1.x + pos2.x, pos1.y + pos2.y)
  }
  export function sub(pos1: MapPositionTable, pos2: MapPositionTable): PositionClass {
    return pos(pos1.x - pos2.x, pos1.y - pos2.y)
  }
  export function times(pos1: MapPositionTable, factor: number): PositionClass {
    return pos(pos1.x * factor, pos1.y * factor)
  }
  export function div(pos1: MapPositionTable, factor: number): PositionClass {
    return pos(pos1.x / factor, pos1.y / factor)
  }
  export function emul(pos1: MapPositionTable, pos2: MapPositionTable): PositionClass {
    return pos(pos1.x * pos2.x, pos1.y * pos2.y)
  }
  export function ediv(pos1: MapPositionTable, pos2: MapPositionTable): PositionClass {
    return pos(pos1.x / pos2.x, pos1.y / pos2.y)
  }
  export function floor(pos1: MapPositionTable): PositionClass {
    return pos(gfloor(pos1.x), gfloor(pos1.y))
  }
  export function ceil(pos1: MapPositionTable): PositionClass {
    return pos(gceil(pos1.x), gceil(pos1.y))
  }
  export function length(pos1: MapPositionTable): number {
    return sqrt(pos1.x * pos1.x + pos1.y * pos1.y)
  }
  export function pair(pos1: MapPositionTable): NumberPair {
    return gpair(pos1.x, pos1.y)
  }
  export function equals(pos1: MapPositionTable, pos2: MapPositionTable): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y
  }
  export function rotateAboutOrigin(pos1: MapPositionTable, direction: defines.direction): PositionClass {
    if (direction === UP) return pos.from(pos1)
    if (direction === DOWN) return pos(-pos1.x, -pos1.y)
    if (direction === LEFT) return pos(pos1.y, -pos1.x)
    if (direction === RIGHT) return pos(-pos1.y, pos1.x)
    error(`invalid direction: ${defines.direction[direction]}`)
  }
}

const meta: LuaMetatable<MapPositionTable, PositionClass> = {
  __index: pos as any,
  __tostring: util.positiontostr as any,
}

export { pos }
