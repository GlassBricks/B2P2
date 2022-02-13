import { DOWN, LEFT, RIGHT, UP } from "./rotation"

const setmeta = setmetatable

const floor = math.floor
const ceil = math.ceil
// Down is positive y, right is positive x

function bbox(left_top: PositionTable, right_bottom: PositionTable): BoundingBoxClass {
  return setmeta({ left_top, right_bottom }, proto)
}
export class BoundingBoxClass implements BoundingBoxRead {
  readonly left_top: PositionTable
  readonly right_bottom: PositionTable

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private constructor(_: never) {
    error("PositionClass should not be instantiated")
  }

  shift(amount: PositionTable): BoundingBoxClass {
    const { left_top, right_bottom } = this
    const { x: bx, y: by } = amount

    return bbox({ x: left_top.x + bx, y: left_top.y + by }, { x: right_bottom.x + bx, y: right_bottom.y + by })
  }

  shiftToOrigin(): BoundingBoxClass {
    const { left_top, right_bottom } = this
    const { x: bx, y: by } = left_top

    return bbox({ x: 0, y: 0 }, { x: right_bottom.x - bx, y: right_bottom.y - by })
  }

  roundTile(): BoundingBoxClass {
    const { left_top, right_bottom } = this
    return bbox(
      {
        x: floor(left_top.x),
        y: floor(left_top.y),
      },
      {
        x: ceil(right_bottom.x),
        y: ceil(right_bottom.y),
      },
    )
  }

  // rounds down if within thresh
  roundTileConservative(thresh: number = 0.1): BoundingBoxClass {
    const { left_top, right_bottom } = this
    return bbox(
      {
        x: floor(left_top.x + thresh),
        y: floor(left_top.y + thresh),
      },
      {
        x: ceil(right_bottom.x - thresh),
        y: ceil(right_bottom.y - thresh),
      },
    )
  }

  scale(factor: number): BoundingBoxClass {
    const { left_top, right_bottom } = this
    return bbox(
      {
        x: left_top.x * factor,
        y: left_top.y * factor,
      },
      {
        x: right_bottom.x * factor,
        y: right_bottom.y * factor,
      },
    )
  }

  center(): PositionTable {
    const { left_top, right_bottom } = this
    return {
      x: (left_top.x + right_bottom.x) / 2,
      y: (left_top.y + right_bottom.y) / 2,
    }
  }

  rotateAboutOrigin(direction: defines.direction): BoundingBoxClass {
    if (direction === UP) return this
    const { left_top, right_bottom } = this
    const { x: lx, y: ly } = left_top
    const { x: rx, y: ry } = right_bottom
    if (direction === DOWN) return bbox({ x: -rx, y: -ry }, { x: -lx, y: -ly })
    if (direction === LEFT) return bbox({ x: ly, y: -rx }, { x: ry, y: -lx })
    if (direction === RIGHT) return bbox({ x: -ry, y: lx }, { x: -ly, y: rx })

    error(`invalid direction ${defines.direction[direction]}`)
  }

  // exclusive of bottom left
  iterateTiles(): LuaIterable<PositionArray> {
    const { left_top, right_bottom } = this
    const startX = left_top.x
    const x2 = right_bottom.x
    const y2 = right_bottom.y
    let x = startX
    let y = left_top.y
    return function () {
      if (y >= y2) return undefined
      const ret: PositionArray = [x, y]
      x++
      if (x >= x2) {
        x = startX
        y++
      }
      return ret
    } as LuaIterable<PositionArray>
  }
}
const proto = BoundingBoxClass.prototype as LuaMetatable<any>

namespace bbox {
  export function around(point: PositionTable, radius: number): BoundingBoxClass {
    return bbox({ x: point.x - radius, y: point.y - radius }, { x: point.x + radius, y: point.y + radius })
  }

  export function from(data: BoundingBoxRead): BoundingBoxClass {
    return setmeta(
      {
        left_top: data.left_top,
        right_bottom: data.right_bottom,
      },
      proto,
    )
  }
  export function corners(lx: number, ly: number, rx: number, ry: number): BoundingBoxClass {
    return bbox({ x: lx, y: ly }, { x: rx, y: ry })
  }
}

export { bbox }
