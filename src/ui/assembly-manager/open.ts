// this file exists to remove circular dependencies

import { Assembly } from "../../assembly/Assembly"

export const _open: {
  openAssemblyManager?(this: void, player: LuaPlayer, assembly: Assembly): void
} = {}
export function openAssemblyManager(player: LuaPlayer, assembly: Assembly): void {
  _open.openAssemblyManager!(player, assembly)
}
