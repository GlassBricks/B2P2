/** @noSelfInFile */

import { DOWN, LEFT, RIGHT, UP } from "./rotation"

// Down is positive y, right is positive x

const floor = math.floor
const ceil = math.ceil
const setmetatable = globalThis.setmetatable

export type BoundingBoxClass = WithMetatable<BoundingBoxRead, typeof bbox>

function bbox(left_top: MapPositionTable, right_bottom: MapPositionTable): BoundingBoxClass {
  return setmetatable({ left_top, right_bottom }, meta)
}

namespace bbox {
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

  export function shift(box: BoundingBoxRead, amount: MapPositionTable): BoundingBoxClass {
    const { left_top, right_bottom } = box
    const { x: bx, y: by } = amount
    return bbox({ x: left_top.x + bx, y: left_top.y + by }, { x: right_bottom.x + bx, y: right_bottom.y + by })
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
  export function center(box: BoundingBoxRead): MapPositionTable {
    const { left_top, right_bottom } = box
    return { x: (left_top.x + right_bottom.x) / 2, y: (left_top.y + right_bottom.y) / 2 }
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
  export function isCenteredSquare(box: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box
    return left_top.x === left_top.y && right_bottom.x === right_bottom.y && left_top.x === -right_bottom.x
  }
  export function isCenteredRectangle(box: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box
    return left_top.x === -right_bottom.x && left_top.y === -right_bottom.y
  }
  export function equals(box: BoundingBoxRead, other: BoundingBoxRead): boolean {
    const { left_top, right_bottom } = box
    const { left_top: lt, right_bottom: rb } = other
    return lt.x === left_top.x && lt.y === left_top.y && rb.x === right_bottom.x && rb.y === right_bottom.y
  }
}

const meta: LuaMetatable<BoundingBoxRead, BoundingBoxClass> = {
  __index: bbox as any,
}
export { bbox }