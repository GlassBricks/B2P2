import { AreaIdentification } from "../area/AreaIdentification"
import { BlueprintPasteConflicts, BlueprintPasteOptions } from "../blueprint/blueprint-paste"
import { EntitySourceMap, EntitySourceMapBuilder } from "../blueprint/EntitySourceMap"
import { FullEntity, getTileBox } from "../entity/entity"
import { bbox } from "../lib/geometry"
import { getEntitySample } from "../test/entity-sample"
import { getWorkingArea1, getWorkingArea2 } from "../test/misc"
import { Diagnostic } from "./diagnostics/Diagnostic"
import {
  CannotUpgrade,
  ItemsIgnored,
  mapPasteConflictsToDiagnostics,
  Overlap,
  PasteDiagnosticId,
  PasteDiagnostics,
} from "./paste-diagnostics"

let entity1: FullEntity
let entity2: FullEntity
let surface: LuaSurface
let area1: AreaIdentification
let area2: AreaIdentification
let sourceMap: EntitySourceMap

let entity1SourceLocation: AreaIdentification
let entity2AssemblyLocation: AreaIdentification

before_all(() => {
  entity1 = getEntitySample("assembling-machine-1")
  entity2 = getEntitySample("assembling-machine-2")
  const [surface1, box1] = getWorkingArea1()
  area1 = { surface: surface1, area: box1 }
  const [surface2, box2] = getWorkingArea2()
  area2 = { surface: surface2, area: box2 }
  surface = surface1

  sourceMap = new EntitySourceMapBuilder().addMock(entity1, area1, area2.area.left_top).build()

  entity1SourceLocation = { surface, area: bbox.load(getTileBox(entity1)).shift(area1.area.left_top) }
  entity2AssemblyLocation = { surface, area: bbox.load(getTileBox(entity2)).shift(area2.area.left_top) }
})

function assertSingleDiagnostic(
  source: BlueprintPasteConflicts,
  expectedDiagnostic: Diagnostic,
  pasteOptions: BlueprintPasteOptions = {},
): PasteDiagnostics {
  const diagnostics = mapPasteConflictsToDiagnostics(source, pasteOptions, surface, area2.area.left_top, sourceMap)
  const id = expectedDiagnostic.id as PasteDiagnosticId
  assert.same([id], Object.keys(diagnostics))
  assert.same(1, diagnostics[id]?.length)
  assert.same(expectedDiagnostic, diagnostics[id]![0])
  return diagnostics
}

test("overlap", () => {
  const conflict: BlueprintPasteConflicts = {
    overlaps: [entity2],
  }
  const expected = Overlap.create(entity2, entity2AssemblyLocation)
  assertSingleDiagnostic(conflict, expected)
})

test.each([false, true], "upgrade, allowed: %s", (allowed) => {
  const conflict: BlueprintPasteConflicts = {
    upgrades: [
      {
        below: entity1,
        above: entity2,
      },
    ],
  }
  const expected = CannotUpgrade.create(entity1, entity1SourceLocation, entity2, entity2AssemblyLocation)
  const diagnostics = assertSingleDiagnostic(conflict, expected, { allowUpgrades: allowed })
  assert.equal(allowed || undefined, diagnostics["cannot-upgrade"]!.highlightOnly)
})

test("items", () => {
  const conflict: BlueprintPasteConflicts = {
    itemRequestChanges: [
      {
        below: entity1,
        above: entity2,
      },
    ],
  }
  const expected = ItemsIgnored.create(entity1, entity1SourceLocation, entity2, entity2AssemblyLocation)
  assertSingleDiagnostic(conflict, expected)
})
