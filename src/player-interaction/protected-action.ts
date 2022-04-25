import { L_Interaction } from "../locale"

export class UserError {
  constructor(public message: LocalisedString, public reportMethod: "print" | "flying-text") {}
}

export interface UnexpectedError {
  message: string
  traceback: string
}

export function protectedAction<T>(player: LuaPlayer, action: () => T): T | undefined {
  const [success, result] = xpcall(action, getErrorWithStacktrace)
  if (success) return result as T

  const error: UserError | UnexpectedError = result
  if (error instanceof UserError) {
    if (error.reportMethod === "print") {
      player.print(error.message)
    } else {
      player.create_local_flying_text({
        text: error.message,
        create_at_cursor: true,
      })
    }
  } else {
    reportUnexpectedError(error, player)
  }
}

function getErrorWithStacktrace(error: unknown): UserError | UnexpectedError {
  if (error instanceof UserError) return error as UserError
  const errorToString = tostring(error)
  return {
    message: errorToString,
    traceback: debug.traceback(errorToString),
  }
}

function reportUnexpectedError(error: UnexpectedError, player: LuaPlayer): void {
  log(["", "Unexpected error occurred running protected action:\n", error.traceback])
  player.print([L_Interaction.UnexpectedError, error.message])
}
