import Events from "./Events"

export function formatVersion(version: string): string {
  const parts: string[] = []
  for (const [v] of string.gmatch(version, "%d+")) {
    parts.push(string.format("%02d", v))
  }
  return parts.join(".")
}

export function versionLess(a: string | undefined, b: string): boolean {
  if (!a) return true
  return formatVersion(a) < formatVersion(b)
}

/** @noSelf */
interface Events {
  on_load(func: () => void): void
  on_init(func: () => void): void
  on_configuration_changed(func: () => void): void
}

/** @noSelf */
interface Versions {
  getOldVersion(): string | undefined
  setOldVersion(version: string): void
}

export class _MigrationHandler {
  private migrations: Record<string, (() => void)[]> = {}

  /** Runs a function when migrating from earlier than the given version. Does not run on_init. */
  fromBefore(version: string, func: () => void): void {
    ;(this.migrations[formatVersion(version)] ||= []).push(func)
  }

  /** Runs a function either during on_init or migrating from an earlier version. */
  since(version: string, func: () => void): void {
    this.events.on_init(func)
    this.fromBefore(version, func)
  }

  private afterMigrateFuncs: (() => void)[] = []
  /** Runs a function either during on_load, or after migrating from an earlier version. */
  onLoadOrMigrate(func: () => void): void {
    this.events.on_load(() => {
      if (!this.prepareMigrations(this.versions.getOldVersion())) func()
    })
    this.afterMigrateFuncs.push(func)
  }

  private getMigrationsToRun(oldVersion: string | undefined): (() => void)[] {
    const versions = Object.keys(this.migrations).filter((v) => versionLess(oldVersion, v))
    table.sort(versions)
    return versions.flatMap((v) => this.migrations[v])
  }

  private toRun: (() => void)[] | undefined
  private prepareMigrations(oldVersion: string | undefined): boolean {
    this.toRun ??= this.getMigrationsToRun(oldVersion)
    return this.toRun.length > 0
  }

  constructor(private events: Events, private versions: Versions) {
    this.events.on_configuration_changed(() => {
      const oldVersion = this.versions.getOldVersion()
      if (this.prepareMigrations(oldVersion)) {
        for (const func of this.toRun!) func()
      }
      this.toRun = undefined
      for (const func of this.afterMigrateFuncs) func()
      this.versions.setOldVersion(script.active_mods[script.mod_name])
    })

    this.events.on_init(() => {
      this.versions.setOldVersion(script.active_mods[script.mod_name])
    })
  }
}

declare const global: {
  oldVersion: string | undefined
}
export const Migration = new _MigrationHandler(Events, {
  getOldVersion: () => global.oldVersion,
  setOldVersion: (version) => {
    global.oldVersion = version
  },
})
