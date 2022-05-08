import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { FullEntity, getTileBox } from "../entity/entity"
import { getEntitySample } from "../test/entity-sample"
import {
  CannotUpgrade,
  ItemsIgnored,
  mapPasteConflictsToDiagnostics,
  Overlap,
  PasteDiagnosticId,
  PasteDiagnostics,
  UnsupportedProp,
} from "./paste-diagnostics"
import { Diagnostic } from "./diagnostics/Diagnostic"
import { getWorkingArea1, getWorkingArea2 } from "../test/misc"
import { AreaIdentification } from "./AreaIdentification"
import { EntitySourceMap, EntitySourceMapBuilder } from "./EntitySourceMap"
import { bbox } from "../lib/geometry/bounding-box"

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

function assertSingleDiagnostic(map: PasteDiagnostics, expectedDiagnostic: Diagnostic) {
  const id = expectedDiagnostic.id as PasteDiagnosticId
  assert.same([id], Object.keys(map))
  assert.same(1, map[id]?.length)
  assert.same(expectedDiagnostic, map[id]![0])
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

  const entity1AssemblyLocation = { surface, area: bbox.load(getTileBox(entity1)).shift(area2.area.left_top) }
  const entity2SourceLocation = { surface, area: bbox.load(getTileBox(entity2)).shift(area1.area.left_top) }

  const expected = Overlap.create(
    entity1,
    entity2,
    entity1AssemblyLocation,
    entity2AssemblyLocation,
    entity1SourceLocation,
    entity2SourceLocation,
  )

  const diagnostics = mapPasteConflictsToDiagnostics(conflict, surface, area2.area.left_top, sourceMap)
  assertSingleDiagnostic(diagnostics, expected)
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
  const diagnostics = mapPasteConflictsToDiagnostics(conflict, surface, area2.area.left_top, sourceMap)
  const expected = CannotUpgrade.create(entity1, entity1SourceLocation, entity2, entity2AssemblyLocation)
  assertSingleDiagnostic(diagnostics, expected)
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
  const diagnostics = mapPasteConflictsToDiagnostics(conflict, surface, area2.area.left_top, sourceMap)
  const expected = ItemsIgnored.create(entity1, entity1SourceLocation, entity2, entity2AssemblyLocation)
  assertSingleDiagnostic(diagnostics, expected)
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
  const diagnostics = mapPasteConflictsToDiagnostics(conflict, surface, area2.area.left_top, sourceMap)
  const expected = UnsupportedProp.create(entity1, entity1SourceLocation, entity2, entity2AssemblyLocation, "foo")
  assertSingleDiagnostic(diagnostics, expected)
})
