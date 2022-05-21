import Events from "./Events"

export type VersionString = string & {
  _versionStringBrand: void
}

export function formatVersion(version: string): VersionString {
  const parts: string[] = []
  for (const [v] of string.gmatch(version, "%d+")) {
    parts.push(string.format("%02d", v))
  }
  return parts.join(".") as VersionString
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
  private preLoadMigrations: Record<VersionString, (() => void)[]> = {}
  private postLoadMigrations: Record<VersionString, (() => void)[]> = {}
  private lateOnLoadFuncs: (() => void)[] = []

  /** Runs a function when migrating from earlier than the given version. Does not run on_init. */
  from(version: string, func: () => void): void {
    ;(this.postLoadMigrations[formatVersion(version)] ||= []).push(func)
  }

  /** Runs a function either during on_init or migrating from an earlier version. */
  since(version: string, func: () => void): void {
    this.events.on_init(func)
    this.from(version, func)
  }

  /** Runs a function either during on_load, or after before-load migrations. */
  onLoadOrMigrate(func: () => void): void {
    this.events.on_load(() => {
      if (!this.preparePreLoadMigrations(this.versions.getOldVersion())) {
        func()
      } else {
        this.lateOnLoadFuncs.push(func)
      }
    })
  }

  /** Runs a function when migrating from earlier than the given version, before on_load. */
  fromBeforeLoad(version: string, func: () => void): void {
    ;(this.preLoadMigrations[formatVersion(version)] ||= []).push(func)
  }

  private getMigrationsToRun(
    oldVersion: string | undefined,
    migrations: Record<VersionString, (() => void)[]>,
  ): (() => void)[] {
    const formattedOldVersion = oldVersion && formatVersion(oldVersion)
    let versions = Object.keys(migrations) as VersionString[]
    if (formattedOldVersion) {
      versions = versions.filter((v) => formattedOldVersion < v)
    }
    table.sort(versions)
    return versions.flatMap((v) => migrations[v])
  }

  private preLoadToRun: (() => void)[] | undefined
  private preparePreLoadMigrations(oldVersion: string | undefined): boolean {
    this.preLoadToRun ??= this.getMigrationsToRun(oldVersion, this.preLoadMigrations)
    return this.preLoadToRun.length > 0
  }

  constructor(private events: Events, private versions: Versions) {}

  _init(): void {
    this.events.on_configuration_changed(() => {
      const oldVersion = this.versions.getOldVersion()
      if (this.preparePreLoadMigrations(oldVersion)) {
        for (const func of this.preLoadToRun!) func()
      }
      this.preLoadToRun = undefined
      for (const func of this.lateOnLoadFuncs) func()
      this.lateOnLoadFuncs = []
      for (const func of this.getMigrationsToRun(oldVersion, this.postLoadMigrations)) func()

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
Migration._init()
