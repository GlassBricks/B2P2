import { Blueprint, MutableBlueprint } from "./Blueprint"
import { createEntity, Entity } from "../entity/entity"
import { getEntitySample } from "../test/entity-sample"
import { pos } from "../lib/geometry/position"
import { BlueprintPasteConflicts, findBlueprintPasteConflicts } from "./blueprint-paste"

let emptyBlueprint: Blueprint
let assemblingMachine: Entity
let singleAssemblerBlueprint: Blueprint
before_all(() => {
  emptyBlueprint = new MutableBlueprint()
  assemblingMachine = createEntity({
    ...getEntitySample("assembling-machine-1"),
    position: pos(0.5, 0.5),
  })
  const saBlueprint = new MutableBlueprint()
  saBlueprint.addSingle(assemblingMachine)
  singleAssemblerBlueprint = saBlueprint
})
const noConflicts: BlueprintPasteConflicts = {
  overlaps: [],
  propConflicts: [],
}

test("pasting empty on empty produces no conflicts", () => {
  assert.same(noConflicts, findBlueprintPasteConflicts(emptyBlueprint, emptyBlueprint))
})

test("pasting empty on basic produces no conflicts", () => {
  assert.same(noConflicts, findBlueprintPasteConflicts(singleAssemblerBlueprint, emptyBlueprint))
})

test("pasting basic on empty produces no conflicts", () => {
  assert.same(noConflicts, findBlueprintPasteConflicts(emptyBlueprint, singleAssemblerBlueprint))
})

test("pasting basic on identical produces no conflicts", () => {
  assert.same(noConflicts, findBlueprintPasteConflicts(singleAssemblerBlueprint, singleAssemblerBlueprint))
})

test("detects overlapping entities", () => {
  const movedAssemblingMachine = createEntity({
    ...assemblingMachine,
    position: pos(1.5, 1.5),
  })
  const blueprint2 = new MutableBlueprint()
  blueprint2.addSingle(movedAssemblingMachine)
  const conflicts = findBlueprintPasteConflicts(singleAssemblerBlueprint, blueprint2)
  assert.same(
    [
      {
        below: assemblingMachine,
        above: movedAssemblingMachine,
      },
    ],
    conflicts.overlaps,
  )
  assert.same([], conflicts.propConflicts)
})

test("detects entity incompatibilities", () => {
  const asm2 = createEntity({
    ...assemblingMachine,
    name: "assembling-machine-2",
  })
  const blueprint2 = new MutableBlueprint()
  blueprint2.addSingle(asm2)
  const conflicts = findBlueprintPasteConflicts(singleAssemblerBlueprint, blueprint2)
  assert.same(
    [
      {
        below: assemblingMachine,
        above: asm2,
        prop: "name",
      },
    ],
    conflicts.propConflicts,
  )
  assert.same([], conflicts.overlaps)
})
