export interface DiagnosticCategory<Id extends string> {
  readonly id: Id
  readonly shortDescription: LocalisedString // title
  readonly longDescription?: LocalisedString // tooltip
}

export interface Diagnostic {
  readonly message?: LocalisedString
  readonly location?: BoundingBoxRead
}

export interface DiagnosticsForCategory<Id extends string> {
  readonly category: DiagnosticCategory<Id>
  readonly diagnostics: Diagnostic[]
}

export type DiagnosticCollection<Id extends string = string> = {
  [K in Id]?: DiagnosticsForCategory<K>
}

export function DiagnosticCategory<Id extends string, A extends any[]>(
  id: Id,
  shortDescription: LocalisedString,
  longDescription: LocalisedString | undefined,
  factory: (this: void, ...args: A) => Diagnostic,
): DiagnosticCategory<Id> & { create: (this: void, ...args: A) => Diagnostic } {
  return {
    id,
    shortDescription,
    longDescription,
    create: factory,
  }
}

export function addDiagnostic<Id extends string, A extends any[]>(
  map: DiagnosticCollection<Id>,
  category: DiagnosticCategory<Id> & { create: (this: void, ...args: A) => Diagnostic },
  ...args: A
): void {
  const diagnostic = category.create(...args)
  const id = category.id
  const group: DiagnosticsForCategory<Id> = map[id] || (map[id] = { category, diagnostics: [] })
  group.diagnostics.push(diagnostic)
}
