export type ModVersion = [major: number, minor: number, patch: number]

export function parseVersion(version: string): ModVersion {
  const [major, minor, patch] = version.split(".").map((x) => tonumber(x))
  return [major ?? 0, minor ?? 0, patch ?? 0]
}

export function versionLess(a: ModVersion, b: ModVersion): boolean {
  if (a[0] < b[0]) return true
  if (a[0] > b[0]) return false
  if (a[1] < b[1]) return true
  if (a[1] > b[1]) return false
  return a[2] < b[2]
}

export function versionStrLess(a: string | undefined, b: string): boolean {
  if (!a) return true
  return versionLess(parseVersion(a), parseVersion(b))
}
