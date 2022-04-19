import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { Entity } from "../entity/entity"
import { getEntitySample } from "../test/entity-sample"
import {
  CannotUpgrade,
  ItemsIgnored,
  mapPasteConflictsToDiagnostics,
  Overlap,
  UnsupportedProp,
} from "./paste-diagnostics"

let entity1: Entity
let entity2: Entity
before_all(() => {
  entity1 = getEntitySample("assembling-machine-1")
  entity2 = getEntitySample("assembling-machine-2")
})

test("overlap", () => {
  const conflict: BlueprintPasteConflicts = {
    overlaps: [
      {
        below: entity1,
        above: entity2,
      },
    ],
  }
  const diagnostics = mapPasteConflictsToDiagnostics(conflict)
  assert.equal(1, diagnostics.length)
  assert.same(Overlap(entity1, entity2), diagnostics[0])
})

test("upgrade", () => {
  const conflict: BlueprintPasteConflicts = {
    propConflicts: [
      {
        below: entity1,
        above: entity2,
        prop: "name",
      },
    ],
  }
  const diagnostics = mapPasteConflictsToDiagnostics(conflict)
  assert.equal(1, diagnostics.length)
  assert.same(CannotUpgrade(entity1, entity2), diagnostics[0])
})

test("items", () => {
  const conflict: BlueprintPasteConflicts = {
    propConflicts: [
      {
        below: entity1,
        above: entity2,
        prop: "items",
      },
    ],
  }
  const diagnostics = mapPasteConflictsToDiagnostics(conflict)
  assert.equal(1, diagnostics.length)
  assert.same(ItemsIgnored(entity2), diagnostics[0])
})

test("unsupported prop", () => {
  const conflict: BlueprintPasteConflicts = {
    propConflicts: [
      {
        below: entity1,
        above: entity2,
        prop: "foo" as any,
      },
    ],
  }
  const diagnostics = mapPasteConflictsToDiagnostics(conflict)
  assert.equal(1, diagnostics.length)
  assert.same(UnsupportedProp(entity2, "foo" as any), diagnostics[0])
})
