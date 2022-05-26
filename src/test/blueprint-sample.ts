import { get_area } from "__testorio__/testUtil/areas"
import { LuaBlueprint } from "../blueprint/LuaBlueprint"
import { takeBlueprint } from "../blueprint/world"
import { bbox } from "../lib/geometry"

const blueprintSampleNames = {
  original: true,
  "control behavior change": true,
  "add inserter": true,
  "add chest": true,
  "delete splitter": true,
  "move splitter": true,
  "mixed change": true,
  "inserter rotate": true,
  "assembler rotate": true,
  "recipe change": true,
  "recipe change 2": true,
  "inserter fast replace": true,
  "module change": true,
  "stack size change": true,
  "circuit wire add": true,
  "circuit wire remove": true,
  "module purple sci": true,
  "splitter flip": true,
  "pole circuit add": true,
  "inserter fast replace and control change": true,
}
export type BlueprintSampleName = keyof typeof blueprintSampleNames
export const BlueprintSampleNames = Object.keys(blueprintSampleNames) as BlueprintSampleName[]

let samples: Record<string, readonly BlueprintEntityRead[]>
function loadSamplesFromWorld() {
  samples = {}
  for (const name of BlueprintSampleNames) {
    try {
      const [surface, area] = get_area(1 as SurfaceIdentification, `bp ${name}`)
      samples[name] = takeBlueprint(surface, bbox.normalize(area)).getEntities()
    } catch {
      // ignore
    }
  }
}

export function getBlueprintSample(sample: BlueprintSampleName): LuaBlueprint {
  if (!samples) {
    loadSamplesFromWorld()
  }
  const entities = samples[sample] ?? error(`no blueprint sample found for ${sample}`)
  return LuaBlueprint.fromArray(entities)
}
