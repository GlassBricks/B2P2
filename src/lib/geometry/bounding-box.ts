/** @noSelfInFile */

import { DOWN, LEFT, RIGHT, UP } from "./rotation"
import { pos, PositionClass } from "./position"

// Down is positive y, right is positive x

const floor = math.floor
const ceil = math.ceil
const setmetatable = globalThis.setmetatable

export type BoundingBoxClass = WithMetatable<BoundingBoxRead, typeof bbox>

function bbox(left_top: MapPositionTable, right_bottom: MapPositionTable): BoundingBoxClass {
  return setmetatable({ left_top, right_bottom }, meta)
}

namespace bbox {
  import max = math.max
  import min = math.min
  export function from(data: BoundingBoxRead): BoundingBoxClass {
    return setmetatable(
      {
        left_top: data.left_top,
        right_bottom: data.right_bottom,
      },
      meta,
    )
  }

  export function fromCorners(lx: number, ly: number, rx: number, ry: number): BoundingBoxClass {
    return bbox({ x: lx, y: ly }, { x: rx, y: ry })
  }

  export function around(point: MapPositionTable, radius: number): BoundingBoxClass {
    return bbox({ x: point.x - radius, y: point.y - radius }, { x: point.x + radius, y: point.y + radius })
  }

  export function normalize(box: BoundingBox): BoundingBoxClass
  export function normalize(box: Any): BoundingBoxClass {
    return bbox(pos.normalize(box.left_top || box[1]), pos.normalize(box.right_bottom || box[2]))
  }

  export function shift(box: BoundingBoxRead, amount: MapPositionTable): BoundingBoxClass {
    const { left_top, right_bottom } = box
    const { x: bx, y: by } = amount
    return bbox({ x: left_top.x + bx, y: left_top.y + by }, { x: right_bottom.x + bx, y: right_bottom.y + by })
  }
  export function shiftNegative(box: BoundingBoxRead, amount: MapPositionTable): BoundingBoxClass {
    const { left_top, right_bottom } = box
    const { x: bx, y: by } = amount
    return bbox({ x: left_top.x - bx, y: left_top.y - by }, { x: right_bottom.x - bx, y: right_bottom.y - by })
  }
  export function shiftToOrigin(box: BoundingBoxRead): BoundingBoxClass {
    const { left_top, right_bottom } = box
    const { x: bx, y: by } = left_top
    return bbox({ x: 0, y: 0 }, { x: right_bottom.x - bx, y: right_bottom.y - by })
  }
  export function roundTile(box: BoundingBoxRead): BoundingBoxClass {
    const { left_top, right_bottom } = box
    return bbox({ x: floor(left_top.x), y: floor(left_top.y) }, { x: ceil(right_bottom.x), y: ceil(right_bottom.y) })
  }
  export function roundTileConservative(box: BoundingBoxRead, thresh: number = 0.1): BoundingBoxClass {
    const { left_top, right_bottom } = box
    return bbox(
      { x: floor(left_top.x + thresh), y: floor(left_top.y + thresh) },
      { x: ceil(right_bottom.x - thresh), y: ceil(right_bottom.y - thresh) },
    )
  }
  export function scale(box: BoundingBoxRead, factor: number): BoundingBoxClass {
    const { left_top, right_bottom } = box
    return bbox(
      { x: left_top.x * factor, y: left_top.y * factor },
      { x: right_bottom.x * factor, y: right_bottom.y * factor },
    )
  }
  export function center(box: BoundingBoxRead): PositionClass {
    const { left_top, right_bottom } = box
    return pos((left_top.x + right_bottom.x) / 2, (left_top.y + right_bottom.y) / 2)
  }
  export function rotateAboutOrigin(box: BoundingBoxRead, direction: defines.direction): BoundingBoxClass {
    if (direction === UP) return bbox.from(box)
    const { left_top, right_bottom } = box
    const { x: lx, y: ly } = left_top
    const { x: rx, y: ry } = right_bottom
    if (direction === DOWN) return bbox({ x: -rx, y: -ry }, { x: -lx, y: -ly })
    if (direction === LEFT) return bbox({ x: ly, y: -rx }, { x: ry, y: -lx })
    if (direction === RIGHT) return bbox({ x: -ry, y: lx }, { x: -ly, y: rx })

    error(`invalid direction ${defines.direction[direction]}`)
  }
  export function intersect(box1: BoundingBoxRead, box2: BoundingBoxRead): BoundingBoxClass {
    const { left_top, right_bottom } = box1
    const { left_top: lt2, right_bottom: rb2 } = box2
    return bbox.fromCorners(
      max(left_top.x, lt2.x),
      max(left_top.y, lt2.y),
      min(right_bottom.x, rb2.x),
      min(right_bottom.y, rb2.y),
    )
  }
  export function iterateTiles(box: BoundingBoxRead): LuaIterable<LuaMultiReturn<[x: number, y: number] | []>> {
    const { left_top, right_bottom } = box
    const startX = left_top.x
    const x2 = right_bottom.x
    const y2 = right_bottom.y
    let x = startX
    let y = left_top.y
    return function () {
      if (y >= y2) return
      const retX = x
      const retY = y
      x++
      if (x >= x2) {
        x = startX
        y++
      }
      return $multi(retX, retY)
    } as any
  }
  export function equals(box1: BoundingBoxRead, box2: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box1
    const { left_top: lt2, right_bottom: rb2 } = box2
    return left_top.x === lt2.x && left_top.y === lt2.y && right_bottom.x === rb2.x && right_bottom.y === rb2.y
  }
  export function isCenteredSquare(box: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box
    return left_top.x === left_top.y && right_bottom.x === right_bottom.y && left_top.x === -right_bottom.x
  }
  export function isCenteredRectangle(box: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box
    return left_top.x === -right_bottom.x && left_top.y === -right_bottom.y
  }
  export function contains(box: BoundingBoxRead, point: MapPositionTable): boolean {
    const { left_top, right_bottom } = box
    return point.x >= left_top.x && point.x <= right_bottom.x && point.y >= left_top.y && point.y <= right_bottom.y
  }
  export function intersectsNonZeroArea(box: BoundingBoxRead, other: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box
    const { left_top: otherLeft_top, right_bottom: otherRight_bottom } = other
    return (
      left_top.x < otherRight_bottom.x &&
      right_bottom.x > otherLeft_top.x &&
      left_top.y < otherRight_bottom.y &&
      right_bottom.y > otherLeft_top.y
    )
  }
}
export function equals(box: BoundingBoxRead, other: BoundingBoxRead): boolean {
  const { left_top, right_bottom } = box
  const { left_top: lt, right_bottom: rb } = other
  return lt.x === left_top.x && lt.y === left_top.y && rb.x === right_bottom.x && rb.y === right_bottom.y
}

const meta: LuaMetatable<BoundingBoxRead, BoundingBoxClass> = {
  __index: bbox as any,
}
export { bbox }
