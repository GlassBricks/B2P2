import { AreaIdentification } from "../../area/AreaIdentification"
import { Mutable } from "../../lib"

export interface DiagnosticCategory<Id extends string> {
  readonly id: Id
  readonly title: LocalisedString
  readonly tooltip?: LocalisedString
  readonly highlightType?: CursorBoxRenderType
}

export interface Diagnostic<Id extends string = string> {
  readonly id: Id
  readonly message?: LocalisedString
  readonly location?: AreaIdentification
  readonly altLocation?: AreaIdentification
}

export type DiagnosticCollection<Id extends string = string> = {
  [K in Id]?: Diagnostic[] & {
    highlightOnly?: boolean
  }
}

const categories = new Map<string, DiagnosticCategory<string>>()

export function DiagnosticCategory<Id extends string, A extends any[]>(
  category: DiagnosticCategory<Id>,
  factory: (this: void, ...args: A) => Omit<Diagnostic, "id">,
): DiagnosticCategory<Id> & { create: (this: void, ...args: A) => Diagnostic<Id> } {
  const id = category.id
  if (categories.has(id)) {
    error("Duplicate diagnostic category: " + id)
  }

  const result = {
    ...category,
    create(this: void, ...args: A) {
      const diagnostic = factory(...args) as Mutable<Diagnostic<Id>>
      diagnostic.id = id
      return diagnostic
    },
  }
  categories.set(id, category)
  return result
}

export function getDiagnosticCategory<Id extends string>(id: Id): DiagnosticCategory<Id> | undefined {
  return categories.get(id) as DiagnosticCategory<Id> | undefined
}

export function addDiagnostic<Id extends string, A extends any[]>(
  map: DiagnosticCollection<Id>,
  category: DiagnosticCategory<Id> & { create: (this: void, ...args: A) => Diagnostic },
  ...args: A
): Diagnostic {
  const diagnostic = category.create(...args)
  const id = category.id
  // noinspection JSMismatchedCollectionQueryUpdate
  const arr: Diagnostic[] = map[id] || (map[id] = [])
  arr.push(diagnostic)
  return diagnostic
}

const defaultType: CursorBoxRenderType = "entity"

export function getDiagnosticHighlightType(categoryId: string): CursorBoxRenderType {
  return categories.get(categoryId)?.highlightType ?? defaultType
}
