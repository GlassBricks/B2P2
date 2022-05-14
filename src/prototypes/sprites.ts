import { Data } from "typed-factorio/data/types"
import { Sprites } from "../constants"

declare const data: Data

const teleportBlackSprite = {
  type: "sprite",
  name: Sprites.TeleportBlack,
  filename: "__bbpp__/graphics/teleport-black.png",
  size: [32, 32],
}

const teleportWhiteSprite = {
  type: "sprite",
  name: Sprites.TeleportWhite,
  filename: "__bbpp__/graphics/teleport-white.png",
  size: [32, 32],
}

data.extend([teleportBlackSprite, teleportWhiteSprite])
