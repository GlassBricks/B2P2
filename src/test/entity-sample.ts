import { get_area } from "__testorio__/testUtil/areas"
import { bbox } from "../lib/geometry/bounding-box"
import { shallowCopy } from "../lib/util"
import { takeBlueprint } from "../world-interaction/blueprint"

const entitySamples = {
  chest: true,
  furnace: true,
  splitter: true,
  "flipped-splitter": true,
  "offshore-pump": true,

  inserter: true,
  "fast-inserter": true,
  "rotated-inserter": true,

  "assembling-machine-1": true,
  "assembling-machine-2": true,
  "fluid-assembling-machine": true,
  "rotated-fluid-assembling-machine": true,
  "assembling-machine-with-modules-1": true,
  "assembling-machine-with-modules-2": true,

  "power-pole": true,
}
export type EntitySampleName = keyof typeof entitySamples

let samples: Record<string, BlueprintEntityRead>
function loadSamplesFromWorld() {
  const samplesInOrderByName: Record<string, EntitySampleName[]> = {
    "iron-chest": ["chest"],
    "stone-furnace": ["furnace"],
    splitter: ["splitter", "flipped-splitter"],
    "offshore-pump": ["offshore-pump"],
    inserter: ["inserter", "rotated-inserter"],
    "fast-inserter": ["fast-inserter"],
    "assembling-machine-1": ["assembling-machine-1"],
    "assembling-machine-2": [
      "assembling-machine-2",
      "fluid-assembling-machine",
      "rotated-fluid-assembling-machine",
      "assembling-machine-with-modules-1",
      "assembling-machine-with-modules-2",
    ],
    "small-electric-pole": ["power-pole"],
  }
  samples = {}
  const [surface, area] = get_area(1 as SurfaceIdentification, "entity samples")
  const entities = takeBlueprint(surface, bbox.normalize(area))
  for (const entity of entities) {
    const name = entity.name
    const sampleName = samplesInOrderByName[name]?.shift()
    // for now, ignore if not in samples
    if (sampleName) {
      samples[sampleName] = entity
    }
  }
}

export function getEntitySample(sampleName: EntitySampleName): BlueprintEntityRead {
  if (!samples) {
    loadSamplesFromWorld()
  }
  const sample = samples[sampleName] ?? error(`no entity sample found for ${sampleName}`)
  return shallowCopy(sample)
}
