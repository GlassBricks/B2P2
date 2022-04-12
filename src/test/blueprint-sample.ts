import { get_area } from "__testorio__/testUtil/areas"
import { takeBlueprint } from "../world-interaction/blueprint"

const blueprintSampleNames = {
  original: true,
  "control behavior change": true,
  "add inserter": true,
  "delete splitter": true,
  "move splitter": true,
  "mixed change": true,
  "inserter rotate": true,
  "assembler rotate": true,
  "recipe change": true,
  "recipe changes 2": true,
  "inserter fast replace": true,
  "module change": true,
  "stack size change": true,
  "circuit wire add": true,
  "circuit wire remove": true,
}
export type BlueprintSampleName = keyof typeof blueprintSampleNames

let samples: Record<string, BlueprintEntityRead[]>
function loadSamplesFromWorld() {
  samples = {}
  for (const [name] of pairs(blueprintSampleNames)) {
    try {
      const [surface, area] = get_area(1 as SurfaceIdentification, `bp ${name}`)
      samples[name] = takeBlueprint(surface, area)
    } catch {
      // ignore
    }
  }
}

export function getBlueprintSample(sample: BlueprintSampleName): BlueprintEntityRead[] {
  if (!samples) {
    loadSamplesFromWorld()
  }
  return samples[sample] ?? error(`no blueprint sample found for ${sample}`)
}
