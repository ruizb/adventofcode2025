import { FileSystem, Path } from "@effect/platform"
import { Effect, Exit, Layer, Option } from "effect"
import { describe, expect, it } from "vitest"
import { DayNumber, InputFileEmptyError, inputLines } from "./utils.ts"

describe("Utils", () => {
  it("should remove the last line if it is empty", async () => {
    const layers = Layer.merge(
      FileSystem.layerNoop({
        readFileString: () => Effect.succeed("L44\nR35\nR4\n"),
      }),
      Path.layer
    )

    const runnable = Effect.provide(
      inputLines(DayNumber(1), Option.none()),
      layers
    )

    await expect(Effect.runPromiseExit(runnable)).resolves.toEqual(
      Exit.succeed(["L44", "R35", "R4"])
    )
  })

  it("should fail if input file is empty", async () => {
    const layers = Layer.merge(
      FileSystem.layerNoop({
        readFileString: () => Effect.succeed(""),
      }),
      Path.layer
    )

    const runnable = Effect.provide(
      inputLines(DayNumber(1), Option.none()),
      layers
    )

    await expect(Effect.runPromiseExit(runnable)).resolves.toEqual(
      Exit.fail(InputFileEmptyError)
    )
  })
})
