import { Brand } from "../lib/util-types"
import { Classes, Events } from "../lib"
import { Layer } from "./Layer"

export type AssemblyId = Brand<number, "AssemblyId">
export type LayerId = Brand<number, "AssemblyId">

export interface LayerRef {
  assembly: AssemblyId
  layer: LayerId
}

@Classes.register()
export class Assembly {
  readonly id: AssemblyId
  layers: Layer[] = []
  readonly layersById: Record<LayerId, Layer> = {}
  private nextLayerId = 1 as LayerId
  constructor(public name: string) {
    this.id = (luaLength(global.assemblies) + 1) as AssemblyId
    global.assemblies[this.id] = this
  }

  addLayer(layer: Layer): void {
    this.layers.push(layer)
    const id = this.nextLayerId++
    this.layersById[id as LayerId] = layer
  }
}

declare const global: {
  assemblies: Record<AssemblyId, Assembly>
}
Events.on_init(() => {
  global.assemblies = {}
})
