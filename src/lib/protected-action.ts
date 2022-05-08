import { L_Interaction } from "../locale"

export type UserError = ["bbpp:_user_error", LocalisedString, "print" | "flying-text"]

export function raiseUserError(message: LocalisedString, reportMethod: "print" | "flying-text"): never {
  throw ["bbpp:_user_error", message, reportMethod]
}

export function isUserError(obj: unknown): obj is UserError {
  return Array.isArray(obj) && obj[0] === "bbpp:_user_error" && obj.length === 3
}

export type UnexpectedError = [message: string, traceback: string]

export function protectedAction<R, T, A extends any[]>(
  player: PlayerIdentification,
  action: (this: T, ...args: A) => R,
  thisArg: T,
  ...args: A
): R | undefined
export function protectedAction<R, A extends any[]>(
  player: PlayerIdentification,
  action: (this: void, ...args: A) => R,
  ...args: A
): R | undefined
export function protectedAction<T, A extends any[]>(
  player: PlayerIdentification,
  action: (...args: A) => T,
  ...args: A
): T | undefined {
  const [success, result] = xpcall(action, getErrorWithStacktrace, ...args)
  if (success) return result as T

  player = typeof player === "object" ? player : game.get_player(player)!
  const error: UserError | UnexpectedError = result
  if (isUserError(error)) {
    const [, message, reportMethod] = error
    if (reportMethod === "print") {
      player.print(message)
    } else {
      player.create_local_flying_text({
        text: message,
        create_at_cursor: true,
      })
    }
  } else {
    reportUnexpectedError(error, player)
  }
}

function getErrorWithStacktrace(error: unknown): UserError | UnexpectedError {
  if (isUserError(error)) return error as UserError
  const errorToString = tostring(error)
  return [errorToString, debug.traceback(errorToString)]
}

function reportUnexpectedError(error: UnexpectedError, player: LuaPlayer): void {
  const [message, traceback] = error
  log(["", "Unexpected error occurred running protected action:\n", traceback])
  player.print([L_Interaction.UnexpectedError, message])
}
