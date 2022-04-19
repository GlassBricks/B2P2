import { get_area } from "__testorio__/testUtil/areas"
import { takeBlueprint } from "../world-interaction/blueprint"
import { bbox } from "../lib/geometry/bounding-box"
import { table } from "util"
import deepcopy = table.deepcopy

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
}
export type BlueprintSampleName = keyof typeof blueprintSampleNames
export const BlueprintSampleNames = Object.keys(blueprintSampleNames) as BlueprintSampleName[]

let samples: Record<string, BlueprintEntityRead[]>
function loadSamplesFromWorld() {
  samples = {}
  for (const [name] of pairs(blueprintSampleNames)) {
    try {
      const [surface, area] = get_area(1 as SurfaceIdentification, `bp ${name}`)
      samples[name] = takeBlueprint(surface, bbox.normalize(area))
    } catch {
      // ignore
    }
  }
}

export function getBlueprintSample(sample: BlueprintSampleName): BlueprintEntityRead[] {
  if (!samples) {
    loadSamplesFromWorld()
  }
  return deepcopy(samples[sample]) ?? error(`no blueprint sample found for ${sample}`)
}
