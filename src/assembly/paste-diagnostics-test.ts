import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { Entity } from "../entity/entity"
import { getEntitySample } from "../test/entity-sample"
import {
  CannotUpgrade,
  ItemsIgnored,
  mapPasteConflictsToDiagnostics,
  Overlap,
  PasteDiagnostic,
  PasteDiagnostics,
  UnsupportedProp,
} from "./paste-diagnostics"
import { Diagnostic, DiagnosticCategory } from "./diagnostics/Diagnostic"

let entity1: Entity
let entity2: Entity
before_all(() => {
  entity1 = getEntitySample("assembling-machine-1")
  entity2 = getEntitySample("assembling-machine-2")
})

function assertSingleDiagnostic(
  map: PasteDiagnostics,
  expectedCategory: DiagnosticCategory<PasteDiagnostic>,
  expectedDiagnostic: Diagnostic,
) {
  assert.same([expectedCategory.id], Object.keys(map))
  assert.same(1, map[expectedCategory.id]?.diagnostics.length)
  assert.same(expectedDiagnostic, map[expectedCategory.id]!.diagnostics[0])
}

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
  assertSingleDiagnostic(diagnostics, Overlap, Overlap.create(entity1, entity2))
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
  assertSingleDiagnostic(diagnostics, CannotUpgrade, CannotUpgrade.create(entity1, entity2))
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
  assertSingleDiagnostic(diagnostics, ItemsIgnored, ItemsIgnored.create(entity2))
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
  assertSingleDiagnostic(diagnostics, UnsupportedProp, UnsupportedProp.create(entity2, "foo" as any))
})
